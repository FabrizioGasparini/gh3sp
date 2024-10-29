import { MK_NUMBER, RuntimeValue, type FunctionCall, MK_STRING } from "../runtime/values.ts";
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

const convert: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 3) throw handleError(new SyntaxError("Expected 3 argument, got " + args.length), line, column);
    if (args[0].type != "string") throw handleError(new SyntaxError("Invalid argument type. Expected 'string', got " + args[0].type), line, column);
    if (args[1].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number', got " + args[1].type), line, column);
    if (args[2].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number', got " + args[2].type), line, column);

    const decimalValue = parseInt(args[0].value, args[1].value)
    if (isNaN(decimalValue)) throw handleError(new SyntaxError("Invalid base conversion"), line, column);

    return MK_STRING(decimalValue.toString(args[1].value));
}

export default {
    Math: {
        functions: {
            sqrt,
            pow,
            convert,
        },
        constants: {
            PI: MK_NUMBER(3.141592653589793),
        },
    }
}