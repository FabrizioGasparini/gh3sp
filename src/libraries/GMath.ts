import { MK_NUMBER, RuntimeValue, type FunctionCall, MK_STRING } from "../runtime/values.ts";
import { handleError, MathError } from "../utils/errors_handler.ts";

const sqrt: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1) throw handleError(new SyntaxError("Invalid number of arguments. Expected '1' argument but received " + args.length), line, column);
    if (args[0].value < 0) throw handleError(new MathError("Invalid argument. Square root of a negative number is not defined"), line, column);
    if (args[0].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number' but received " + args[0].type), line, column);

    return MK_NUMBER(Math.sqrt(args[0].value));
}

const pow: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 2) throw handleError(new SyntaxError("Invalid number of arguments. Expected '2' argument but received " + args.length), line, column);
    if (args[0].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number' but received " + args[0].type), line, column);
    if (args[1].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number' but received " + args[1].type), line, column);

    return MK_NUMBER(args[0].value ** args[1].value);
}

const convert: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 3) throw handleError(new SyntaxError("Invalid number of arguments. Expected '3' argument but received " + args.length), line, column);
    if (args[0].type != "string") throw handleError(new SyntaxError("Invalid argument type. Expected 'string', got " + args[0].type), line, column);
    if (args[1].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number' but received " + args[1].type), line, column);
    if (args[2].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number' but received " + args[2].type), line, column);

    const decimalValue = parseInt(args[0].value, args[1].value)
    if (isNaN(decimalValue)) throw handleError(new SyntaxError("Invalid base conversion"), line, column);

    return MK_STRING(decimalValue.toString(args[2].value));
}

const sin: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1) throw handleError(new SyntaxError("Invalid number of arguments. Expected '2' argument but received " + args.length), line, column);
    if (args[0].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number' but received " + args[0].type), line, column);

    return MK_NUMBER(Math.sin(args[0].value));
}

const cos: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1) throw handleError(new SyntaxError("Invalid number of arguments. Expected '2' argument but received " + args.length), line, column);
    if (args[0].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number' but received " + args[0].type), line, column);

    return MK_NUMBER(Math.cos(args[0].value));
}

const tan: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1) throw handleError(new SyntaxError("Invalid number of arguments. Expected '2' argument but received " + args.length), line, column);
    if (args[0].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number' but received " + args[0].type), line, column);

    return MK_NUMBER(Math.tan(args[0].value));
}

const log: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1) throw handleError(new SyntaxError("Invalid number of arguments. Expected '2' argument but received " + args.length), line, column);
    if (args[0].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number' but received " + args[0].type), line, column);

    return MK_NUMBER(Math.log(args[0].value));
}

export default {
    Math: {
        functions: {
            sqrt,
            pow,
            convert,
            sin,
            cos,
            tan,
            log
        },
        constants: {
            PI: MK_NUMBER(3.1415926535897932384626),
            E: MK_NUMBER(2.7182818284590452353602),
        },
    }
}