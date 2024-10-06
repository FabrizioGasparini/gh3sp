import Environment from "./environments.ts";
import { evaluate } from "./interpreter.ts";
import { MK_BOOL } from "./values.ts";
import { FunctionValue, ListValue, MK_STRING, NativeFunctionValue, ObjectValue } from "./values.ts";
import { MK_NULL, MK_NUMBER, RuntimeValue } from "./values.ts";

export const buildInFunctions = [time, str, int, type, print, length, push, pop, shift, unshift, slice, contains, reverse, filter, map, sort];

function time() {
    return MK_NUMBER(Date.now());
}

function str(args: RuntimeValue[]) {
    try {
        return MK_STRING(args[0].value.toString());
    } catch {
        throw `Invalid argument passed inside 'str' function`;
    }
}

function int(args: RuntimeValue[]) {
    try {
        return MK_NUMBER(parseInt(args[0].value));
    } catch {
        throw `Invalid argument passed inside 'int' function`;
    }
}

function type(args: RuntimeValue[]) {
    try {
        return MK_STRING(args[0].type);
    } catch {
        throw `Invalid argument passed inside 'type' function`;
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

function length(args: RuntimeValue[]) {
    try {
        return MK_NUMBER(parse_length(args[0]));
    } catch {
        throw `Invalid argument passed inside 'length' function`;
    }
}

function parse_length(node: RuntimeValue) {
    switch (node.type) {
        case "number":
        case "string":
            return node.value.toString().length;

        case "list":
            return node.value.length;

        case "object":
            return (node as ObjectValue).properties.size;

        default:
            throw "Object of type '" + node.type + "' has no length";
    }
}

// Lists Functions

function push(args: RuntimeValue[], env: Environment) {
    if (args[0].type != "list") throw "Invalid arguments: first argument must be a list.";

    const list = args[0] as ListValue;
    const elem = args[1];

    list.value.push(elem);

    return env.assignVar(list.name!, list);
}

function pop(args: RuntimeValue[], env: Environment) {
    if (args[0].type != "list") throw "Invalid arguments: argument must be a list.";

    const list = args[0] as ListValue;
    const value = list.value.pop();

    env.assignVar(list.name!, list);

    if (value == undefined) return MK_NULL();

    return value;
}

function shift(args: RuntimeValue[], env: Environment) {
    if (args[0].type != "list") throw "Invalid arguments: argument must be a list.";

    const list = args[0] as ListValue;
    const value = list.value.shift();

    env.assignVar(list.name!, list);

    if (value == undefined) return MK_NULL();

    return value;
}

function unshift(args: RuntimeValue[], env: Environment) {
    if (args[0].type != "list") throw "Invalid arguments: first argument must be a list.";

    const list = args[0] as ListValue;

    if (args.length < 2) throw "Invalid arguments: two arguments are required";
    list.value.unshift(args[1]);

    return env.assignVar(list.name!, list);
}

function slice(args: RuntimeValue[]) {
    if (args[0].type != "list") throw "Invalid arguments: first argument must be a list.";

    let start = 0;
    if (args.length > 1)
        if (args[1].type != "number") throw "Invalid arguments: second argument must be a number.";
        else start = args[1].value;

    let end = args[0].value.length;
    if (args.length > 2)
        if (args[2].type != "number") throw "Invalid arguments: second argument must be a number.";
        else end = args[2].value;

    const list = args[0] as ListValue;

    return {
        type: "list",
        value: list.value.slice(start, end),
        name: list.name,
    } as ListValue;
}

function contains(args: RuntimeValue[]) {
    if (args[0].type != "list") throw "Invalid arguments: first argument must be a list.";

    const list = args[0] as ListValue;

    if (args.length < 2) throw "Invalid arguments: two arguments are required";
    for (const value of list.value) {
        if (value.type == args[1].type && value.value == args[1].value) return MK_BOOL(true);
    }

    return MK_BOOL(false);
}

function reverse(args: RuntimeValue[], env: Environment) {
    if (args[0].type != "list") throw "Invalid arguments: argument must be a list.";

    const list = args[0] as ListValue;
    list.value.reverse();

    return env.assignVar(list.name!, list);
}

function filter(args: RuntimeValue[], env: Environment) {
    if (args[0].type != "list") throw "Invalid arguments: first argument must be a list.";
    if (args[1].type != "function") throw "Invalid arguments: second argument must be a function.";

    const list = args[0] as ListValue;
    const fn = args[1] as FunctionValue;

    if (fn.parameters.length > 1) throw "Invalid function argument: function must have only one parameter.";
    if (fn.body.length > 1) throw "Invalid function argument: function must have only one expression in its body";

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

function map(args: RuntimeValue[], env: Environment) {
    if (args[0].type != "list") throw "Invalid arguments: first argument must be a list.";
    if (args[1].type != "function") throw "Invalid arguments: second argument must be a function.";

    const list = args[0] as ListValue;
    const fn = args[1] as FunctionValue;

    if (fn.parameters.length > 1) throw "Invalid function argument: function must have only one parameter.";
    if (fn.body.length > 1) throw "Invalid function argument: function must have only one expression in its body";

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

function sort(args: RuntimeValue[], env: Environment) {
    if (args[0].type != "list") throw "Invalid arguments: first argument must be a list.";

    let inverted: boolean = false;
    if (args.length > 1) {
        if (args[1].type != "boolean") throw "Invalid arguments: second argument must be a boolean.";
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
