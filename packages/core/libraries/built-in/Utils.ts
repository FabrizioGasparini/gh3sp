import Environment from "@core/runtime/environments.ts";
import { evaluate } from "@core/runtime/interpreter.ts";
import { createLibrary } from "@core/runtime/built-in/lib_factory.ts";
import {
  type FunctionCall,
  type RuntimeValue,
  MK_LIST,
  MK_NUMBER,
  MK_STRING,
  MK_NULL,
  MK_BOOL,
  MK_OBJECT,
  ListValue,
  ObjectValue,
  ClassInstanceValue,
  FunctionValue,
} from "@core/runtime/values.ts";
import { handleError } from "@core/utils/errors_handler.ts";

function throwError(error: string, line: number, column: number) {
  throw handleError(new SyntaxError(error), line, column);
}

function deepClone(value: RuntimeValue): RuntimeValue {
  switch (value.type) {
    case "null":
      return MK_NULL();
    case "number":
      return MK_NUMBER(value.value);
    case "string":
      return MK_STRING(value.value);
    case "boolean":
      return MK_BOOL(value.value);
    case "list": {
      const list = value as ListValue;
      const cloned = list.value.map((v) => deepClone(v));
      return MK_LIST(cloned);
    }
    case "object": {
      const obj = value as ObjectValue;
      const props = new Map<string, RuntimeValue>();
      for (const [k, v] of obj.properties.entries()) props.set(k, deepClone(v));
      return MK_OBJECT(props);
    }
    // For functions, native-functions, classes and class-instances we keep references
    default:
      return value;
  }
}

function deepEqual(a: RuntimeValue, b: RuntimeValue): boolean {
  if (a.type !== b.type) return false;

  switch (a.type) {
    case "null":
      return true;
    case "number":
    case "string":
    case "boolean":
      return a.value === (b as any).value;
    case "list": {
      const la = (a as ListValue).value;
      const lb = (b as ListValue).value;
      if (la.length !== lb.length) return false;
      for (let i = 0; i < la.length; i++)
        if (!deepEqual(la[i], lb[i])) return false;
      return true;
    }
    case "object": {
      const oa = (a as ObjectValue).properties;
      const ob = (b as ObjectValue).properties;
      if (oa.size !== ob.size) return false;
      for (const [k, v] of oa.entries()) {
        if (!ob.has(k)) return false;
        if (!deepEqual(v, ob.get(k)!)) return false;
      }
      return true;
    }
    default:
      // functions, native-functions, classes and class-instances: compare by reference
      return a === b;
  }
}

// clone(value)
const cloneFn: FunctionCall = (
  args: RuntimeValue[],
  line: number,
  column: number,
) => {
  if (args.length !== 1)
    throwError("clone expects exactly one argument", line, column);
  return deepClone(args[0]);
};

// deepEqual(a, b)
const deepEqualFn: FunctionCall = (
  args: RuntimeValue[],
  line: number,
  column: number,
) => {
  if (args.length !== 2)
    throwError("deepEqual expects exactly two arguments", line, column);
  return MK_BOOL(deepEqual(args[0], args[1]));
};

// range(start, end, step?) or range(end)
const rangeFn: FunctionCall = (
  args: RuntimeValue[],
  line: number,
  column: number,
) => {
  if (args.length < 1 || args.length > 3)
    throwError("range expects 1..3 numeric arguments", line, column);

  const nums = args.map((a) => {
    if (a.type !== "number")
      throwError("range arguments must be numbers", line, column);
    return a.value as number;
  });

  let start: number, end: number, step: number;
  if (nums.length === 1) {
    start = 0;
    end = nums[0];
    step = start <= end ? 1 : -1;
  } else if (nums.length === 2) {
    start = nums[0];
    end = nums[1];
    step = start <= end ? 1 : -1;
  } else {
    start = nums[0];
    end = nums[1];
    step = nums[2];
    if (step === 0) throwError("range step cannot be zero", line, column);
  }

  const out: RuntimeValue[] = [];
  if (step > 0) {
    for (let i = start; i <= end; i += step) out.push(MK_NUMBER(i));
  } else {
    for (let i = start; i >= end; i += step) out.push(MK_NUMBER(i));
  }

  return MK_LIST(out);
};

// sum(list)
const sumFn: FunctionCall = (
  args: RuntimeValue[],
  line: number,
  column: number,
) => {
  if (args.length !== 1)
    throwError("sum expects 1 argument (list)", line, column);
  if (args[0].type !== "list") throwError("sum expects a list", line, column);

  const list = args[0] as ListValue;
  let total = 0;
  for (const v of list.value) {
    if (v.type !== "number")
      throwError("sum expects a list of numbers", line, column);
    total += v.value;
  }
  return MK_NUMBER(total);
};

// unique(list)
const uniqueFn: FunctionCall = (
  args: RuntimeValue[],
  line: number,
  column: number,
) => {
  if (args.length !== 1)
    throwError("unique expects 1 argument (list)", line, column);
  if (args[0].type !== "list")
    throwError("unique expects a list", line, column);

  const list = args[0] as ListValue;
  const out: RuntimeValue[] = [];
  for (const item of list.value) {
    if (!out.some((e) => deepEqual(e, item))) out.push(item);
  }
  return MK_LIST(out);
};

// flatten(list, depth = 1)
const flattenFn: FunctionCall = (
  args: RuntimeValue[],
  line: number,
  column: number,
) => {
  if (args.length < 1 || args.length > 2)
    throwError("flatten expects 1..2 arguments", line, column);
  if (args[0].type !== "list")
    throwError("flatten expects a list", line, column);
  const depth =
    args.length === 2 ? (args[1].type === "number" ? args[1].value : null) : 1;
  if (depth === null)
    throwError("flatten depth must be a number", line, column);

  const result: RuntimeValue[] = [];
  function _flatten(arr: RuntimeValue[], d: number) {
    for (const v of arr) {
      if (v.type === "list" && d > 0) _flatten((v as ListValue).value, d - 1);
      else result.push(v);
    }
  }

  _flatten((args[0] as ListValue).value, depth);
  return MK_LIST(result);
};

// merge(obj1, obj2, deep=false)
const mergeFn: FunctionCall = (
  args: RuntimeValue[],
  line: number,
  column: number,
) => {
  if (args.length < 2 || args.length > 3)
    throwError("merge expects 2..3 arguments", line, column);
  if (args[0].type !== "object" || args[1].type !== "object")
    throwError("merge expects objects as first two arguments", line, column);
  const deep =
    args.length === 3
      ? args[2].type === "boolean"
        ? args[2].value
        : null
      : false;
  if (deep === null)
    throwError("merge third argument must be boolean", line, column);

  const a = args[0] as ObjectValue;
  const b = args[1] as ObjectValue;

  const result = new Map<string, RuntimeValue>();
  for (const [k, v] of a.properties.entries()) result.set(k, v);
  function mergeMaps(
    aMap: Map<string, RuntimeValue>,
    bMap: Map<string, RuntimeValue>,
  ): Map<string, RuntimeValue> {
    const out = new Map<string, RuntimeValue>();
    for (const [k, v] of aMap.entries()) out.set(k, v);
    for (const [k, v] of bMap.entries()) {
      if (!out.has(k)) out.set(k, v);
      else {
        const existing = out.get(k)!;
        if (deep && existing.type === "object" && v.type === "object") {
          const mergedInner = mergeMaps(
            (existing as ObjectValue).properties,
            (v as ObjectValue).properties,
          );
          out.set(k, MK_OBJECT(mergedInner));
        } else {
          out.set(k, v);
        }
      }
    }
    return out;
  }

  const mergedMap = mergeMaps(a.properties, b.properties);
  return MK_OBJECT(mergedMap);

  return MK_OBJECT(result);
};

// reduce(list, fn(acc, cur), initial?)
const reduceFn: FunctionCall = (
  args: RuntimeValue[],
  line: number,
  column: number,
  env: Environment,
) => {
  if (args.length < 2 || args.length > 3)
    throwError("reduce expects 2..3 arguments", line, column);
  if (args[0].type !== "list")
    throwError("reduce expects a list as first argument", line, column);
  if (args[1].type !== "function")
    throwError("reduce expects a function as second argument", line, column);

  const list = args[0] as ListValue;
  const fn = args[1] as FunctionValue;

  const scope = new Environment(env);

  // declare params
  for (const p of fn.parameters) scope.declareVar(p, MK_NULL(), false);

  let acc: RuntimeValue = args.length === 3 ? args[2] : MK_NULL();

  if (fn.body.length > 1)
    throwError(
      "Function passed to reduce must have a single expression in its body",
      line,
      column,
    );

  for (const v of list.value) {
    // assign params
    if (fn.parameters.length > 0) scope.assignVar(fn.parameters[0], acc);
    if (fn.parameters.length > 1) scope.assignVar(fn.parameters[1], v);

    const res = evaluate(fn.body[0], scope);
    acc = res;
  }

  return acc;
};

export default createLibrary(
  "Utils",
  {
    clone: cloneFn,
    deepEqual: deepEqualFn,
    range: rangeFn,
    sum: sumFn,
    unique: uniqueFn,
    flatten: flattenFn,
    merge: mergeFn,
    reduce: reduceFn,
  },
  {},
);
