import GMath from "../../libraries/GMath.ts";
import Environment from "../environments.ts";
import { evaluate } from "../interpreter.ts";
import { type FunctionCall, type RuntimeValue, type ListValue, MK_NULL, MK_BOOL, type FunctionValue, MK_NATIVE_FUNCTION } from "../values.ts";
import { handleError } from "../../utils/errors_handler.ts";
import { MK_OBJECT } from "../values.ts";
import Random from "../../libraries/Random.ts";

export const default_libraries = { GMath, Random };

// =============================================== \\


function throwError(error: string, line: number, column: number) {
    throw handleError(new SyntaxError(error), line, column);
}

const push: FunctionCall = (args: RuntimeValue[], line: number, column: number, env: Environment) => {
    if (args[0].type != "list") throw throwError("Invalid arguments: first argument must be a list", line, column);

    const list = args[0] as ListValue;
    const elem = args[1];

    list.value.push(elem);

    return env.assignVar(list.name!, list);
};

const pop: FunctionCall = (args: RuntimeValue[], line: number, column: number, env: Environment) => {
    if (args[0].type != "list") throw throwError("Invalid arguments: argument must be a list", line, column);

    const list = args[0] as ListValue;
    const value = list.value.pop();

    env.assignVar(list.name!, list);

    if (value == undefined) return MK_NULL();

    return value;
};

const shift: FunctionCall = (args: RuntimeValue[], line: number, column: number, env: Environment) => {
    if (args[0].type != "list") throw throwError("Invalid arguments: argument must be a list", line, column);

    const list = args[0] as ListValue;
    const value = list.value.shift();

    env.assignVar(list.name!, list);

    if (value == undefined) return MK_NULL();

    return value;
};

const unshift: FunctionCall = (args: RuntimeValue[], line: number, column: number, env: Environment) => {
    if (args[0].type != "list") throw throwError("Invalid arguments: first argument must be a list", line, column);

    const list = args[0] as ListValue;

    if (args.length < 2) throw throwError("Invalid arguments: two arguments are required", line, column);
    list.value.unshift(args[1]);

    return env.assignVar(list.name!, list);
};

const slice: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
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
};

const contains: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args[0].type != "list") throw throwError("Invalid arguments: first argument must be a list", line, column);

    const list = args[0] as ListValue;

    if (args.length < 2) throw throwError("Invalid arguments: two arguments are required", line, column);
    for (const value of list.value) {
        if (value.type == args[1].type && value.value == args[1].value) return MK_BOOL(true);
    }

    return MK_BOOL(false);
};

const reverse: FunctionCall = (args: RuntimeValue[], line: number, column: number, env: Environment) => {
    if (args[0].type != "list") throw throwError("Invalid arguments: argument must be a list", line, column);

    const list = args[0] as ListValue;
    list.value.reverse();

    return env.assignVar(list.name!, list);
};

const filter: FunctionCall = (args: RuntimeValue[], line: number, column: number, env: Environment) => {
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
};

const map: FunctionCall = (args: RuntimeValue[], line: number, column: number, env: Environment) => {
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
};

const sort: FunctionCall = (args: RuntimeValue[], line: number, column: number, env: Environment) => {
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
};

function compare(a: RuntimeValue, b: RuntimeValue): number {
    if (a.type == "number" && b.type == "number") return a.value - b.value;
    else if (a.type == "string" && b.type == "string") return a.value.localeCompare(b.value);
    else return a.type == "number" ? -1 : 1;
}

const list_library = {
    functions: {
        push,
        pop,
        shift,
        unshift,
        slice,
        contains,
        reverse,
        filter,
        map,
        sort
    },
    constants: {}
};

const list_properties = new Map<string, RuntimeValue>();
for (const [key, value] of Object.entries(list_library.functions)) list_properties.set(key, MK_NATIVE_FUNCTION((value as FunctionCall)));
for (const [key, value] of Object.entries(list_library.constants)) list_properties.set(key, value as RuntimeValue);

const list = {name: "List", object: MK_OBJECT(list_properties)}


export const built_in_libraries = [ list ];