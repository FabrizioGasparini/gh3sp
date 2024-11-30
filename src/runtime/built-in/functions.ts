import { MK_BOOL, type FunctionCall } from "../values.ts";
import { FunctionValue, ListValue, MK_STRING, NativeFunctionValue, ObjectValue, MK_NULL, MK_NUMBER, RuntimeValue } from "../values.ts";
import { handleError } from "../../utils/errors_handler.ts";
import * as readlineSync from "readline-sync";
import type Environment from "../environments.ts";

const throwError = (error: string, line: number, column: number) => { throw handleError(new SyntaxError(error), line, column) };

const time: FunctionCall = () => { return MK_NUMBER(Date.now()) };

// Returns a string representation of the given argument
export const str: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1)
        throwError("Expected '1' argument, got '" + args.length + "'", line, column)
    
    return MK_STRING(parse(args[0]))
};

// Returns the integer value of the given argument
const int: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1)
        throwError("Expected '1' argument, got '" + args.length + "'", line, column)
    
    if (args[0].type != "string" && args[0].type != "number")
        throwError("Expected argument type 'string|number', got '" + args[0].type + "'", line, column)
    
    return MK_NUMBER(parseInt(args[0].value))
};

// Returns the decimal value of the given argument
const float: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1)
        throwError("Expected '1' argument, got '" + args.length + "'", line, column)
    
    if (args[0].type != "string" && args[0].type != "number")
        throwError("Expected argument type 'string|number', got '" + args[0].type + "'", line, column)
    
    return MK_NUMBER(parseFloat(args[0].value))
};

// Returns the type of the given argument
const type: FunctionCall = (args: RuntimeValue[]) => { return MK_STRING(args[0].type) };

// Prints the given arguments to the console
const print: FunctionCall = (args: RuntimeValue[]) => {
    console.log(...args.map(arg => parse(arg)));
    return MK_NULL();
};

// Gets an input for the console and parses it 
const input: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    let string = "";
    if (args.length > 0)
        if (args[0].type != "string") throwError("Expected argument type 'string', got '" + args[0].type + "'", line, column);
        else string = args[0].value;
        

    const input = readlineSync.question(string);
    if (!input) return MK_STRING("");
    
    switch (parseInput(input)) {
        case "number":
            return MK_NUMBER(parseNumber(input))
        
        case "boolean":
            return MK_BOOL(input == "true")
        
        default:
            return MK_STRING(input)
    }
};

// Returns the given input type
function parseInput(input: string): string {
    if (isNum(input)) return "number";
    else if (isBool(input)) return "boolean"
    
    return "string"
}

// Checks if the given string is of type 'boolean'
function isBool(src: string) {
    return src == "true" || src == "false";
}

// Checks if the given string is of type 'number'
function isNum(value: string) {
    const number = parseFloat(value);
    return !isNaN(number) && !isNaN(Number(value));
}

// Parses the given 'string' to a 'number'
function parseNumber(value: string) {
    const number = parseFloat(value);
    
    if (Number.isInteger(number)) return parseInt(value);
    else return parseFloat(value);
}

// Parses the given 'node' to a serializable type
export function parse(node: RuntimeValue) {
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
                                    
// Parses the given 'object' to a serializable type
export function parse_object(obj: ObjectValue) {
    const object: { [key: string]: RuntimeValue } = {};
    for (const [key, value] of obj.properties.entries()) object[key] = parse(value as RuntimeValue);
    
    return JSON.stringify(object);
}

// Parses the given 'function' to a serializable type
function parse_function(fn: FunctionValue) {
    let func = "<function " + fn.name + "(";

    for (let i = 0; i < fn.parameters.length; i++) {
        const param = fn.parameters[i];
        func += (i < fn.parameters.length - 1) ? param + ", " : param
    }

    func += ")>";
    return func;
}

// Parses the given 'list' to a serializable type
function parse_list(list: ListValue) {
    const values: RuntimeValue[] = [];
    for (const value of list.value) {
        values.push(parse(value));
    }
    
    return values;
}

// Returns the length of a given argument
const length: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1)
        throwError("Expected '1' argument, got '" + args.length + "'", line, column)
    
    return MK_NUMBER(get_length(args[0], line, column));
};

// Returns the length of a given 'node'
function get_length(node: RuntimeValue, line: number, column: number) {
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

const unreactive: FunctionCall = (args: RuntimeValue[], line: number, column: number, env: Environment) => {
    if (args.length != 1)
        throwError("Expected '1' argument, got '" + args.length + "'", line, column)

    if (args[0].type != "reactive")
        throwError("Expected argument type 'reactive', got '" + args[0].type + "'", line, column)

    console.log(args[0])
    return MK_NULL()
}
// List of all the functions which are built-in in the 'gh3sp' language
export const built_in_functions: FunctionCall[] = [time, str, int, float, type, print, length, input, unreactive];
