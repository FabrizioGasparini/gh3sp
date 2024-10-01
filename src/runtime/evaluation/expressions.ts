import { AssignmentExpression, BinaryExpression, CallExpression, CompoundAssignmentExpression, Expression, Identifier, IfExpression, MemberExpression, ObjectLiteral } from "../../frontend/ast.ts";
import Environment from "../environments.ts";
import { evaluate } from "../interpreter.ts";
import { BoolValue, FunctionValue, MK_BOOL, StringValue } from "../values.ts";
import { NumberValue, RuntimeValue, MK_NULL, ObjectValue, NativeFunctionValue } from "../values.ts";

function evaluate_numeric_binary_expression(left: NumberValue, right: NumberValue, operator: string): NumberValue {
    let result: number = 0;
    
    switch (operator)
    {
        case "+":
            result = left.value + right.value
            break
        
        case "-":
            result = left.value + right.value
            break
        
        case "*":
            result = left.value + right.value
            break
        
        case "/":
            result = left.value + right.value
            break
        
        case "%":
            result = left.value + right.value
            break
        
        case "^":
            result = left.value + right.value
            break
    }

    return { value: result, type: "number" } as NumberValue;
}

function evaluate_string_binary_expression(left: StringValue, right: StringValue, operator: string): StringValue {
    let result: string = "";
    
    if (operator == "+")
        result = left.value + right.value;
    else
        throw "Invalid operation between strings: '" + operator + "'"
    
    return { value: result, type: "string" } as StringValue;
}

function evaluate_mixed_string_numeric_binary_expression(string: StringValue, number: NumberValue, operator: string): StringValue {
    let result: string = "";
    
    if (operator == "*")
        for (let i = 0; i < number.value; i++) 
    result += string.value;
    else
        throw "Invalid operation between string and number: '" + operator + "'"

    return { value: result, type: "string" } as StringValue;
}


function evaluate_comparison_binary_expression(left: RuntimeValue, right: RuntimeValue, operator: string): BoolValue {
    switch (operator)
    {
        case "==":
            if (left.type == right.type) return MK_BOOL(left.value == right.value)
            break
        
        case "!=":
            if (left.type == right.type) return MK_BOOL(left.value != right.value)
            break

        case ">=":
            if (left.type == "boolean" && right.type == "boolean") return MK_BOOL(left.value >= right.value)
            else if (left.type == "number" && right.type == "number") return MK_BOOL(left.value >= right.value)
            break
            
        case "<=":
            if (left.type == "boolean" && right.type == "boolean") return MK_BOOL(left.value <= right.value)
            else if (left.type == "number" && right.type == "number") return MK_BOOL(left.value <= right.value)
            break
                
        case ">":
            if (left.type == "boolean" && right.type == "boolean") return MK_BOOL(left.value > right.value)
            else if (left.type == "number" && right.type == "number") return MK_BOOL(left.value > right.value)
            break

        case "<":
            if (left.type == "boolean" && right.type == "boolean") return MK_BOOL(left.value < right.value)
            else if (left.type == "number" && right.type == "number") return MK_BOOL(left.value < right.value)        
            break
        
        default:
            throw "Invalid comparison operator: '" + operator + "'"
    }
        
    throw "Invalid comparison operator: '" + operator + "'" + " between type '" + left.type + "' and '" + right.type + "'"
}

export function evaluate_binary_expression(binop: BinaryExpression, env: Environment): RuntimeValue {
    const left = evaluate(binop.left, env);
    const right = evaluate(binop.right, env);

    const op = binop.operator

    if (op == "+" || op == "-" || op == "*" || op == "/" || op == "%" || op == "^") {
        if (left.type == "number" && right.type == "number")
            return evaluate_numeric_binary_expression(left as NumberValue, right as NumberValue, op);
        
        else if (left.type == "string" && right.type == "string") 
            return evaluate_string_binary_expression(left as StringValue, right as StringValue, op)

        else if (left.type == "string" && right.type == "number")
            return evaluate_mixed_string_numeric_binary_expression(left as StringValue, right as NumberValue, op)
        else if (left.type == "number" && right.type == "string")
            return evaluate_mixed_string_numeric_binary_expression(right as StringValue, left as NumberValue, op)
    }
    else if(op == "==" || op == "!=" || op == "<=" || op == ">=" || op == "<" || op == ">")
        return evaluate_comparison_binary_expression(left, right, op);

    return MK_NULL();
}

export function evaluate_identifier(ident: Identifier, env: Environment): RuntimeValue {
    const val = env.lookupVar(ident.symbol);
    return val
}

export function evaluate_assignment_expression(node: AssignmentExpression, env: Environment): RuntimeValue {
    if (node.assigne.kind != "Identifier")
        throw 'Invalid assignment expression ' + JSON.stringify(node.assigne)

    const varname = (node.assigne as Identifier).symbol
    return env.assignVar(varname, evaluate(node.value, env))
}

export function evaluate_compound_assignment_expression(node: CompoundAssignmentExpression, env: Environment): RuntimeValue {
    if (node.assigne.kind != "Identifier")
        throw 'Invalid compound assignment expression ' + JSON.stringify(node.assigne)
    
    const varname = (node.assigne as Identifier).symbol;
    const currentValue = env.lookupVar(varname);

    const value = evaluate(node.value, env);

    /*if (currentValue.type != value.type)
        throw "Invalid compound assignment between type '" + currentValue.type + "' and '" + value.type + "'"*/

    const op = node.operator.replace("=", "")

    let newValue: RuntimeValue = MK_NULL();
    if (currentValue.type == "number" && value.type == "number")
        newValue = evaluate_numeric_binary_expression(currentValue as NumberValue, value as NumberValue, op);
    
    else if (currentValue.type == "string" && value.type == "string") 
        newValue = evaluate_string_binary_expression(currentValue as StringValue, value as StringValue, op)

    else if (currentValue.type == "string" && value.type == "number")
        newValue = evaluate_mixed_string_numeric_binary_expression(currentValue as StringValue, value as NumberValue, op)
    else if (currentValue.type == "number" && value.type == "string")
        newValue = evaluate_mixed_string_numeric_binary_expression(value as StringValue, currentValue as NumberValue, op)
    else
        return MK_NULL();

    return env.assignVar(varname, newValue)
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
    for (const prop of props)
        objProps = (objProps.get(prop.symbol) as ObjectValue).properties
    

    const prop = objProps.get((member.property as Identifier).symbol);
    if (prop == undefined)
        return MK_NULL()

    return prop
}

export function evaluate_call_expression(call: CallExpression, env: Environment): RuntimeValue {
    const args = call.args.map((arg: Expression) => evaluate(arg, env));
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
        for (const statement of func.body)
            result = evaluate(statement, scope);

        return result;
    }
    
    throw "Cannot call value that is not a function: " + JSON.stringify(fn)
}

export function evaluate_if_expression(binop: IfExpression, env: Environment): RuntimeValue {
    const condition = evaluate(binop.condition, env);
    
    if (condition.value == true)
    {
        let result: RuntimeValue = MK_NULL();
        for (const statement of binop.then)
            result = evaluate(statement, env);

        return result;
    }
    else
    {
        if (binop.else)
        {
            let result: RuntimeValue = MK_NULL();
            for (const statement of binop.else)
                result = evaluate(statement, env);

            return result;
        }
    }

    return MK_NULL();
}
