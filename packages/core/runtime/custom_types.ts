import type { CustomValue, RuntimeValue } from "@core/runtime/values";
import type Environment from "@core/runtime/environments";

export type CustomGetter = (cv: CustomValue, env: Environment) => RuntimeValue;

export type CustomSetter = (
  cv: CustomValue,
  value: RuntimeValue,
  env: Environment,
) => RuntimeValue | void;

export type CustomMethod = (
  cv: CustomValue,
  args: RuntimeValue[],
  line: number,
  column: number,
  env: Environment,
) => RuntimeValue;

export type CustomFactory = (
  args: RuntimeValue[],
  line: number,
  column: number,
  env: Environment,
) => RuntimeValue;

export type CustomEquals = (a: CustomValue, b: CustomValue) => boolean;
export type CustomToJSON = (cv: CustomValue) => RuntimeValue;
export type CustomClone = (cv: CustomValue) => CustomValue;

export interface CustomTypeDescriptor {
  methods?: Record<string, CustomMethod>;
  getters?: Record<string, CustomGetter>;
  setters?: Record<string, CustomSetter>;
  factory?: CustomFactory;
  equals?: CustomEquals;
  toJSON?: CustomToJSON;
  clone?: CustomClone;
  toString?: (cv: CustomValue) => RuntimeValue | string;
  isMutable?: boolean; // default true
}

const registry = new Map<string, CustomTypeDescriptor>();

export function registerCustomType(name: string, desc: CustomTypeDescriptor) {
  registry.set(name, desc);
}

export function getCustomTypeDescriptor(name: string) {
  return registry.get(name);
}
