import { AssignmentExpression, BinaryExpression, CallExpression, Identifier, MemberExpression, ObjectLiteral } from "../../frontend/ast.ts";
import Environment from "../environments.ts";
import { evaluate } from "../interpreter.ts";
import { FunctionValue } from "../values.ts";
import { NumberValue, RuntimeValue, MK_NULL, ObjectValue, NativeFunctionValue } from "../values.ts";

function evaluate_numeric_binary_expression(left: NumberValue, right: NumberValue, operator: string): NumberValue {
    let result: number = 0;
    
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
        result = left.value ** right.value;

    return { value: result, type: "number" } as NumberValue;
}

export function evaluate_binary_expression(binop: BinaryExpression, env: Environment): RuntimeValue {
    const left = evaluate(binop.left, env);
    const right = evaluate(binop.right, env);

    if (left.type == "number" && right.type == "number") {
        return evaluate_numeric_binary_expression(left as NumberValue, right as NumberValue, binop.operator);
    }

    return MK_NULL();
}

export function evaluate_identifier(ident: Identifier, env: Environment): RuntimeValue {
    const val = env.lookupVar(ident.symbol);
    return val
}

export function evaluate_assignment_expression(node: AssignmentExpression, env: Environment): RuntimeValue {
    if (node.assigne.kind != "Identifier")
        throw `Invalid assignment expression ${JSON.stringify(node.assigne)}`

    const varname = (node.assigne as Identifier).symbol
    return env.assignVar(varname, evaluate(node.value, env))
}

export function evaluate_object_expression(obj: ObjectLiteral, env: Environment): RuntimeValue {
    const object = { type: "object", properties: new Map() } as ObjectValue;
    for (const { key, value } of obj.properties) {
        const runtimeVal = (value == undefined)
            ? env.lookupVar(key)
            : evaluate(value, env);
        
        object.properties.set(key, runtimeVal);
    }

    return object
}

export function evaluate_member_expression(member: MemberExpression, env: Environment): RuntimeValue {
    let object = member.object
    const props: Identifier[] = []
    while (object.kind == "MemberExpression") {
        const obj = object as MemberExpression;

        props.push(obj.property as Identifier)
        object = obj.object;
    }
    props.reverse()

    
    //const props = (env.lookupVar(varname) as ObjectValue).properties
    const varname = (object as Identifier).symbol;
    let objProps = (env.lookupVar(varname) as ObjectValue).properties
    for (const prop of props) {
        objProps = (objProps.get(prop.symbol) as ObjectValue).properties
    }

    const prop = objProps.get((member.property as Identifier).symbol);
    if (prop == undefined)
        return MK_NULL()

    return prop
}

export function evaluate_call_expression(call: CallExpression, env: Environment): RuntimeValue {
    const args = call.args.map((arg) => evaluate(arg, env));
    const fn = evaluate(call.caller, env);

    if (fn.type == "native-function") {
        const result = (fn as NativeFunctionValue).call(args, env); 
        return result;
    }   
    
    if (fn.type == "function") {
        const func = fn as FunctionValue;
        const scope = new Environment(func.declarationEnv);

        for (let i = 0; i < func.parameters.length; i++) {
            const varname = func.parameters[i];
            scope.declareVar(varname, args[i], false)
        }

        let result: RuntimeValue = MK_NULL();
        for (const statement of func.body) {
            result = evaluate(statement, scope);
        }

        return result;
    }
    
    throw "Cannot call value that is not a function: " + JSON.stringify(fn)
}