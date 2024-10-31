import { AssignmentExpression, BinaryExpression, CallExpression, CompoundAssignmentExpression, Expression, Identifier, ListLiteral, MemberExpression, ObjectLiteral, StringLiteral, type LogicalExpression, type TernaryExpression } from "../../frontend/ast.ts";
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

    if (op == "+" || op == "-" || op == "*" || op == "/" || op == "%" || op == "^" || op == "//") {
        if (left.type == "number" && right.type == "number") return evaluate_numeric_binary_expression(left as NumberValue, right as NumberValue, op);
        else if (left.type == "string" && right.type == "string") return evaluate_string_binary_expression(left as StringValue, right as StringValue, op);
        else if (left.type == "string" && right.type == "number") return evaluate_mixed_string_numeric_binary_expression(left as StringValue, right as NumberValue, op);
        else if (left.type == "number" && right.type == "string") return evaluate_mixed_string_numeric_binary_expression(right as StringValue, left as NumberValue, op);
        else if (left.type == "list" && right.type == "list") return evaluate_list_binary_expression(right as ListValue, left as ListValue, op);
    } else if (op == "==" || op == "!=" || op == "<=" || op == ">=" || op == "<" || op == ">") return evaluate_comparison_binary_expression(left, right, op);

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

export function evaluate_assignment_expression(node: AssignmentExpression, env: Environment): RuntimeValue {
    if (node.assignee.kind == "Identifier") {
        const varname = (node.assignee as Identifier).symbol;
        return env.assignVar(varname, evaluate(node.value, env));
    } else if (node.assignee.kind == "MemberExpression") {
        const varname = ((node.assignee as MemberExpression).object as Identifier).symbol;
        const variable = env.lookupVar(varname)
        if(variable.type == "list") {
            const list = env.lookupVar(varname) as ListValue;
            const idx = evaluate((node.assignee as MemberExpression).property, env) as NumberValue;
            list.value[idx.value] = evaluate(node.value, env);
            return env.assignVar(varname, list);
        } else if (variable.type == "object") {
            const obj = env.lookupVar(varname) as ObjectValue;
            const key = ((node.assignee as MemberExpression).property as Identifier).symbol
            obj.properties.set(key, evaluate(node.value, env))
            return env.assignVar(varname, obj)
        }
        else return MK_NULL()
    } else throw throwError(new InterpreterError("Invalid assignment expression " + JSON.stringify(node.assignee)));
}

export function evaluate_compound_assignment_expression(node: CompoundAssignmentExpression, env: Environment): RuntimeValue {
    if (node.assignee.kind == "MemberExpression")
    {
        const old_value = evaluate(node.assignee, env)
        if (old_value.type != "null") return old_value

        const assign_node = {
            kind: "AssignmentExpression",
            assignee: node.assignee,
            value: node.value
        } as AssignmentExpression
        return evaluate_assignment_expression(assign_node, env)
    } else {
        if (node.assignee.kind != "Identifier") throw throwError(new InterpreterError("Invalid compound assignment expression " + JSON.stringify(node.assignee)));
    
        const varname = (node.assignee as Identifier).symbol;
        const current_value = env.lookupVar(varname);
    
        const value = evaluate(node.value, env);
    
        /*if (currentValue.type != value.type)
            throw "Invalid compound assignment between type '" + currentValue.type + "' and '" + value.type + "'"*/
    
        const op = node.operator.substring(0, node.operator.length - 1);
    
        if(op == "??" ) if(current_value.type == "null") return env.assignVar(varname, value)
    
        let newValue: RuntimeValue = MK_NULL();
        if (current_value.type == "number" && value.type == "number") newValue = evaluate_numeric_binary_expression(current_value as NumberValue, value as NumberValue, op);
        else if (current_value.type == "string" && value.type == "string") newValue = evaluate_string_binary_expression(current_value as StringValue, value as StringValue, op);
        else if (current_value.type == "string" && value.type == "number") newValue = evaluate_mixed_string_numeric_binary_expression(current_value as StringValue, value as NumberValue, op);
        else if (current_value.type == "number" && value.type == "string") newValue = evaluate_mixed_string_numeric_binary_expression(value as StringValue, current_value as NumberValue, op);
        else return MK_NULL();
    
        return env.assignVar(varname, newValue);
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
    let object = member.object;

    const props = [];
    // This part is just for objects \\
    // ============================= \\
    if (object.kind == "MemberExpression") {
        while (object.kind == "MemberExpression") {
            const obj = object as MemberExpression;

            props.push(obj.property);
            object = obj.object;
        }
        props.reverse();
    }
    // ============================= \\

    
    const varname = (object as Identifier).symbol;
    const variable = env.lookupVar(varname);

    
    if(member.computed && (variable as ObjectValue).native) throw throwError(new InterpreterError("Invalid native object key access. Expected valid key (e.g. obj.key)"))
    if (variable.type == "object") {
        let objProps = (variable as ObjectValue).properties;
        for (const prop of props) {
            if (member.computed) {
                
                if (objProps.get((prop as StringLiteral).value)) objProps = (objProps.get((prop as StringLiteral).value) as ObjectValue).properties;
                else if (objProps.get(env.lookupVar((prop as Identifier).symbol).value)) objProps = (objProps.get(env.lookupVar((prop as Identifier).symbol).value) as ObjectValue).properties;
            } else {
                if (objProps.get((prop as Identifier).symbol)) objProps = (objProps.get((prop as Identifier).symbol) as ObjectValue).properties;
            }
        }
        
        let propKey: string;

        if (member.computed && member.property.kind == "Identifier") member.property = { kind: "StringLiteral", value: env.lookupVar((member.property as Identifier).symbol).value } as StringLiteral;

        if (!member.computed) propKey = (member.property as Identifier).symbol;
        else propKey = (member.property as StringLiteral).value;

        if (!propKey) throw throwError(new InterpreterError('Invalid object key access. Expected valid key (e.g., obj.key or obj["key"]), but received: ' + JSON.stringify(member.property)));
        if (!objProps.get(propKey)) return MK_NULL() //throw throwError(new InterpreterError("Invalid object key access"));

        return objProps.get(propKey)!;
    } else if (variable.type == "list") {
        if (!member.computed) throw throwError(new InterpreterError("Invalid list access. Expected computed access (e.g. list[idx: number]), but received" + JSON.stringify(member.property)));

        const index = (evaluate(member.property, env) as NumberValue).value;
        if (typeof index != "number") throw throwError(new InterpreterError("Invalid list index. Expected valid index (e.g. list[idx: number])"));

        const list = variable as ListValue;
        if (index < 0 || index > list.value.length - 1) throw throwError(new InterpreterError("Invalid list index. Index must be between 0 and " + (list.value.length - 1)));

        return list.value[index];
    }

    return MK_NULL();
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
