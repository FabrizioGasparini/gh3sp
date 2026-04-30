import { type FunctionCall, type RuntimeValue } from "@core/runtime/values.ts";

// Simple helper to create a library default export shape
export function createLibrary(name: string, functions: Record<string, FunctionCall>, constants: Record<string, RuntimeValue> = {}) {
  return {
    [name]: {
      functions,
      constants,
    },
  } as Record<string, { functions: Record<string, FunctionCall>; constants: Record<string, RuntimeValue> }>;
}

// Helper to create a native wrapper from a simpler JS function (optional)
export function wrap(fn: (...args: any[]) => any): FunctionCall {
  return (args: any[], line: number, column: number, env?: any) => {
    // The provided `fn` can accept (args) or (args, line, column, env)
    return (fn as any)(args, line, column, env);
  };
}
