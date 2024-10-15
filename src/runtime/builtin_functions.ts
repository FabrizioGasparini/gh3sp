import Environment from "./environments.ts";
import { evaluate } from "./interpreter.ts";
import { MK_BOOL } from "./values.ts";
import { FunctionValue, ListValue, MK_STRING, NativeFunctionValue, ObjectValue } from "./values.ts";
import { MK_NULL, MK_NUMBER, RuntimeValue } from "./values.ts";
import { handleError } from "../utils/errors_hander.ts";
import * as readlineSync from "readline-sync";

export const buildInFunctions = [time, str, int, type, print, length, push, pop, shift, unshift, slice, contains, reverse, filter, map, sort, input];

function throwError(error: string, line: number, column: number) {
    throw handleError(new SyntaxError(error), line, column);
}

function time() {
    return MK_NUMBER(Date.now());
}

function str(args: RuntimeValue[], line: number, column: number) {
    try {
        return MK_STRING(args[0].value.toString());
    } catch {
        throw throwError(`Invalid argument passed inside 'str' function`, line, column);
    }
}

function int(args: RuntimeValue[], line: number, column: number) {
    try {
        return MK_NUMBER(parseInt(args[0].value));
    } catch {
        throw throwError(`Invalid argument passed inside 'int' function`, line, column);
    }
}

function type(args: RuntimeValue[], line: number, column: number) {
    try {
        return MK_STRING(args[0].type);
    } catch {
        throw throwError(`Invalid argument passed inside 'type' function`, line, column);
    }
}

function print(args: RuntimeValue[]) {
    const params = [];
    for (const arg of args) {
        const test = parse(arg);
        params.push(test);
    }

    console.log(...params);
    return MK_NULL();
}

function input(args: RuntimeValue[], line: number, column: number): RuntimeValue {
    let string = "";
    if (args.length > 0)
        if (args[0].type != "string") throw throwError("Invalid argument passed inside 'input' function", line, column);
        else string = args[0].value;

    const input = readlineSync.question(string);

    let result: RuntimeValue = MK_STRING("");
    if (input) {
        if (isNum(input)) result = MK_NUMBER(parseNumber(input));
        else if (isBool(input)) result = MK_BOOL(input == "true");
        else result = MK_STRING(input);
    }

    return result;
}

function isBool(src: string) {
    return src == "true" || src == "false";
}

function isNum(value: string) {
    const number = parseFloat(value);
    return !isNaN(number) && !isNaN(Number(value));
}

function parseNumber(value: string) {
    const number = parseFloat(value);

    if (Number.isInteger(number)) return parseInt(value);
    else return parseFloat(value);
}

function parse(node: RuntimeValue) {
    switch (node.type) {
        case "number":
        case "string":
        case "boolean":
        case "null":
            return node.value;
        case "object":
            return parse_object(node as ObjectValue);
        case "list":
            return parse_list(node as ListValue);
        case "function":
            return parse_function(node as FunctionValue);
        case "native-function":
            return "<built-in function " + (node as NativeFunctionValue).name + ">";

        default:
            return node;
    }
}

function parse_object(obj: ObjectValue) {
    const object: { [key: string]: RuntimeValue } = {};

    for (const [key, value] of obj.properties.entries()) {
        object[key] = parse(value as RuntimeValue);
    }

    return object;
}

function parse_function(fn: FunctionValue) {
    let func = "<function " + fn.name + "(";

    for (let i = 0; i < fn.parameters.length; i++) {
        const param = fn.parameters[i];
        if (i < fn.parameters.length - 1) func += param + ", ";
        else func += param;
    }

    func += ")>";
    return func;
}

function parse_list(list: ListValue) {
    const values: RuntimeValue[] = [];
    for (const value of list.value) {
        values.push(parse(value));
    }

    return values;
}

function length(args: RuntimeValue[], line: number, column: number) {
    try {
        return MK_NUMBER(parse_length(args[0], line, column));
    } catch {
        throw throwError(`Invalid argument passed inside 'length' function`, line, column);
    }
}

function parse_length(node: RuntimeValue, line: number, column: number) {
    switch (node.type) {
        case "number":
        case "string":
            return node.value.toString().length;

        case "list":
            return node.value.length;

        case "object":
            return (node as ObjectValue).properties.size;

        default:
            throw throwError("Object of type '" + node.type + "' has no length", line, column);
    }
}

// Lists Functions

function push(args: RuntimeValue[], line: number, column: number, env: Environment) {
    if (args[0].type != "list") throw throwError("Invalid arguments: first argument must be a list", line, column);

    const list = args[0] as ListValue;
    const elem = args[1];

    list.value.push(elem);

    return env.assignVar(list.name!, list);
}

function pop(args: RuntimeValue[], line: number, column: number, env: Environment) {
    if (args[0].type != "list") throw throwError("Invalid arguments: argument must be a list", line, column);

    const list = args[0] as ListValue;
    const value = list.value.pop();

    env.assignVar(list.name!, list);

    if (value == undefined) return MK_NULL();

    return value;
}

function shift(args: RuntimeValue[], line: number, column: number, env: Environment) {
    if (args[0].type != "list") throw throwError("Invalid arguments: argument must be a list", line, column);

    const list = args[0] as ListValue;
    const value = list.value.shift();

    env.assignVar(list.name!, list);

    if (value == undefined) return MK_NULL();

    return value;
}

function unshift(args: RuntimeValue[], line: number, column: number, env: Environment) {
    if (args[0].type != "list") throw throwError("Invalid arguments: first argument must be a list", line, column);

    const list = args[0] as ListValue;

    if (args.length < 2) throw throwError("Invalid arguments: two arguments are required", line, column);
    list.value.unshift(args[1]);

    return env.assignVar(list.name!, list);
}

function slice(args: RuntimeValue[], line: number, column: number) {
    if (args[0].type != "list") throw throwError("Invalid arguments: first argument must be a list", line, column);

    let start = 0;
    if (args.length > 1)
        if (args[1].type != "number") throw throwError("Invalid arguments: second argument must be a number", line, column);
        else start = args[1].value;

    let end = args[0].value.length;
    if (args.length > 2)
        if (args[2].type != "number") throw throwError("Invalid arguments: second argument must be a number", line, column);
        else end = args[2].value;

    const list = args[0] as ListValue;

    return {
        type: "list",
        value: list.value.slice(start, end),
        name: list.name,
    } as ListValue;
}

function contains(args: RuntimeValue[], line: number, column: number) {
    if (args[0].type != "list") throw throwError("Invalid arguments: first argument must be a list", line, column);

    const list = args[0] as ListValue;

    if (args.length < 2) throw throwError("Invalid arguments: two arguments are required", line, column);
    for (const value of list.value) {
        if (value.type == args[1].type && value.value == args[1].value) return MK_BOOL(true);
    }

    return MK_BOOL(false);
}

function reverse(args: RuntimeValue[], line: number, column: number, env: Environment) {
    if (args[0].type != "list") throw throwError("Invalid arguments: argument must be a list", line, column);

    const list = args[0] as ListValue;
    list.value.reverse();

    return env.assignVar(list.name!, list);
}

function filter(args: RuntimeValue[], line: number, column: number, env: Environment) {
    if (args[0].type != "list") throw throwError("Invalid arguments: first argument must be a list", line, column);
    if (args[1].type != "function") throw throwError("Invalid arguments: second argument must be a function", line, column);

    const list = args[0] as ListValue;
    const fn = args[1] as FunctionValue;

    if (fn.parameters.length > 1) throw throwError("Invalid function argument: function must have only one parameter", line, column);
    if (fn.body.length > 1) throw throwError("Invalid function argument: function must have only one expression in its body", line, column);

    const scope = new Environment(env);

    const varname = fn.parameters[0];
    scope.declareVar(varname, MK_NULL(), false);

    const values: RuntimeValue[] = [];
    for (let i = 0; i < list.value.length; i++) {
        const value = list.value[i];
        scope.assignVar(varname, value);

        if (evaluate(fn.body[0], scope).value == true) values.push(value);
    }

    return {
        type: "list",
        value: values,
        name: list.name,
    } as ListValue;
}

function map(args: RuntimeValue[], line: number, column: number, env: Environment) {
    if (args[0].type != "list") throw throwError("Invalid arguments: first argument must be a list", line, column);
    if (args[1].type != "function") throw throwError("Invalid arguments: second argument must be a function", line, column);

    const list = args[0] as ListValue;
    const fn = args[1] as FunctionValue;

    if (fn.parameters.length > 1) throw throwError("Invalid function argument: function must have only one parameter", line, column);
    if (fn.body.length > 1) throw throwError("Invalid function argument: function must have only one expression in its body", line, column);

    const scope = new Environment(env);

    const varname = fn.parameters[0];
    scope.declareVar(varname, MK_NULL(), false);

    const values: RuntimeValue[] = [];
    for (let i = 0; i < list.value.length; i++) {
        const value = list.value[i];
        scope.assignVar(varname, value);

        values.push(evaluate(fn.body[0], scope).value);
    }

    return {
        type: "list",
        value: values,
        name: list.name,
    } as ListValue;
}

function sort(args: RuntimeValue[], line: number, column: number, env: Environment) {
    if (args[0].type != "list") throw throwError("Invalid arguments: first argument must be a list", line, column);

    let inverted: boolean = false;
    if (args.length > 1) {
        if (args[1].type != "boolean") throw throwError("Invalid arguments: second argument must be a boolean", line, column);
        inverted = args[1].value;
    }
    const list = args[0] as ListValue;

    for (let i = 0; i < list.value.length - 1; i++) {
        for (let j = 0; j < list.value.length - i - 1; j++) {
            const comp = compare(list.value[j], list.value[j + 1]);
            if (inverted ? comp < 0 : comp > 0) {
                const temp = list.value[j];
                list.value[j] = list.value[j + 1];
                list.value[j + 1] = temp;
            }
        }
    }

    return env.assignVar(list.name!, list);
}

function compare(a: RuntimeValue, b: RuntimeValue): number {
    if (a.type == "number" && b.type == "number") return a.value - b.value;
    else if (a.type == "string" && b.type == "string") return a.value.localeCompare(b.value);
    else return a.type == "number" ? -1 : 1;
}
