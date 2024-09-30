import { Statement } from "../frontend/ast.ts";
import Environment from "./environments.ts";

export type ValueType =
    "null" |
    "number" |
    "boolean" |
    "object" |
    "native-function" |
    "function";

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

export interface BoolValue extends RuntimeValue {
    type: "boolean";
    value: boolean;
}
export function MK_BOOL(b = false) {
    return { type: "boolean", value: b } as BoolValue
}

export interface ObjectValue extends RuntimeValue {
    type: "object";
    properties: Map<string, RuntimeValue>;
}

export type FunctionCall = (args: RuntimeValue[], env: Environment) => RuntimeValue;

export function MK_NATIVE_FUNCTION(call: FunctionCall) {
    return { type: "native-function", call } as NativeFunctionValue
}

export interface NativeFunctionValue extends RuntimeValue {
    type: "native-function";
    call: FunctionCall;
}


export interface FunctionValue extends RuntimeValue {
    type: "function";
    name: string;
    parameters: string[];
    declarationEnv: Environment;
    body: Statement[];
}