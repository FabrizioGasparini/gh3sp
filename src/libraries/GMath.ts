import { MK_NUMBER, RuntimeValue, type FunctionCall } from "../runtime/values.ts";
import { handleError, MathError } from "../utils/errors_handler.ts";

const sqrt: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1) throw handleError(new SyntaxError("Expected 1 argument, got " + args.length), line, column);
    if (args[0].value < 0) throw handleError(new MathError("Square root of a negative number is not defined"), line, column);
    if (args[0].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number', got " + args[0].type), line, column);

    return MK_NUMBER(Math.sqrt(args[0].value));
}


const pow: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 2) throw handleError(new SyntaxError("Expected 2 argument, got " + args.length), line, column);
    if (args[0].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number', got " + args[0].type), line, column);
    if (args[1].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number', got " + args[1].type), line, column);

    return MK_NUMBER(args[0].value ** args[1].value);
}

export default {
    Math: {
        functions: {
            sqrt,
            pow,
        },
        constants: {
            PI: MK_NUMBER(3.141592653589793),
        },
    }
}