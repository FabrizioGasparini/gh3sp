import { handleError, MathError } from "../../utils/errors_handler.ts";
import type { NumberValue } from "../values.ts";
import type { RuntimeValue } from "../values.ts";
import { MK_NATIVE_FUNCTION } from "../values.ts";

// ========== MATH ========== \\
const math_funcs = [sqrt, rand];

function throwError(error: string, line: number, column: number) {
    throw handleError(new SyntaxError(error), line, column);
}

function sqrt(args: RuntimeValue[], line: number, column: number) {
    if (args[0].type != "number") throw throwError("Invalid arguments: first argument must be a number", line, column);

    if (args[0].value < 0) throw handleError(new MathError("Square root of a negative number is not defined"), line, column);

    return { type: "number", value: Math.sqrt(args[0].value) } as NumberValue;
}

function rand(args: RuntimeValue[], line: number, column: number) {
    if (args[0].type != "number" || args[1].type != "number") throw throwError("Invalid arguments: first and second arguments must be numbers", line, column);

    let round = 15;
    if (args.length > 2)
        if (args[2].type != "number") throw throwError("Invalid arguments: third argument must be a number", line, column);
        else round = args[2].value;

    const min = args[0].value;
    const max = args[1].value;

    if (min > max) throw throwError("Minimum number must be less than or equal to the maximum number", line, column);

    return { type: "number", value: Math.floor((Math.random() * (max - min) + min) * 10 ** round) / 10 ** round } as NumberValue;
}

const math_props = new Map<string, RuntimeValue>();
for (const func of math_funcs) math_props.set(func.name, MK_NATIVE_FUNCTION(func));

math_props.set("PI", { type: "number", value: 3.141592653589793 } as NumberValue);

// ========== Export ========== \\
export const builtInObjects = [{ name: "Math", properties: math_props }];
