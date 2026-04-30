import { createLibrary } from "@core/runtime/built-in/lib_factory.ts";
import { build, simple } from "@core/runtime/built-in/func_builder.ts";
import { parse } from "@core/runtime/built-in/functions.ts";
import {
  MK_LIST,
  MK_STRING,
  RuntimeValue,
  type FunctionCall,
  type ListValue,
} from "@core/runtime/values.ts";
import { handleError } from "@core/utils/errors_handler.ts";

function throwError(error: string, line: number, column: number) {
  throw handleError(new SyntaxError(error), line, column);
}

// join(...parts)
const join: FunctionCall = build(
  [{ name: "parts", variadic: true, type: "any" }],
  (args) => {
    const parts = args[0] as ListValue;
    let string = "";
    for (const p of parts.value) {
      string += parse(p);
    }
    return MK_STRING(string);
  },
);

const upper: FunctionCall = simple(["string"], (s: RuntimeValue) => {
  return MK_STRING(s.value.toUpperCase());
});

const lower: FunctionCall = simple(["string"], (s: RuntimeValue) => {
  return MK_STRING(s.value.toLowerCase());
});

const split: FunctionCall = simple(
  ["string", "string"],
  (s: RuntimeValue, sep: RuntimeValue) => {
    return MK_LIST(
      s.value.split(sep.value).map((str: string) => MK_STRING(str)),
    );
  },
);

export default createLibrary(
  "String",
  {
    join,
    upper,
    lower,
    split,
  },
  {},
);
