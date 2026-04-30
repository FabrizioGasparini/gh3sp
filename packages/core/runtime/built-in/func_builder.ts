import { handleError } from "@core/utils/errors_handler.ts";
import Environment from "@core/runtime/environments.ts";
import {
  type FunctionCall,
  type RuntimeValue,
  MK_LIST,
  MK_NULL,
} from "@core/runtime/values.ts";

const throwError = (error: Error | string, line: number, column: number) => {
  if (typeof error === "string") error = new SyntaxError(String(error));
  throw handleError(error as Error, line, column);
};

export type ParamType =
  | "number"
  | "string"
  | "boolean"
  | "object"
  | "list"
  | "function"
  | "native-function"
  | "class"
  | "class-instance"
  | "reactive"
  | "any";

export interface ParamDescriptor {
  name: string;
  type?: ParamType | ParamType[]; // expected runtime type(s)
  optional?: boolean;
  default?: RuntimeValue; // default runtime value to use when missing
  variadic?: boolean; // if true, consume the rest of the args into a list
}

/**
 * Build a FunctionCall with automatic arity and type checking.
 *
 * Example:
 * const fn = build([
 *   { name: 's', type: 'string' },
 *   { name: 'n', type: 'number', optional: true, default: MK_NUMBER(0) }
 * ], (args, env) => {
 *   // args[0] and args[1] are guaranteed to be present and typed
 *   return MK_STRING(...);
 * });
 */
export function build(
  descriptors: ParamDescriptor[],
  handler: (
    args: RuntimeValue[],
    env?: Environment,
    line?: number,
    column?: number,
  ) => RuntimeValue,
): FunctionCall {
  const minArgs = descriptors.filter((p) => !p.optional && !p.variadic).length;
  const hasVariadic = descriptors.some((p) => p.variadic);

  return (
    args: RuntimeValue[],
    line: number,
    column: number,
    env?: Environment,
  ) => {
    if (args.length < minArgs) {
      throwError(
        new SyntaxError(
          `Invalid number of arguments. Expected at least ${minArgs} but received ${args.length}`,
        ),
        line,
        column,
      );
    }

    if (!hasVariadic) {
      // check max
      const maxArgs = descriptors.length;
      if (args.length > maxArgs) {
        throwError(
          new SyntaxError(
            `Invalid number of arguments. Expected at most ${maxArgs} but received ${args.length}`,
          ),
          line,
          column,
        );
      }
    }

    const validated: RuntimeValue[] = [];

    for (let i = 0; i < descriptors.length; i++) {
      const desc = descriptors[i];

      if (desc.variadic) {
        // collect remaining args into a list runtime value
        const rest = args.slice(i);
        if (desc.type && desc.type !== "any") {
          const allowed = Array.isArray(desc.type) ? desc.type : [desc.type];
          for (const r of rest) {
            if (!allowed.includes(r.type as ParamType)) {
              throwError(
                new TypeError(
                  `Invalid argument type for variadic parameter '${desc.name}'. Expected ${allowed.join("|")}, got ${r.type}`,
                ),
                line,
                column,
              );
            }
          }
        }
        validated.push(MK_LIST(rest));
        break;
      }

      const arg = args[i];
      if (arg === undefined) {
        if (desc.optional) {
          validated.push(desc.default ?? MK_NULL());
          continue;
        } else {
          // Shouldn't happen because we checked minArgs
          throwError(
            new SyntaxError(`Missing required argument '${desc.name}'`),
            line,
            column,
          );
        }
      }

      if (desc.type && desc.type !== "any") {
        const allowed = Array.isArray(desc.type) ? desc.type : [desc.type];
        if (!allowed.includes(arg.type as ParamType)) {
          throwError(
            new TypeError(
              `Invalid argument type for '${desc.name}'. Expected ${allowed.join("|")}, got ${arg.type}`,
            ),
            line,
            column,
          );
        }
      }

      validated.push(arg);
    }

    // If there are fewer args than descriptors, fill optional params with defaults / MK_NULL placeholder
    if (validated.length < descriptors.length) {
      for (let j = validated.length; j < descriptors.length; j++) {
        const d = descriptors[j];
        validated.push(d.default ?? MK_NULL());
      }
    }

    // call handler
    return handler(validated, env, line, column);
  };
}

/**
 * Convenience: build a function expecting a fixed number of arguments and types
 * Example: const f = simple(['list','function'], (list, fn, env) => ...)
 * The handler receives runtime values (not unwrapped native JS values)
 */
export function simple(
  types: (ParamType | { type: ParamType; optional?: boolean })[],
  handler: (...args: any[]) => RuntimeValue,
): FunctionCall {
  const descriptors: ParamDescriptor[] = types.map((t, idx) => {
    if (typeof t === "string") return { name: `arg${idx}`, type: t };
    return { name: `arg${idx}`, type: t.type, optional: !!t.optional };
  });

  return build(
    descriptors,
    (
      args: RuntimeValue[],
      env?: Environment,
      line?: number,
      column?: number,
    ) => {
      return handler(...args, env, line, column);
    },
  );
}
