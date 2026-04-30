import { createLibrary } from "@core/runtime/built-in/lib_factory.ts";
import { simple } from "@core/runtime/built-in/func_builder.ts";
import { MK_NUMBER, type FunctionCall } from "@core/runtime/values.ts";

const add: FunctionCall = simple(["number", "number"], (a, b) => {
  return MK_NUMBER(a.value + b.value);
});

export default createLibrary("MyMath", { add }, {});
