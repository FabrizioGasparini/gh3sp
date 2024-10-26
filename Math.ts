import { RuntimeValue } from "./src/runtime/values.ts";
import { handleError, MathError } from "./src/utils/errors_handler.ts";

function sqrt(args: RuntimeValue[], line: number, column: number) {
    if (args.length != 1) throw handleError(new SyntaxError("Expected 1 argument, got " + args.length), line, column);
    if (args[0].value < 0) throw handleError(new MathError("Square root of a negative number is not defined"), line, column);
    if (args[0].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number', got " + args[0].type), line, column);

    return Math.sqrt(args[0].value);
}

function rand(args: RuntimeValue[], line: number, column: number) {
    if (args.length != 2) throw handleError(new SyntaxError("Expected 2 argument, got " + args.length), line, column);
    if (args[0].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number', got " + args[0].type), line, column);
    if (args[1].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number', got " + args[1].type), line, column);

    const min = args[0].value;
    const max = args[1].value;

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default {
    functions: {
        sqrt: sqrt,
        rand: rand,
    },
    constants: {
        PI: 3.141592653589793,
    },
};
