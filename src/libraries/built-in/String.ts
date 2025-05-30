import { MK_STRING, RuntimeValue, type FunctionCall } from "../../runtime/values";
import { handleError } from "../../utils/errors_handler";
import { parse } from "../../runtime/built-in/functions"

const join: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    let string = ""
    args.forEach(arg => {
        if (arg.type != "string" && arg.type != "number" && arg.type != "list" && arg.type != "reactive" && arg.type) handleError(new SyntaxError(`Invalid argument type '${arg.type}'`), line, column);
        string += parse(arg);
    });

    return MK_STRING(string);
}

const upper: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1) throw handleError(new SyntaxError("Expected 1 argument, got " + args.length), line, column);
    if (args[0].type != "string") throw handleError(new SyntaxError("Invalid argument type. Expected 'number', got " + args[0].type), line, column);

    return MK_STRING(args[0].value.toUpperCase());
}

const lower: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1) throw handleError(new SyntaxError("Expected 1 argument, got " + args.length), line, column);
    if (args[0].type != "string") throw handleError(new SyntaxError("Invalid argument type. Expected 'number', got " + args[0].type), line, column);

    return MK_STRING(args[0].value.toLowerCase());
}


export default {
    String: {
        functions: {
            join,
            upper,
            lower
        },
        constants: {}
    }
};
