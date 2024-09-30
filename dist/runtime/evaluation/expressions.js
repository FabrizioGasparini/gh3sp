"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluate_call_expression = exports.evaluate_member_expression = exports.evaluate_object_expression = exports.evaluate_assignment_expression = exports.evaluate_identifier = exports.evaluate_binary_expression = void 0;
const environments_1 = __importDefault(require("../environments"));
const interpreter_1 = require("../interpreter");
const values_1 = require("../values");
function evaluate_numeric_binary_expression(left, right, operator) {
    let result = 0;
    if (operator == "+")
        result = left.value + right.value;
    else if (operator == "-")
        result = left.value - right.value;
    else if (operator == "*")
        result = left.value * right.value;
    else if (operator == "/")
        // TODO: Division by 0 checks
        result = left.value / right.value;
    else if (operator == "%")
        result = left.value % right.value;
    else if (operator == "^")
        result = Math.pow(left.value, right.value);
    return { value: result, type: "number" };
}
function evaluate_binary_expression(binop, env) {
    const left = (0, interpreter_1.evaluate)(binop.left, env);
    const right = (0, interpreter_1.evaluate)(binop.right, env);
    if (left.type == "number" && right.type == "number") {
        return evaluate_numeric_binary_expression(left, right, binop.operator);
    }
    return (0, values_1.MK_NULL)();
}
exports.evaluate_binary_expression = evaluate_binary_expression;
function evaluate_identifier(ident, env) {
    const val = env.lookupVar(ident.symbol);
    return val;
}
exports.evaluate_identifier = evaluate_identifier;
function evaluate_assignment_expression(node, env) {
    if (node.assigne.kind != "Identifier")
        throw `Invalid assignment expression ${JSON.stringify(node.assigne)}`;
    const varname = node.assigne.symbol;
    return env.assignVar(varname, (0, interpreter_1.evaluate)(node.value, env));
}
exports.evaluate_assignment_expression = evaluate_assignment_expression;
function evaluate_object_expression(obj, env) {
    const object = { type: "object", properties: new Map() };
    for (const { key, value } of obj.properties) {
        const runtimeVal = (value == undefined)
            ? env.lookupVar(key)
            : (0, interpreter_1.evaluate)(value, env);
        object.properties.set(key, runtimeVal);
    }
    return object;
}
exports.evaluate_object_expression = evaluate_object_expression;
function evaluate_member_expression(member, env) {
    let object = member.object;
    const props = [];
    while (object.kind == "MemberExpression") {
        const obj = object;
        props.push(obj.property);
        object = obj.object;
    }
    props.reverse();
    //const props = (env.lookupVar(varname) as ObjectValue).properties
    const varname = object.symbol;
    let objProps = env.lookupVar(varname).properties;
    for (const prop of props) {
        objProps = objProps.get(prop.symbol).properties;
    }
    const prop = objProps.get(member.property.symbol);
    if (prop == undefined)
        return (0, values_1.MK_NULL)();
    return prop;
}
exports.evaluate_member_expression = evaluate_member_expression;
function evaluate_call_expression(call, env) {
    const args = call.args.map((arg) => (0, interpreter_1.evaluate)(arg, env));
    const fn = (0, interpreter_1.evaluate)(call.caller, env);
    if (fn.type == "native-function") {
        const result = fn.call(args, env);
        return result;
    }
    if (fn.type == "function") {
        const func = fn;
        const scope = new environments_1.default(func.declarationEnv);
        for (let i = 0; i < func.parameters.length; i++) {
            const varname = func.parameters[i];
            scope.declareVar(varname, args[i], false);
        }
        let result = (0, values_1.MK_NULL)();
        for (const statement of func.body) {
            result = (0, interpreter_1.evaluate)(statement, scope);
        }
        return result;
    }
    throw "Cannot call value that is not a function: " + JSON.stringify(fn);
}
exports.evaluate_call_expression = evaluate_call_expression;
