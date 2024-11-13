import { AssignmentExpression, BinaryExpression, CallExpression, CompoundAssignmentExpression, Expression, Identifier, ListLiteral, MemberExpression, ObjectLiteral, StringLiteral, type LogicalExpression, type NumericLiteral, type TernaryExpression } from "../../frontend/ast.ts";
import { InterpreterError, MathError } from "../../utils/errors_handler.ts";
import Environment from "../environments.ts";
import { evaluate, throwError } from "../interpreter.ts";
import { BoolValue, FunctionValue, ListValue, MK_BOOL, StringValue } from "../values.ts";
import { NumberValue, RuntimeValue, MK_NULL, ObjectValue, NativeFunctionValue } from "../values.ts";

function evaluate_numeric_binary_expression(left: NumberValue, right: NumberValue, operator: string): NumberValue {
    let result: number = 0;

    switch (operator) {
        case "+":
            result = left.value + right.value;
            break;

        case "-":
            result = left.value - right.value;
            break;

        case "*":
            result = left.value * right.value;
            break;

        case "/":
            if (right.value === 0) throw throwError(new MathError("Division by zero is not allowed"));
            result = left.value / right.value;
            break;

        case "%":
            result = left.value % right.value;
            break;

        case "^":
            result = left.value ** right.value;
            break;

        case "//":
            result = parseInt((left.value / right.value).toString());
            break;
    }

    return { value: result, type: "number" } as NumberValue;
}

function evaluate_string_binary_expression(left: StringValue, right: StringValue, operator: string): StringValue {
    let result: string = "";

    if (operator == "+") result = left.value + right.value;
    else throwError(new InterpreterError("Invalid operation between strings: '" + operator + "'"));

    return { value: result, type: "string" } as StringValue;
}

function evaluate_mixed_string_numeric_binary_expression(string: StringValue, number: NumberValue, operator: string): StringValue {
    let result: string = "";

    if (operator == "*") for (let i = 0; i < number.value; i++) result += string.value;
    else throw throwError(new InterpreterError("Invalid operation between string and number: '" + operator + "'"));

    return { value: result, type: "string" } as StringValue;
}

function evaluate_mixed_binary_expression(left: RuntimeValue, right: RuntimeValue, operator: string): RuntimeValue {
    switch (left.type) {
        case "number": {
            if(right.type == "number") return evaluate_numeric_binary_expression(left as NumberValue, right as NumberValue, operator);
            else if (right.type == "string") return evaluate_mixed_string_numeric_binary_expression(right as StringValue, left as NumberValue, operator);
            break;
        }
        
        case "string": {
            if (right.type == "string") return evaluate_string_binary_expression(left as StringValue, right as StringValue, operator);
            else if (right.type == "number") return evaluate_mixed_string_numeric_binary_expression(left as StringValue, right as NumberValue, operator);
            break;
        }
        
        case "list": {
            if (right.type == "list") return evaluate_list_binary_expression(left as ListValue, right as ListValue, operator);
            break;
        }
    }

    return MK_NULL()
}

function evaluate_list_binary_expression(left: ListValue, right: ListValue, operator: string): ListValue {
    switch (operator) {
        case "+":
            return {
                type: "list",
                value: right.value.concat(left.value),
            } as ListValue;

        default:
            throw throwError(new InterpreterError("Invalid operation '" + operator + "' between lists"));
    }
}

function compare_lists(a: RuntimeValue[], b: RuntimeValue[]): boolean {
    if (a.length != b.length) return false;
    
    for (let i = 0; i < a.length - 1; i++)
    {
        if (a[i].value != b[i].value) return false;
    }

    return true;
}

function evaluate_comparison_binary_expression(left: RuntimeValue, right: RuntimeValue, operator: string): BoolValue {
    switch (operator) {
        case "==":
            if (left.type == right.type) {
                if (left.type == "list") return MK_BOOL(compare_lists(left.value, right.value))
                    else return MK_BOOL(left.value == right.value);
            }
            break;
            
        case "!=":
            if (left.type == right.type) {
                if (left.type == "list") return MK_BOOL(!compare_lists(left.value, right.value))
                    else return MK_BOOL(left.value != right.value);
            }
            break;

        case ">=":
            if (left.type == "boolean" && right.type == "boolean") return MK_BOOL(left.value >= right.value);
            else if (left.type == "number" && right.type == "number") return MK_BOOL(left.value >= right.value);
            break;

        case "<=":
            if (left.type == "boolean" && right.type == "boolean") return MK_BOOL(left.value <= right.value);
            else if (left.type == "number" && right.type == "number") return MK_BOOL(left.value <= right.value);
            break;

        case ">":
            if (left.type == "boolean" && right.type == "boolean") return MK_BOOL(left.value > right.value);
            else if (left.type == "number" && right.type == "number") return MK_BOOL(left.value > right.value);
            break;

        case "<":
            if (left.type == "boolean" && right.type == "boolean") return MK_BOOL(left.value < right.value);
            else if (left.type == "number" && right.type == "number") return MK_BOOL(left.value < right.value);
            break;

        default:
            throw throwError(new InterpreterError("Invalid comparison operator: '" + operator + "'"));
    }

    throw throwError(new InterpreterError("Invalid comparison operator: '" + operator + "'" + " between type '" + left.type + "' and '" + right.type + "'"));
}

export function evaluate_binary_expression(node: BinaryExpression, env: Environment): RuntimeValue {
    const left = evaluate(node.left, env);
    const right = evaluate(node.right, env);
    
    const op = node.operator;

    if (left == undefined || right == undefined) throw throwError(new InterpreterError("Missing required parameter inside binary expression"));

    if (op == "??") return left.type == "null" ? right : left;

    if (op == "+" || op == "-" || op == "*" || op == "/" || op == "%" || op == "^" || op == "//") return evaluate_mixed_binary_expression(left, right, op);
    else if (op == "==" || op == "!=" || op == "<=" || op == ">=" || op == "<" || op == ">") return evaluate_comparison_binary_expression(left, right, op);

    return MK_NULL();
}

export function evaluate_logical_expression(node: LogicalExpression, env: Environment): RuntimeValue {
    const left = evaluate(node.left, env);
    const right = evaluate(node.right, env);

    const op = node.operator;

    if (left == undefined || right == undefined) throw throwError(new InterpreterError("Missing required parameter inside logical expression"));
    
    
    if (op == "&&") return MK_BOOL(left.value && right.value);
    else if (op == "||") return MK_BOOL(left.value || right.value);
    else if (op == "!") {
        if (left.type != "boolean" || right.type != "boolean") throw throwError(new InterpreterError("Invalid parameter inside logical expression. Expected boolean value."));
        return MK_BOOL(!right.value);
    }

    return MK_NULL();
}

export function evaluate_identifier(ident: Identifier, env: Environment): RuntimeValue {
    const val = env.lookupVar(ident.symbol);
    return val;
}

function get_member_expression_result(node: MemberExpression, env: Environment): RuntimeValue {
    let object = node.object
    if (object.kind != "Identifier") while (object.kind != "Identifier") object = (object as MemberExpression).object

    const object_name = (object as Identifier).symbol
    return (env.lookupVar(object_name) as ObjectValue)
}

function get_member_expression_variable(node: MemberExpression): Identifier {
    let object = node.object
    if (object.kind != "Identifier") while (object.kind != "Identifier") object = (object as MemberExpression).object

    const object_name = (object as Identifier)
    return object_name
}

function get_object_props(node: MemberExpression): string[] {
    let object = node.object
    
    const props: string[] = [node.computed ? (node.property as StringLiteral).value : (node.property as Identifier).symbol]
    
    if (node.computed) {
        if (object.kind != "Identifier")
        {
            while (object.kind != "Identifier") {
                props.unshift(((object as MemberExpression).property as StringLiteral).value)
                object = (object as MemberExpression).object
            }
        }
    }
    else {        
        if (object.kind != "Identifier")
        {
            while (object.kind != "Identifier") {
                props.unshift(((object as MemberExpression).property as Identifier).symbol)
                object = (object as MemberExpression).object
            }
        }
    }

    return props
}

export function evaluate_assignment_expression(node: AssignmentExpression, env: Environment): RuntimeValue {
    switch (node.assignee.kind) {
        // a = value
        case "Identifier":            
            return env.assignVar((node.assignee as Identifier).symbol, evaluate(node.value, env));
        
        // obj[key] = value, list[idx] = value
        case "MemberExpression": {
            const member = node.assignee as MemberExpression 

            const expression = get_member_expression_result(member, env)
            const variable = get_member_expression_variable(member).symbol

            switch (expression.type) {
                case "list": {
                    const idx = (member.property as NumericLiteral).value; 
                    if (typeof idx != "number") throw throwError(new InterpreterError("Invalid list index: " + idx))
                    
                    expression.value[idx] = evaluate(node.value, env);
                    
                    return env.assignVar(variable, expression)
                }
                
                case "object": {
                    const object = expression
                    const props = get_object_props(member)
                    const key = props.pop()!

                    if (!key) throw throwError(new InterpreterError("Invalid object key (not found)"))
                        
                    let result = object;
                    for (const prop of props) {
                        if((result as ObjectValue).properties.has(prop)) result = (result as ObjectValue).properties.get(prop)!//new_value = new_value.get(prop)
                    }
                        
                    if (!(result as ObjectValue).properties.has(key)) {
                        // Here the "invalid" keys can be handled, like creating a new key if the given one is not found inside the object
                        //throw throwError(new InterpreterError("Invalid object key (not found)"))
                    }
                    
                    (result as ObjectValue).properties.set(key, evaluate(node.value, env))
                    return env.assignVar(variable, object)
                }
                
                default:
                    throw throwError(new InterpreterError("Invalid assignment expression " + JSON.stringify(node.assignee)));
            }
        }
        
        default:
            throw throwError(new InterpreterError("Invalid assignment expression " + JSON.stringify(node.assignee)));
    }
   
    
    /*
    const variable = get_expression_result((node.assignee as MemberExpression), env)
    if(variable.type == "list") {
        const list = variable as ListValue;
        const idx = evaluate((node.assignee as MemberExpression).property, env) as NumberValue;
        list.value[idx.value] = evaluate(node.value, env);
        return env.assignVar(varname, list);
    } else if (variable.type == "object") {
        const obj = env.lookupVar(varname) as ObjectValue;
        const key = ((node.assignee as MemberExpression).property as Identifier).symbol
        obj.properties.set(key, evaluate(node.value, env))
        return env.assignVar(varname, obj)
    } else return MK_NULL()
    */
}

export function evaluate_compound_assignment_expression(node: CompoundAssignmentExpression, env: Environment): RuntimeValue {
    const op = node.operator.substring(0, node.operator.length - 1);
    
    switch (node.assignee.kind) {
        case "MemberExpression": {
            const member = node.assignee as MemberExpression
            const expression = get_member_expression_result(member, env)
            const variable = get_member_expression_variable(member).symbol
            const props = get_object_props(member)
            const key = props.pop()!

            if (!key) throw throwError(new InterpreterError("Invalid object key"))
                
            let result = expression;
            for (const prop of props) {
                if((result as ObjectValue).properties.has(prop)) result = (result as ObjectValue).properties.get(prop)!
            }
                
            const new_value = evaluate(node.value, env);

            switch (result.type)
            {
                case "object": {
                    if (!(result as ObjectValue).properties.has(key)) {
                        if (op == "??") {
                            (result as ObjectValue).properties.set(key, new_value)
                            
                            return env.assignVar(variable, expression)
                        }
    
                        throw throwError(new InterpreterError("Invalid object key (not found)"))
                    }
                    
                    const current_value = (result as ObjectValue).properties.get(key)!
                    if (op == "??") {
                        if (current_value.type == "null") {
                            (result as ObjectValue).properties.set(key, new_value)
                            
                            return env.assignVar(variable, expression)
                        }
                        
                        return expression
                    }
                    
                    const value = evaluate_mixed_binary_expression(current_value, new_value, op);
                    (result as ObjectValue).properties.set(key, value)
                    return env.assignVar(variable, expression)
                }
                    
                case "list": {
                    const idx = (member.property as NumericLiteral).value; 
                    if (typeof idx != "number") throw throwError(new InterpreterError("Invalid list index: " + idx))
                    
                    const current_value = expression.value[idx];
                    const new_value = evaluate(node.value, env)
                    expression.value[idx] = evaluate_mixed_binary_expression(current_value, new_value, op);
                    
                    return env.assignVar(variable, expression)
                }
                    
                default:
                    throw throwError(new InterpreterError("Invalid compound assignment"))
            }

            break
        }
            
        case "Identifier": {
            const varname = (node.assignee as Identifier).symbol;
            const current_value = env.lookupVar(varname);
        
            const value = evaluate(node.value, env);
                
            if(op == "??") if(current_value.type == "null") return env.assignVar(varname, value)
        
            const new_value = evaluate_mixed_binary_expression(current_value, value, op);
        
            return env.assignVar(varname, new_value);
        }
        default:
            throw throwError(new InterpreterError("Invalid compound assignment expression " + JSON.stringify(node.assignee)));
    }
    
    
}

export function evaluate_object_expression(obj: ObjectLiteral, env: Environment): RuntimeValue {
    const object = { type: "object", properties: new Map(), native: false } as ObjectValue;
    for (const { key, value } of obj.properties) {
        const runtimeVal = value == undefined ? env.lookupVar(key) : evaluate(value, env);

        object.properties.set(key, runtimeVal);
    }

    return object;
}

export function evaluate_member_expression(member: MemberExpression, env: Environment): RuntimeValue {
    const object: Expression = get_member_expression_variable(member);
    const props = get_object_props(member)

    const varname = (object as Identifier).symbol;
    const variable = env.lookupVar(varname);

    switch (variable.type) {
        case "object": {
            const object = variable as ObjectValue;
            
            if (member.computed && object.native) throw throwError(new InterpreterError("Invalid native object key access. Expected valid key (e.g. obj.key)"))    
        
            const key = props.pop()!
            
            if (!key) throw throwError(new InterpreterError('Invalid object key access. Expected valid key (e.g., obj.key or obj["key"]), but received: ' + JSON.stringify(member.property)));
            
            let result = variable;
            for (const prop of props) {
                if((result as ObjectValue).properties.has(prop)) result = (result as ObjectValue).properties.get(prop)!//new_value = new_value.get(prop)
            }
                
            if (!(result as ObjectValue).properties.has(key)) {
                return MK_NULL()
                //throw throwError(new InterpreterError("Invalid object key (not found)"))
            }
            
            return (result as ObjectValue).properties.get(key)!
        }

        case "list": {
            if (!member.computed) throw throwError(new InterpreterError("Invalid list access. Expected computed access (e.g. list[idx: number]), but received" + JSON.stringify(member.property)));
            
            const index = (evaluate(member.property, env) as NumberValue).value;
            if (typeof index != "number") throw throwError(new InterpreterError("Invalid list index. Expected valid index (e.g. list[idx: number])"));
            
            const list = variable as ListValue;
            if (index < 0 || index > list.value.length - 1) throw throwError(new InterpreterError("Invalid list index. Index must be between 0 and " + (list.value.length - 1)));
            
            return list.value[index];
        }

        default:
            return MK_NULL()
    }
}

export function evaluate_call_expression(call: CallExpression, env: Environment): RuntimeValue {
    const args = call.args.map((arg: Expression) => evaluate(arg, env));
    const fn = evaluate(call.caller, env);

    if (fn.type == "native-function") {
        const result = (fn as NativeFunctionValue).call(args, call.line!, call.column!, env);
        return result;
    }

    if (fn.type == "function") {
        const func = fn as FunctionValue;
        const scope = new Environment(func.declarationEnv);

        for (let i = 0; i < func.parameters.length; i++) {
            const varname = func.parameters[i];
            scope.declareVar(varname, args[i], false);
        }

        let result: RuntimeValue = MK_NULL();
        for (const statement of func.body) result = evaluate(statement, scope);

        return result;
    }

    throw throwError(new InterpreterError("Cannot call value that is not a function: " + JSON.stringify(fn)));
}

export function evaluate_list_expression(list: ListLiteral, env: Environment): RuntimeValue {
    const ls = { type: "list", value: [] } as ListValue;

    for (const value of list.values) {
        ls.value.push(evaluate(value, env));
    }

    return ls;
}

export function evaluate_ternary_expression(node: TernaryExpression, env: Environment): RuntimeValue {
    const condition = evaluate(node.condition, env);

    if (condition.value) return evaluate(node.left, env);
    else return evaluate(node.right, env)
}
