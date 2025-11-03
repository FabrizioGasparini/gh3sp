export declare const MK_NUMBER: (value: number) => RuntimeValue;
export declare const MK_STRING: (value: string) => RuntimeValue;

export class MathError extends Error {
    constructor(error: string);
}

export type ValueType = "null" | "number" | "boolean" | "string" | "object" | "native-function" | "list" | "function";
export interface RuntimeValue {
    type: ValueType;
    value: any;
}

type Environment = "";
export type FunctionCall = (args: RuntimeValue[], line: number, column: number, env: Environment) => RuntimeValue;

export declare const handleError: (error: Error, line: number, column: number) => null;
