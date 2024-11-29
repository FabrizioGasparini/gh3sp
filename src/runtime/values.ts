import { Statement } from "../frontend/ast.ts";
import Environment from "./environments.ts";

// List of types that every value can have
export type ValueType = "null" | "number" | "boolean" | "string" | "object" | "native-function" | "list" | "function";

// Default value
export interface RuntimeValue {
    type: ValueType;
    // deno-lint-ignore no-explicit-any
    value: any;
}

// Null value
export interface NullValue extends RuntimeValue {
    type: "null";
    value: null;
}
// Returns a null value
export function MK_NULL() {
    return { type: "null", value: null } as NullValue;
}

// Number value
export interface NumberValue extends RuntimeValue {
    type: "number";
    value: number;
}
// Returns a number value from a given number
export function MK_NUMBER(n = 0) {
    return { type: "number", value: n } as NumberValue;
}

// String value
export interface StringValue extends RuntimeValue {
    type: "string";
    value: string;
}
// Returns a string value from a given string
export function MK_STRING(s = "") {
    return { type: "string", value: s } as StringValue;
}

// String value
export interface BoolValue extends RuntimeValue {
    type: "boolean";
    value: boolean;
}
// Returns a bool value from a given boolean
export function MK_BOOL(b = false) {
    return { type: "boolean", value: b } as BoolValue;
}

// Object value
export interface ObjectValue extends RuntimeValue {
    type: "object";
    properties: Map<string, RuntimeValue>;
    native: boolean;
}
// Returns an object value from a given map
export function MK_OBJECT(props: Map<string, RuntimeValue>) {
    return { type: "object", properties: props, native: true } as ObjectValue;
}

// List value
export interface ListValue extends RuntimeValue {
    type: "list";
    value: RuntimeValue[];
    name?: string;
}

// Function Call
export type FunctionCall = (args: RuntimeValue[], line: number, column: number, env: Environment) => RuntimeValue;
// Returns a native function value from a given function call
export function MK_NATIVE_FUNCTION(call: FunctionCall) {
    return { type: "native-function", call, name: call.name } as NativeFunctionValue;
}

// Native function value
export interface NativeFunctionValue extends RuntimeValue {
    type: "native-function";
    call: FunctionCall;
    name: string;
}

// Function value
export interface FunctionValue extends RuntimeValue {
    type: "function";
    name: string;
    parameters: string[];
    declarationEnv: Environment;
    body: Statement[];
}
