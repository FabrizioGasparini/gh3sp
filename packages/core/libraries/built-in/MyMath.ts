import { createLibrary } from "@core/runtime/built-in/lib_factory";
import { simple } from "@core/runtime/built-in/func_builder";
import { MK_NUMBER, type FunctionCall } from "@core/runtime/values";

const add: FunctionCall = simple(["number", "number"], (a, b) => {
  return MK_NUMBER(a.value + b.value);
});

export default createLibrary("MyMath", { add }, {});
