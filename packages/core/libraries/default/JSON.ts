import { createLibrary } from "@core/runtime/built-in/lib_factory.ts";
import { simple } from "@core/runtime/built-in/func_builder.ts";
import {
  MK_OBJECT,
  type ObjectValue,
  MK_STRING,
  type RuntimeValue,
  type FunctionCall,
} from "@core/runtime/values.ts";
import { handleError } from "@core/utils/errors_handler.ts";
import { parse_object } from "@core/runtime/built-in/functions.ts";
import type { StringValue } from "@core/runtime/values.ts";
import type { NumberValue } from "@core/runtime/values.ts";
import type { BoolValue } from "@core/runtime/values.ts";

function obj_to_properties(
  obj: object,
  line: number,
  column: number,
): Map<string, RuntimeValue> {
  const props = new Map<string, RuntimeValue>();
  for (const [key, value] of Object.entries(obj)) {
    switch (typeof value) {
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
        props.set(key, {
          type: "object",
          properties: obj_to_properties(value, line, column),
          native: false,
        } as ObjectValue);
        break;
      default:
        handleError(
          new SyntaxError(
            `Invalid type found during object parsing: ${typeof value}`,
          ),
          line,
          column,
        );
        break;
    }
  }

  return props;
}

const parse: FunctionCall = simple(
  ["string"],
  (s: RuntimeValue, _env?: any, line?: number, column?: number) => {
    return MK_OBJECT(
      obj_to_properties(JSON.parse(s.value), line || 0, column || 0),
    );
  },
);

const stringify: FunctionCall = simple(["object"], (obj: RuntimeValue) => {
  return MK_STRING(parse_object(obj as ObjectValue));
});

export default createLibrary("JSON", { parse, stringify }, {});
