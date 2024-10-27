import { Statement } from "../frontend/ast.ts";
import Environment from "./environments.ts";

export type ValueType = "null" | "number" | "boolean" | "string" | "object" | "native-function" | "list" | "function";

export interface RuntimeValue {
    type: ValueType;
    // deno-lint-ignore no-explicit-any
    value: any;
}

export interface NullValue extends RuntimeValue {
    type: "null";
    value: null;
}
export function MK_NULL() {
    return { type: "null", value: null } as NullValue;
}

export interface NumberValue extends RuntimeValue {
    type: "number";
    value: number;
}
export function MK_NUMBER(n = 0) {
    return { type: "number", value: n } as NumberValue;
}

export interface StringValue extends RuntimeValue {
    type: "string";
    value: string;
}
export function MK_STRING(s = "") {
    return { type: "string", value: s } as StringValue;
}

export interface BoolValue extends RuntimeValue {
    type: "boolean";
    value: boolean;
}
export function MK_BOOL(b = false) {
    return { type: "boolean", value: b } as BoolValue;
}

export interface ObjectValue extends RuntimeValue {
    type: "object";
    properties: Map<string, RuntimeValue>;
    native: boolean;
}

export function MK_OBJECT(props: Map<string, RuntimeValue>) {
    return { type: "object", properties: props, native: true } as ObjectValue;
}

export interface ListValue extends RuntimeValue {
    type: "list";
    value: RuntimeValue[];
    name?: string;
}

export type FunctionCall = (args: RuntimeValue[], line: number, column: number, env: Environment) => RuntimeValue;

export function MK_NATIVE_FUNCTION(call: FunctionCall) {
    return { type: "native-function", call, name: call.name } as NativeFunctionValue;
}
export interface NativeFunctionValue extends RuntimeValue {
    type: "native-function";
    call: FunctionCall;
    name: string;
}

export interface FunctionValue extends RuntimeValue {
    type: "function";
    name: string;
    parameters: string[];
    declarationEnv: Environment;
    body: Statement[];
}
