import Environment from "@core/runtime/environments";
import { evaluate } from "@core/runtime/interpreter";
import { createLibrary } from "@core/runtime/built-in/lib_factory";
import { build } from "@core/runtime/built-in/func_builder";
import {
  type FunctionCall,
  type RuntimeValue,
  type ListValue,
  MK_NULL,
  MK_BOOL,
  MK_LIST,
  MK_NUMBER,
  type FunctionValue,
  MK_STRING,
} from "@core/runtime/values";
import { handleError } from "@core/utils/errors_handler";

function throwError(error: string, line: number, column: number) {
  throw handleError(new SyntaxError(error), line, column);
}

function compare(a: RuntimeValue, b: RuntimeValue): number {
  if (a.type == "number" && b.type == "number") return a.value - b.value;
  else if (a.type == "string" && b.type == "string")
    return a.value.localeCompare(b.value);
  else return a.type == "number" ? -1 : 1;
}

const push: FunctionCall = build(
  [
    { name: "list", type: "list" },
    { name: "elem", type: "any" },
  ],
  (args, env) => {
    const list = args[0] as ListValue;
    const elem = args[1];

    list.value.push(elem);

    if (!list.name) return list;
    return env!.assignVar(list.name!, list);
  },
);

const pop: FunctionCall = build(
  [{ name: "list", type: "list" }],
  (args, env) => {
    const list = args[0] as ListValue;
    const value = list.value.pop();

    if (list.name) env!.assignVar(list.name!, list);

    if (value == undefined) return MK_NULL();
    return value;
  },
);

const shift: FunctionCall = build(
  [{ name: "list", type: "list" }],
  (args, env) => {
    const list = args[0] as ListValue;
    const value = list.value.shift();

    if (list.name) env!.assignVar(list.name!, list);

    if (value == undefined) return MK_NULL();
    return value;
  },
);

const unshift: FunctionCall = build(
  [
    { name: "list", type: "list" },
    { name: "elem", type: "any" },
  ],
  (args, env) => {
    const list = args[0] as ListValue;
    const elem = args[1];

    list.value.unshift(elem);

    if (!list.name) return list;
    return env!.assignVar(list.name!, list);
  },
);

const slice: FunctionCall = build(
  [
    { name: "list", type: "list" },
    { name: "start", type: "number", optional: true },
    { name: "end", type: "number", optional: true },
  ],
  (args) => {
    const list = args[0] as ListValue;
    const start = args[1].type === "number" ? (args[1] as any).value : 0;
    const end =
      args[2].type === "number" ? (args[2] as any).value : list.value.length;

    return {
      type: "list",
      value: list.value.slice(start, end),
      name: list.name,
    } as ListValue;
  },
);

const contains: FunctionCall = build(
  [
    { name: "list", type: "list" },
    { name: "elem", type: "any" },
  ],
  (args) => {
    const list = args[0] as ListValue;
    const target = args[1];

    for (const value of list.value) {
      if (value.type == target.type && value.value == (target as any).value)
        return MK_BOOL(true);
    }

    return MK_BOOL(false);
  },
);

const reverse: FunctionCall = build(
  [{ name: "list", type: "list" }],
  (args, env) => {
    const list = args[0] as ListValue;
    list.value.reverse();
    return env!.assignVar(list.name!, list);
  },
);

const filter: FunctionCall = build(
  [
    { name: "list", type: "list" },
    { name: "fn", type: "function" },
  ],
  async (args, env, line?, column?) => {
    const list = args[0] as ListValue;
    const fn = args[1] as FunctionValue;

    if (fn.parameters.length > 1)
      throwError(
        "Invalid function argument: function must have only one parameter",
        line ?? 0,
        column ?? 0,
      );
    if (fn.body.length > 1)
      throwError(
        "Invalid function argument: function must have only one expression in its body",
        line ?? 0,
        column ?? 0,
      );

    const scope = new Environment(env);
    const varname = fn.parameters[0];
    scope.declareVar(varname, MK_NULL(), false);

    const values: RuntimeValue[] = [];
    for (let i = 0; i < list.value.length; i++) {
      const value = list.value[i];
      scope.assignVar(varname, value);

      const test = (await evaluate(fn.body[0], scope)) as RuntimeValue;
      if (test && test.value == true) values.push(value);
    }

    return { type: "list", value: values, name: list.name } as ListValue;
  },
);

const map: FunctionCall = build(
  [
    { name: "list", type: "list" },
    { name: "fn", type: "function" },
  ],
  async (args, env, line?, column?) => {
    const list = args[0] as ListValue;
    const fn = args[1] as FunctionValue;

    if (fn.parameters.length > 1)
      throwError(
        "Invalid function argument: function must have only one parameter",
        line ?? 0,
        column ?? 0,
      );
    if (fn.body.length > 1)
      throwError(
        "Invalid function argument: function must have only one expression in its body",
        line ?? 0,
        column ?? 0,
      );

    const scope = new Environment(env);
    const varname = fn.parameters[0];
    scope.declareVar(varname, MK_NULL(), false);

    const values: RuntimeValue[] = [];
    for (let i = 0; i < list.value.length; i++) {
      const value = list.value[i];
      scope.assignVar(varname, value);

      const result: RuntimeValue = await evaluate(fn.body[0], scope);
      values.push(result ? result.value : list.value[i]);
    }

    return { type: "list", value: values, name: list.name } as ListValue;
  },
);

const sort: FunctionCall = build(
  [
    { name: "list", type: "list" },
    {
      name: "inverted",
      type: "boolean",
      optional: true,
      default: MK_BOOL(false),
    },
  ],
  (args, env) => {
    const list = args[0] as ListValue;
    const inverted = args[1].type == "boolean" ? (args[1] as any).value : false;

    for (let i = 0; i < list.value.length - 1; i++) {
      for (let j = 0; j < list.value.length - i - 1; j++) {
        const comp = compare(list.value[j], list.value[j + 1]);
        if (inverted ? comp < 0 : comp > 0) {
          const temp = list.value[j];
          list.value[j] = list.value[j + 1];
          list.value[j + 1] = temp;
        }
      }
    }

    return env!.assignVar(list.name!, list);
  },
);

export default createLibrary(
  "List",
  {
    push,
    pop,
    shift,
    unshift,
    slice,
    contains,
    reverse,
    filter,
    map,
    sort,
  },
  {},
);
