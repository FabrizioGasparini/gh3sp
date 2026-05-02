import { createLibrary } from "@core/runtime/built-in/lib_factory";
import { build, simple } from "@core/runtime/built-in/func_builder";
import {
  MK_NUMBER,
  RuntimeValue,
  type FunctionCall,
} from "@core/runtime/values";
import { handleError } from "@core/utils/errors_handler";

function makeRandomNumber(
  min: number,
  max: number,
  precision: number = 1,
): number {
  return (
    Math.floor(
      Math.random() * (1 + max * precision - min * precision) + min * precision,
    ) / precision
  );
}

const rand: FunctionCall = build(
  [
    { name: "min", type: "number" },
    { name: "max", type: "number" },
    { name: "precision", type: "number", optional: true },
  ],
  (args, _env, line?: number, column?: number) => {
    const min = args[0].value;
    const max = args[1].value;

    let precision: number;
    if (args[2].type === "number") precision = 10 ** args[2].value;
    else {
      if (countDecimalPlaces(max) > countDecimalPlaces(min))
        precision = 10 ** countDecimalPlaces(max);
      else precision = 10 ** countDecimalPlaces(min);
    }

    if (min > max)
      throw handleError(
        new SyntaxError(
          "Invalid arguments. 'min' argument must be less than or equal to 'max' argument.",
        ),
        line || 0,
        column || 0,
      );

    return MK_NUMBER(makeRandomNumber(min, max, precision));
  },
);

function countDecimalPlaces(num: number): number {
  const numStr = num.toString();
  if (numStr.includes(".")) {
    return numStr.split(".")[1].length;
  } else {
    return 0;
  }
}

const pick: FunctionCall = simple(["list"], (lst: RuntimeValue) => {
  return (lst as any).value[makeRandomNumber(0, (lst as any).value.length - 1)];
});

export default createLibrary(
  "Random",
  {
    rand,
    pick,
  },
  {
    number: MK_NUMBER(makeRandomNumber(0, 1)),
  },
);
