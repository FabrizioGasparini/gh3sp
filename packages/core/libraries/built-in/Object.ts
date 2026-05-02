import { createLibrary } from "@core/runtime/built-in/lib_factory";
import { simple } from "@core/runtime/built-in/func_builder";
import {
  type FunctionCall,
  type RuntimeValue,
  MK_LIST,
  MK_STRING,
  ObjectValue,
} from "@core/runtime/values";

const keys: FunctionCall = simple(["object"], (obj: RuntimeValue) => {
  const object = obj as ObjectValue;
  const result: RuntimeValue[] = [];
  for (const key of object.properties.keys()) result.push(MK_STRING(key));
  return MK_LIST(result);
});

const values: FunctionCall = simple(["object"], (obj: RuntimeValue) => {
  const object = obj as ObjectValue;
  const result: RuntimeValue[] = [];
  for (const value of object.properties.values()) result.push(value);
  return MK_LIST(result);
});

export default createLibrary(
  "Object",
  {
    keys,
    values,
  },
  {},
);
