import { createLibrary } from "@core/runtime/built-in/lib_factory";
import { simple } from "@core/runtime/built-in/func_builder";
import {
  MK_NUMBER,
  MK_STRING,
  type FunctionCall,
  type RuntimeValue,
} from "@core/runtime/values";
import { handleError, MathError } from "@core/utils/errors_handler";

// sqrt(n)
const sqrt: FunctionCall = simple(
  ["number"],
  (n: RuntimeValue, _env?: any, line?: number, column?: number) => {
    if (n.value < 0)
      throw handleError(
        new MathError(
          "Invalid argument. Square root of a negative number is not defined",
        ),
        line || 0,
        column || 0,
      );
    return MK_NUMBER(Math.sqrt(n.value));
  },
);

const pow: FunctionCall = simple(
  ["number", "number"],
  (a: RuntimeValue, b: RuntimeValue) => {
    return MK_NUMBER(a.value ** b.value);
  },
);

const convert: FunctionCall = simple(
  ["string", "number", "number"],
  (
    s: RuntimeValue,
    fromBase: RuntimeValue,
    toBase: RuntimeValue,
    _env?: any,
    line?: number,
    column?: number,
  ) => {
    const decimalValue = parseInt(s.value, fromBase.value);
    if (isNaN(decimalValue))
      throw handleError(
        new SyntaxError("Invalid base conversion"),
        line || 0,
        column || 0,
      );
    return MK_STRING(decimalValue.toString(toBase.value));
  },
);

const sin: FunctionCall = simple(["number"], (n: RuntimeValue) =>
  MK_NUMBER(Math.sin(n.value)),
);
const cos: FunctionCall = simple(["number"], (n: RuntimeValue) =>
  MK_NUMBER(Math.cos(n.value)),
);
const tan: FunctionCall = simple(["number"], (n: RuntimeValue) =>
  MK_NUMBER(Math.tan(n.value)),
);
const log: FunctionCall = simple(["number"], (n: RuntimeValue) =>
  MK_NUMBER(Math.log(n.value)),
);

export default createLibrary(
  "GMath",
  {
    sqrt,
    pow,
    convert,
    sin,
    cos,
    tan,
    log,
  },
  {
    PI: MK_NUMBER(3.1415926535897932384626),
    E: MK_NUMBER(2.7182818284590452353602),
  },
);
