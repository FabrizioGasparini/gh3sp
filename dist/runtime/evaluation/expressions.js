"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluate_binary_expression = evaluate_binary_expression;
exports.evaluate_identifier = evaluate_identifier;
exports.evaluate_assignment_expression = evaluate_assignment_expression;
exports.evaluate_compound_assignment_expression = evaluate_compound_assignment_expression;
exports.evaluate_object_expression = evaluate_object_expression;
exports.evaluate_member_expression = evaluate_member_expression;
exports.evaluate_call_expression = evaluate_call_expression;
exports.evaluate_if_expression = evaluate_if_expression;
exports.evaluate_for_expression = evaluate_for_expression;
exports.evaluate_while_expression = evaluate_while_expression;
const environments_1 = __importDefault(require("../environments"));
const interpreter_1 = require("../interpreter");
const values_1 = require("../values");
const values_2 = require("../values");
function evaluate_numeric_binary_expression(left, right, operator) {
    let result = 0;
    switch (operator) {
        case "+":
            result = left.value + right.value;
            break;
        case "-":
            result = left.value + right.value;
            break;
        case "*":
            result = left.value + right.value;
            break;
        case "/":
            result = left.value + right.value;
            break;
        case "%":
            result = left.value + right.value;
            break;
        case "^":
            result = left.value + right.value;
            break;
    }
    return { value: result, type: "number" };
}
function evaluate_string_binary_expression(left, right, operator) {
    let result = "";
    if (operator == "+")
        result = left.value + right.value;
    else
        throw "Invalid operation between strings: '" + operator + "'";
    return { value: result, type: "string" };
}
function evaluate_mixed_string_numeric_binary_expression(string, number, operator) {
    let result = "";
    if (operator == "*")
        for (let i = 0; i < number.value; i++)
            result += string.value;
    else
        throw "Invalid operation between string and number: '" + operator + "'";
    return { value: result, type: "string" };
}
function evaluate_comparison_binary_expression(left, right, operator) {
    switch (operator) {
        case "==":
            if (left.type == right.type)
                return (0, values_1.MK_BOOL)(left.value == right.value);
            break;
        case "!=":
            if (left.type == right.type)
                return (0, values_1.MK_BOOL)(left.value != right.value);
            break;
        case ">=":
            if (left.type == "boolean" && right.type == "boolean")
                return (0, values_1.MK_BOOL)(left.value >= right.value);
            else if (left.type == "number" && right.type == "number")
                return (0, values_1.MK_BOOL)(left.value >= right.value);
            break;
        case "<=":
            if (left.type == "boolean" && right.type == "boolean")
                return (0, values_1.MK_BOOL)(left.value <= right.value);
            else if (left.type == "number" && right.type == "number")
                return (0, values_1.MK_BOOL)(left.value <= right.value);
            break;
        case ">":
            if (left.type == "boolean" && right.type == "boolean")
                return (0, values_1.MK_BOOL)(left.value > right.value);
            else if (left.type == "number" && right.type == "number")
                return (0, values_1.MK_BOOL)(left.value > right.value);
            break;
        case "<":
            if (left.type == "boolean" && right.type == "boolean")
                return (0, values_1.MK_BOOL)(left.value < right.value);
            else if (left.type == "number" && right.type == "number")
                return (0, values_1.MK_BOOL)(left.value < right.value);
            break;
        default:
            throw "Invalid comparison operator: '" + operator + "'";
    }
    throw "Invalid comparison operator: '" + operator + "'" + " between type '" + left.type + "' and '" + right.type + "'";
}
function evaluate_binary_expression(binop, env) {
    const left = (0, interpreter_1.evaluate)(binop.left, env);
    const right = (0, interpreter_1.evaluate)(binop.right, env);
    const op = binop.operator;
    if (left == undefined || right == undefined)
        throw 'Missing required parameter';
    if (op == "+" || op == "-" || op == "*" || op == "/" || op == "%" || op == "^") {
        if (left.type == "number" && right.type == "number")
            return evaluate_numeric_binary_expression(left, right, op);
        else if (left.type == "string" && right.type == "string")
            return evaluate_string_binary_expression(left, right, op);
        else if (left.type == "string" && right.type == "number")
            return evaluate_mixed_string_numeric_binary_expression(left, right, op);
        else if (left.type == "number" && right.type == "string")
            return evaluate_mixed_string_numeric_binary_expression(right, left, op);
    }
    else if (op == "==" || op == "!=" || op == "<=" || op == ">=" || op == "<" || op == ">")
        return evaluate_comparison_binary_expression(left, right, op);
    return (0, values_2.MK_NULL)();
}
function evaluate_identifier(ident, env) {
    const val = env.lookupVar(ident.symbol);
    return val;
}
function evaluate_assignment_expression(node, env) {
    if (node.assigne.kind != "Identifier")
        throw 'Invalid assignment expression ' + JSON.stringify(node.assigne);
    const varname = node.assigne.symbol;
    return env.assignVar(varname, (0, interpreter_1.evaluate)(node.value, env));
}
function evaluate_compound_assignment_expression(node, env) {
    if (node.assigne.kind != "Identifier")
        throw 'Invalid compound assignment expression ' + JSON.stringify(node.assigne);
    const varname = node.assigne.symbol;
    const currentValue = env.lookupVar(varname);
    const value = (0, interpreter_1.evaluate)(node.value, env);
    /*if (currentValue.type != value.type)
        throw "Invalid compound assignment between type '" + currentValue.type + "' and '" + value.type + "'"*/
    const op = node.operator.replace("=", "");
    let newValue = (0, values_2.MK_NULL)();
    if (currentValue.type == "number" && value.type == "number")
        newValue = evaluate_numeric_binary_expression(currentValue, value, op);
    else if (currentValue.type == "string" && value.type == "string")
        newValue = evaluate_string_binary_expression(currentValue, value, op);
    else if (currentValue.type == "string" && value.type == "number")
        newValue = evaluate_mixed_string_numeric_binary_expression(currentValue, value, op);
    else if (currentValue.type == "number" && value.type == "string")
        newValue = evaluate_mixed_string_numeric_binary_expression(value, currentValue, op);
    else
        return (0, values_2.MK_NULL)();
    return env.assignVar(varname, newValue);
}
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
    for (const prop of props)
        objProps = objProps.get(prop.symbol).properties;
    console.log(member.property);
    let propKey;
    if (member.property.kind == "Identifier" && !member.computed)
        propKey = member.property.symbol;
    else if (member.property.kind == "StringLiteral" && member.computed)
        propKey = member.property.value;
    else
        throw 'Invalid object key access. Expected valid key (e.g., obj.key or obj["key"]), but received: ' + JSON.stringify(member.property);
    return objProps.get(propKey);
}
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
        let result = (0, values_2.MK_NULL)();
        for (const statement of func.body)
            result = (0, interpreter_1.evaluate)(statement, scope);
        return result;
    }
    throw "Cannot call value that is not a function: " + JSON.stringify(fn);
}
function evaluate_if_expression(node, env) {
    const condition = (0, interpreter_1.evaluate)(node.condition, env);
    if (condition.value == true) {
        let result = (0, values_2.MK_NULL)();
        for (const statement of node.then)
            result = (0, interpreter_1.evaluate)(statement, env);
        return result;
    }
    else {
        if (node.else) {
            let result = (0, values_2.MK_NULL)();
            for (const statement of node.else)
                result = (0, interpreter_1.evaluate)(statement, env);
            return result;
        }
    }
    return (0, values_2.MK_NULL)();
}
function evaluate_for_expression(node, env) {
    let assignment;
    if (node.declared)
        assignment = node.assignment;
    else
        assignment = node.assignment;
    (0, interpreter_1.evaluate)(assignment, env);
    let condition = (0, interpreter_1.evaluate)(node.condition, env);
    let result = (0, values_2.MK_NULL)();
    while (condition.value) {
        for (const statement of node.body)
            result = (0, interpreter_1.evaluate)(statement, env);
        (0, interpreter_1.evaluate)(node.compoundAssignment, env);
        condition = (0, interpreter_1.evaluate)(node.condition, env);
    }
    return result;
}
function evaluate_while_expression(node, env) {
    const maxIterations = 10000;
    let iterations = 0;
    let condition = (0, interpreter_1.evaluate)(node.condition, env);
    let result = (0, values_2.MK_NULL)();
    while (condition.value) {
        if (iterations++ >= maxIterations)
            throw "Potential infinite loop detected. Loop exceeded the maximum number of allowed iterations (10000).";
        for (const statement of node.body)
            result = (0, interpreter_1.evaluate)(statement, env);
        condition = (0, interpreter_1.evaluate)(node.condition, env);
    }
    return result;
}
