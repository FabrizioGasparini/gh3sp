import { MK_BOOL, type FunctionCall } from "../values.ts";
import { FunctionValue, ListValue, MK_STRING, NativeFunctionValue, ObjectValue, MK_NULL, MK_NUMBER, RuntimeValue } from "../values.ts";
import { handleError } from "../../utils/errors_handler.ts";
import * as readlineSync from "readline-sync";

function throwError(error: string, line: number, column: number) {
    throw handleError(new SyntaxError(error), line, column);
}

const time: FunctionCall = () => {
    return MK_NUMBER(Date.now());
};

const str: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    try {
        return MK_STRING(args[0].value.toString());
    } catch {
        throw throwError(`Invalid argument passed inside 'str' function`, line, column);
    }
};

const int: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    try {
        return MK_NUMBER(parseInt(args[0].value));
    } catch {
        throw throwError(`Invalid argument passed inside 'int' function`, line, column);
    }
};

const type: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    try {
        return MK_STRING(args[0].type);
    } catch {
        throw throwError(`Invalid argument passed inside 'type' function`, line, column);
    }
};

const print: FunctionCall = (args: RuntimeValue[]) => {
    const params = [];
    for (const arg of args) {
        const test = parse(arg);
        params.push(test);
    }

    console.log(...params);
    return MK_NULL();
};

const input: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
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
};

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

const length: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    try {
        return MK_NUMBER(parse_length(args[0], line, column));
    } catch {
        throw throwError(`Invalid argument passed inside 'length' function`, line, column);
    }
};

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

export const built_in_functions: FunctionCall[] = [time, str, int, type, print, length, input];
