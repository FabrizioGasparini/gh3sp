import { MK_OBJECT, type ObjectValue } from "@core/runtime/values.ts";
import { MK_STRING } from "@core/runtime/values.ts";
import { RuntimeValue, type FunctionCall } from "@core/runtime/values.ts";
import { handleError } from "@core/utils/errors_handler.ts";
import { parse_object } from "@core/runtime/built-in/functions.ts";
import type { StringValue } from "@core/runtime/values.ts";
import type { NumberValue } from "@core/runtime/values.ts";
import type { BoolValue } from "@core/runtime/values.ts";


function obj_to_properties(obj: object, line: number, column: number): Map<string, RuntimeValue> {
    const props = new Map<string, RuntimeValue>();
    for (const [key, value] of Object.entries(obj)) {
        switch (typeof value)
        {
            case "string":
                props.set(key, { type: "string", value } as StringValue);
                break;
            case "number":
                props.set(key, { type: "number", value } as NumberValue);
                break;
            case "boolean":
                props.set(key, { type: "boolean", value } as BoolValue);
                break;
            case "object":
                props.set(key, { type: "object", properties: obj_to_properties(value, line, column), native: false } as ObjectValue)
                break;
            default:
                handleError(new SyntaxError(`Invalid type found during object parsing: ${typeof value}`), line, column)
                break;
        }
    }

    return props
}

const parse: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1) throw handleError(new SyntaxError("Invalid number of arguments. Expected '1' argument but received " + args.length), line, column);
    if (args[0].type != "string") throw handleError(new SyntaxError("Invalid argument type. Expected 'string' but received " + args[0].type), line, column);

    return MK_OBJECT(obj_to_properties(JSON.parse(args[0].value), line, column));
}


const stringify: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1) throw handleError(new SyntaxError("Invalid number of arguments. Expected '1' argument but received " + args.length), line, column);
    if (args[0].type != "object") throw handleError(new SyntaxError("Invalid argument type. Expected 'string' but received " + args[0].type), line, column);

    return MK_STRING(parse_object(args[0] as ObjectValue));
}

export default {
    JSON: {
        functions: {
            parse,
            stringify,
        },
        constants: {
        }
    }
}