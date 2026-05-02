import {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  ChooseExpression,
  CompoundAssignmentExpression,
  Expression,
  FunctionDeclaration,
  Identifier,
  ListLiteral,
  type LogicalExpression,
  MemberExpression,
  MembershipExpression,
  type NumericLiteral,
  ObjectLiteral,
  StringLiteral,
  type TernaryExpression,
  VariableDeclaration,
  AwaitExpression,
} from "@core/frontend/ast";
import { InterpreterError, MathError } from "@core/utils/errors_handler";
import Environment from "@core/runtime/environments";
import { evaluate, throwError } from "@core/runtime/interpreter";
import {
  BoolValue,
  ClassInstanceValue,
  ClassValue,
  FunctionValue,
  ListValue,
  MK_BOOL,
  MK_LIST,
  MK_NULL,
  MK_OBJECT,
  MK_NATIVE_FUNCTION,
  NativeFunctionValue,
  NumberValue,
  ObjectValue,
  ReactiveValue,
  RuntimeValue,
  StringValue,
  CustomValue,
  PromiseValue,
  MK_PROMISE,
} from "@core/runtime/values";
import { equals } from "@core/runtime/evaluation/statements";
import { getCustomTypeDescriptor } from "@core/runtime/custom_types";

// Helper: numeric binary
function evaluate_numeric_binary_expression(
  left: NumberValue,
  right: NumberValue,
  operator: string,
): NumberValue {
  switch (operator) {
    case "+":
      return { value: left.value + right.value, type: "number" } as NumberValue;
    case "-":
      return { value: left.value - right.value, type: "number" } as NumberValue;
    case "*":
      return { value: left.value * right.value, type: "number" } as NumberValue;
    case "/":
      if (right.value === 0)
        throwError(new MathError("Division by zero is not allowed"));
      return { value: left.value / right.value, type: "number" } as NumberValue;
    case "%":
      return { value: left.value % right.value, type: "number" } as NumberValue;
    case "^":
      return {
        value: left.value ** right.value,
        type: "number",
      } as NumberValue;
    case "//":
      return {
        value: parseInt((left.value / right.value).toString()),
        type: "number",
      } as NumberValue;
    default:
      throw throwError(
        new InterpreterError("Invalid binary expression operator: " + operator),
      );
  }
}

// String/number helpers
const evaluate_string_binary_expression = (
  left: StringValue,
  right: StringValue,
  operator: string,
): StringValue =>
  operator == "+"
    ? ({
        value: left.value.toString() + right.value.toString(),
        type: "string",
      } as StringValue)
    : throwError(
        new InterpreterError(
          "Invalid operation between strings: '" + operator + "'",
        ),
      );

const evaluate_mixed_string_numeric_binary_expression = (
  string: StringValue,
  number: NumberValue,
  operator: string,
): StringValue =>
  operator == "*"
    ? ({
        value: string.value.repeat(number.value),
        type: "string",
      } as StringValue)
    : throwError(
        new InterpreterError(
          "Invalid operation between string and number: '" + operator + "'",
        ),
      );

const evaluate_list_binary_expression = (
  left: ListValue,
  right: ListValue,
  operator: string,
): ListValue =>
  operator == "+"
    ? ({ type: "list", value: right.value.concat(left.value) } as ListValue)
    : throwError(
        new InterpreterError(
          "Invalid operation between lists : '" + operator + "' ",
        ),
      );

function evaluate_mixed_binary_expression(
  left: RuntimeValue,
  right: RuntimeValue,
  operator: string,
): RuntimeValue {
  switch (left.type) {
    case "number":
      if (right.type == "number")
        return evaluate_numeric_binary_expression(
          left as NumberValue,
          right as NumberValue,
          operator,
        );
      if (right.type == "string")
        return evaluate_mixed_string_numeric_binary_expression(
          right as StringValue,
          left as NumberValue,
          operator,
        );
      break;
    case "string":
      if (right.type == "string")
        return evaluate_string_binary_expression(
          left as StringValue,
          right as StringValue,
          operator,
        );
      if (right.type == "number")
        return evaluate_mixed_string_numeric_binary_expression(
          left as StringValue,
          right as NumberValue,
          operator,
        );
      break;
    case "list":
      if (right.type == "list")
        return evaluate_list_binary_expression(
          left as ListValue,
          right as ListValue,
          operator,
        );
      break;
    default:
      return MK_NULL();
  }
  return MK_NULL();
}

function compare_lists(a: RuntimeValue[], b: RuntimeValue[]): boolean {
  if (a.length != b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i].value != b[i].value) return false;
  return true;
}

function evaluate_comparison_binary_expression(
  left: RuntimeValue,
  right: RuntimeValue,
  operator: string,
): BoolValue {
  switch (operator) {
    case "==":
      if (left.type == right.type) {
        if (left.type == "list")
          return MK_BOOL(compare_lists(left.value, right.value));
        return MK_BOOL(left.value == right.value);
      }
      return MK_BOOL(false);
    case "!=":
      if (left.type == right.type) {
        if (left.type == "list")
          return MK_BOOL(!compare_lists(left.value, right.value));
        return MK_BOOL(left.value != right.value);
      }
      return MK_BOOL(true);
    case ">=":
      if (
        (left.type == "boolean" && right.type == "boolean") ||
        (left.type == "number" && right.type == "number")
      )
        return MK_BOOL(left.value >= right.value);
      break;
    case "<=":
      if (
        (left.type == "boolean" && right.type == "boolean") ||
        (left.type == "number" && right.type == "number")
      )
        return MK_BOOL(left.value <= right.value);
      break;
    case ">":
      if (
        (left.type == "boolean" && right.type == "boolean") ||
        (left.type == "number" && right.type == "number")
      )
        return MK_BOOL(left.value > right.value);
      break;
    case "<":
      if (
        (left.type == "boolean" && right.type == "boolean") ||
        (left.type == "number" && right.type == "number")
      )
        return MK_BOOL(left.value < right.value);
      break;
    default:
      throw throwError(
        new InterpreterError("Invalid comparison operator: '" + operator + "'"),
      );
  }
  throw throwError(
    new InterpreterError(
      "Invalid comparison operator: '" +
        operator +
        "' between type '" +
        left.type +
        "' and '" +
        right.type +
        "'",
    ),
  );
}

export async function evaluate_binary_expression(
  node: BinaryExpression,
  env: Environment,
): Promise<RuntimeValue> {
  let left = await evaluate(node.left, env);
  let right = await evaluate(node.right, env);
  if (left.type == "reactive") left = left.value;
  if (right.type == "reactive") right = right.value;
  if (node.negative) right.value *= -1;
  if (left == undefined || right == undefined)
    throw throwError(
      new InterpreterError(
        "Missing required parameter inside binary expression",
      ),
    );
  const op = node.operator;
  if (op == "??") return left.type == "null" ? right : left;
  const binary_operators = ["+", "-", "*", "/", "%", "^", "//"];
  if (binary_operators.includes(op))
    return evaluate_mixed_binary_expression(left, right, op);
  const comparison_operators = ["==", "!=", "<=", ">=", "<", ">"];
  if (comparison_operators.includes(op))
    return evaluate_comparison_binary_expression(left, right, op);
  return MK_NULL();
}

export async function evaluate_membership_expression(
  node: MembershipExpression,
  env: Environment,
): Promise<RuntimeValue> {
  let left = (await evaluate(node.left, env)) as RuntimeValue;
  let right = await evaluate(node.right, env);
  if (left.type == "reactive") left = left.value;
  if (right.type == "reactive") right = right.value;
  if (left == undefined || right == undefined)
    throw throwError(
      new InterpreterError(
        "Missing required parameter inside membership expression",
      ),
    );
  switch (right.type) {
    case "list": {
      let return_value = false;
      (right as ListValue).value.forEach((value) => {
        if (value.type == left.type && value.value == left.value)
          return_value = true;
      });
      return MK_BOOL(node.not != return_value);
    }
    case "object": {
      if (left.type != "string")
        throw throwError(
          new InterpreterError(
            "Invalid left parameter type in membership expression. Expected 'string' but received " +
              left.type,
          ),
        );
      const return_value: boolean = (right as ObjectValue).properties.has(
        (left as StringValue).value,
      );
      return MK_BOOL(node.not != return_value);
    }
    case "string": {
      if (left.type != "string")
        throw throwError(
          new InterpreterError(
            "Invalid left parameter type in membership expression. Expected 'string' but received " +
              left.type,
          ),
        );
      const return_value: boolean = (right as StringValue).value.includes(
        (left as StringValue).value,
      );
      return MK_BOOL(node.not != return_value);
    }
    default:
      throw throwError(
        new InterpreterError(
          "Invalid right parameter type in membership expression. Expected 'list', 'object' or 'string' but received " +
            right.type,
        ),
      );
  }
}

export async function evaluate_logical_expression(
  node: LogicalExpression,
  env: Environment,
): Promise<RuntimeValue> {
  const left = await evaluate(node.left, env);
  const right = await evaluate(node.right, env);
  if (left == undefined || right == undefined)
    throw throwError(
      new InterpreterError(
        "Missing required parameter inside logical expression",
      ),
    );
  const op = node.operator;
  switch (op) {
    case "&&":
      return MK_BOOL(left.value && right.value);
    case "||":
      return MK_BOOL(left.value || right.value);
    case "!":
      if (left.type != "boolean" || right.type != "boolean")
        throw throwError(
          new InterpreterError(
            "Invalid parameter inside logical expression. Expected boolean value.",
          ),
        );
      return MK_BOOL(!right.value);
    default:
      throw throwError(
        new InterpreterError("Invalid logical expression operator: " + op),
      );
  }
}

export const evaluate_identifier = async (
  ident: Identifier,
  env: Environment,
): Promise<RuntimeValue> => {
  const val = env.lookupVar(ident.symbol);
  if (val.type === "reactive") {
    const reactive = val as ReactiveValue;
    const resolved = await evaluate(reactive.node, env.resolve(ident.symbol));
    return {
      type: "reactive",
      name: reactive.name,
      node: reactive.node,
      value: resolved,
    } as ReactiveValue;
  }
  return val;
};

function get_member_expression_result(
  node: MemberExpression,
  env: Environment,
): RuntimeValue {
  let object = node.object;
  if (object.kind != "Identifier") {
    while (object.kind != "Identifier")
      object = (object as MemberExpression).object;
  }
  return env.lookupVar((object as Identifier).symbol) as ObjectValue;
}

function get_member_expression_variable(node: MemberExpression): Identifier {
  let object = node.object;
  if (object.kind != "Identifier") {
    while (object.kind != "Identifier")
      object = (object as MemberExpression).object;
  }
  return object as Identifier;
}

function get_object_props(node: MemberExpression): string[] {
  let object = node.object;
  const props: string[] = [
    node.computed
      ? (node.property as StringLiteral).value
      : (node.property as Identifier).symbol,
  ];
  if (node.computed) {
    if (object.kind != "Identifier") {
      while (object.kind != "Identifier") {
        props.unshift(
          ((object as MemberExpression).property as StringLiteral).value,
        );
        object = (object as MemberExpression).object;
      }
    }
  } else {
    if (object.kind != "Identifier") {
      while (object.kind != "Identifier") {
        props.unshift(
          ((object as MemberExpression).property as Identifier).symbol,
        );
        object = (object as MemberExpression).object;
      }
    }
  }
  return props;
}

export async function evaluate_assignment_expression(
  node: AssignmentExpression,
  env: Environment,
): Promise<RuntimeValue> {
  switch (node.assignee.kind) {
    case "Identifier":
      return env.assignVar(
        (node.assignee as Identifier).symbol,
        await evaluate(node.value, env),
      );
    case "MemberExpression": {
      const member = node.assignee as MemberExpression;
      const expression = get_member_expression_result(member, env);
      const variable = get_member_expression_variable(member).symbol;
      switch (expression.type) {
        case "list": {
          const idx = (member.property as NumericLiteral).value;
          if (typeof idx != "number")
            throw throwError(
              new InterpreterError("Invalid list index: " + idx),
            );
          expression.value[idx] = await evaluate(node.value, env);
          return env.assignVar(variable, expression);
        }
        case "object": {
          const object = expression;
          const props = get_object_props(member);
          const key = props.pop()!;
          if (!key)
            throw throwError(
              new InterpreterError("Invalid object key (not found)"),
            );
          let result = object;
          for (const prop of props) {
            if ((result as ObjectValue).properties.has(prop))
              result = (result as ObjectValue).properties.get(prop)!;
          }
          (result as ObjectValue).properties.set(
            key,
            await evaluate(node.value, env),
          );
          if (variable == "this") return object;
          return env.assignVar(variable, object);
        }
        case "class-instance": {
          const instance = expression as ClassInstanceValue;
          const props = get_object_props(member);
          const key = props.pop()!;
          if (!key)
            throw throwError(
              new InterpreterError("Invalid object key (not found)"),
            );
          let current: RuntimeValue = instance;
          for (const prop of props) {
            if (current.type === "class-instance") {
              const classVal = current as ClassInstanceValue;
              if (!classVal.value.properties.has(prop))
                throw throwError(
                  new InterpreterError(
                    `Property '${prop}' not found in class instance.`,
                  ),
                );
              current = classVal.value.properties.get(prop)!;
            } else if (current.type === "object") {
              const objVal = current as ObjectValue;
              if (!objVal.properties.has(prop))
                throw throwError(
                  new InterpreterError(
                    `Property '${prop}' not found in object.`,
                  ),
                );
              current = objVal.properties.get(prop)!;
            } else {
              throw throwError(
                new InterpreterError(
                  `Cannot access property '${prop}' of non-object type.`,
                ),
              );
            }
          }
          const valueToSet = await evaluate(node.value, env);
          if (current.type === "class-instance") {
            const targetClass = current as ClassInstanceValue;
            if (targetClass.value.properties.has(key)) {
              targetClass.value.properties.set(key, valueToSet);
            } else if (targetClass.privateMembers.properties.has(key)) {
              targetClass.privateMembers.properties.set(key, valueToSet);
            } else if (targetClass.environment.variables.has(key)) {
            } else {
              throw throwError(
                new InterpreterError(
                  `Invalid property '${key}' in class instance.`,
                ),
              );
            }
            targetClass.environment.assignVar(key, valueToSet, true);
          } else if (current.type === "object") {
            const targetObj = current as ObjectValue;
            targetObj.properties.set(key, valueToSet);
          }
          if (variable === "this") return instance;
          return env.assignVar(variable, instance);
        }
        case "custom": {
          const cv = expression as CustomValue;
          const props = get_object_props(member);
          const key = props.pop()!;
          if (!key)
            throw throwError(
              new InterpreterError("Invalid object key (not found)"),
            );
          let current: RuntimeValue = cv;
          for (const prop of props) {
            if (current.type === "custom") {
              const customVal = current as CustomValue;
              if (
                !customVal.value ||
                (customVal.value as RuntimeValue).type !== "object"
              )
                throw throwError(
                  new InterpreterError(
                    `Property '${prop}' not found in custom value.`,
                  ),
                );
              current = (customVal.value as ObjectValue).properties.get(prop)!;
            } else if (current.type === "object") {
              const objVal = current as ObjectValue;
              if (!objVal.properties.has(prop))
                throw throwError(
                  new InterpreterError(
                    `Property '${prop}' not found in object.`,
                  ),
                );
              current = objVal.properties.get(prop)!;
            } else {
              throw throwError(
                new InterpreterError(
                  `Cannot access property '${prop}' of non-object type.`,
                ),
              );
            }
          }
          const valueToSet = await evaluate(node.value, env);
          if (current.type === "custom") {
            const targetCustom = current as CustomValue;
            const desc = getCustomTypeDescriptor(targetCustom.name);
            if (desc && desc.setters && desc.setters[key]) {
              desc.setters[key](targetCustom, valueToSet, env);
              return env.assignVar(variable, cv);
            }
            if (
              targetCustom.value &&
              (targetCustom.value as RuntimeValue).type === "object" &&
              desc?.isMutable !== false
            ) {
              (targetCustom.value as ObjectValue).properties.set(
                key,
                valueToSet,
              );
              return env.assignVar(variable, cv);
            }
            throw throwError(
              new InterpreterError(
                `Cannot assign to property '${key}' on custom '${targetCustom.name}'`,
              ),
            );
          }
          if (current.type === "object") {
            (current as ObjectValue).properties.set(key, valueToSet);
          }
          return env.assignVar(variable, cv);
        }
        default:
          throw throwError(
            new InterpreterError(
              "Invalid assignment expression " + JSON.stringify(node.assignee),
            ),
          );
      }
    }
    default:
      throw throwError(
        new InterpreterError(
          "Invalid assignment expression " + JSON.stringify(node.assignee),
        ),
      );
  }
}

export async function evaluate_compound_assignment_expression(
  node: CompoundAssignmentExpression,
  env: Environment,
): Promise<RuntimeValue> {
  const op = node.operator.substring(0, node.operator.length - 1);
  switch (node.assignee.kind) {
    case "MemberExpression": {
      const member = node.assignee as MemberExpression;
      const expression = get_member_expression_result(member, env);
      const variable = get_member_expression_variable(member).symbol;
      const props = get_object_props(member);
      const key = props.pop()!;
      if (!key) throw throwError(new InterpreterError("Invalid object key"));
      let result = expression;
      for (const prop of props) {
        if ((result as ObjectValue).properties.has(prop))
          result = (result as ObjectValue).properties.get(prop)!;
      }
      const new_value = await evaluate(node.value, env);
      switch (result.type) {
        case "object": {
          if (!(result as ObjectValue).properties.has(key)) {
            if (op == "??") {
              (result as ObjectValue).properties.set(key, new_value);
              return env.assignVar(variable, expression);
            }
            throw throwError(
              new InterpreterError("Invalid object key (not found)"),
            );
          }
          const current_value = (result as ObjectValue).properties.get(key)!;
          if (op == "??") {
            if (current_value.type == "null") {
              (result as ObjectValue).properties.set(key, new_value);
              return env.assignVar(variable, expression);
            }
            return expression;
          }
          const value = evaluate_mixed_binary_expression(
            current_value,
            new_value,
            op,
          );
          (result as ObjectValue).properties.set(key, value);
          return env.assignVar(variable, expression);
        }
        case "list": {
          const idx = (member.property as NumericLiteral).value;
          if (typeof idx != "number")
            throw throwError(
              new InterpreterError("Invalid list index: " + idx),
            );
          const current_value = expression.value[idx];
          const new_v = await evaluate(node.value, env);
          expression.value[idx] = evaluate_mixed_binary_expression(
            current_value,
            new_v,
            op,
          );
          return env.assignVar(variable, expression);
        }
        default:
          throw throwError(new InterpreterError("Invalid compound assignment"));
      }
    }
    case "Identifier": {
      const varname = (node.assignee as Identifier).symbol;
      const current_value = env.lookupVar(varname);
      const value = await evaluate(node.value, env);
      if (op == "??") {
        if (current_value.type == "null") return env.assignVar(varname, value);
      }
      const new_value = evaluate_mixed_binary_expression(
        current_value,
        value,
        op,
      );
      return env.assignVar(varname, new_value);
    }
    default:
      throw throwError(
        new InterpreterError(
          "Invalid compound assignment expression " +
            JSON.stringify(node.assignee),
        ),
      );
  }
}

export async function evaluate_object_expression(
  obj: ObjectLiteral,
  env: Environment,
): Promise<RuntimeValue> {
  const object = {
    type: "object",
    properties: new Map(),
    native: false,
  } as ObjectValue;
  for (const { key, value } of obj.properties) {
    const runtimeVal =
      value == undefined ? env.lookupVar(key) : await evaluate(value, env);
    object.properties.set(key, runtimeVal);
  }
  return object;
}

export async function evaluate_member_expression(
  member: MemberExpression,
  env: Environment,
): Promise<RuntimeValue> {
  const object = await evaluate(member.object, env);
  switch (object.type) {
    case "object": {
      const obj = object as ObjectValue;
      if (member.computed && obj.native)
        throw throwError(
          new InterpreterError("Invalid native object key access"),
        );
      const key = get_object_props(member).pop()!;
      if (!key)
        throw throwError(
          new InterpreterError(
            "Invalid object key access: " + member.property.kind,
          ),
        );
      if (!obj.properties.has(key)) return MK_NULL();
      const prop = obj.properties.get(key)!;
      if (prop.type == "reactive") {
        prop.value = await evaluate((prop as ReactiveValue).node, env);
      }
      return prop;
    }
    case "list": {
      if (!member.computed)
        throw throwError(
          new InterpreterError("Invalid list access. Expected computed access"),
        );
      const list = object as ListValue;
      let index = ((await evaluate(member.property, env)) as NumberValue).value;
      if (typeof index != "number")
        throw throwError(new InterpreterError("Invalid list index"));
      if (index < 0) index = list.value.length + index;
      if (index < 0 || index >= list.value.length)
        throw throwError(
          new InterpreterError(
            `Index out of range. Index must be between ${-list.value.length} and ${list.value.length - 1}`,
          ),
        );
      return list.value[index];
    }
    case "class-instance": {
      const instance = object as ClassInstanceValue;
      const key = get_object_props(member).pop()!;
      if (!key)
        throw throwError(
          new InterpreterError(
            "Invalid object key access: " + member.property.kind,
          ),
        );
      const obj = instance.value as ObjectValue;
      if (obj.properties.has(key)) {
        const value = obj.properties.get(key)!;
        if (value.type == "reactive") {
          return {
            type: "reactive",
            value: await evaluate(
              (value as ReactiveValue).node,
              instance.environment,
            ),
            node: (value as ReactiveValue).node,
            name: (value as ReactiveValue).name,
          } as ReactiveValue;
        }
        return value;
      }
      if (instance.environment.variables.has(key)) {
        const value = instance.environment.variables.get(key)!;
        if (value.type == "reactive") {
          return {
            type: "reactive",
            value: await evaluate(
              (value as ReactiveValue).node,
              instance.environment,
            ),
            node: (value as ReactiveValue).node,
            name: (value as ReactiveValue).name,
          } as ReactiveValue;
        }
        return value;
      }
      throw throwError(
        new InterpreterError(
          `Member '${key}' does not exist on class '${instance.name}'`,
        ),
      );
    }
    case "custom": {
      const cv = object as CustomValue;
      const key = get_object_props(member).pop()!;
      if (!key)
        throw throwError(
          new InterpreterError(
            "Invalid object key access: " + member.property.kind,
          ),
        );
      const desc = getCustomTypeDescriptor(cv.name);
      if (desc && desc.methods && desc.methods[key]) {
        const method = desc.methods[key];
        return MK_NATIVE_FUNCTION((args, line, column, callEnv) =>
          method(cv, args, line, column, callEnv),
        );
      }
      if (desc && desc.getters && desc.getters[key]) {
        return desc.getters[key](cv, env);
      }
      if (cv.value && (cv.value as RuntimeValue).type === "object") {
        const obj = cv.value as ObjectValue;
        if (!obj.properties.has(key)) return MK_NULL();
        const prop = obj.properties.get(key)!;
        if (prop.type == "reactive") {
          prop.value = await evaluate((prop as ReactiveValue).node, env);
        }
        return prop;
      }
      throw throwError(
        new InterpreterError(
          `Member '${key}' does not exist on custom '${cv.name}'`,
        ),
      );
    }
    default:
      console.error("Invalid member expression on type: " + object.type);
      break;
  }
  return MK_NULL();
}

export async function evaluate_call_expression(
  call: CallExpression,
  env: Environment,
): Promise<RuntimeValue> {
  const args: RuntimeValue[] = [];
  for (const argExpr of call.args) args.push(await evaluate(argExpr, env));
  const fn = await evaluate(call.caller, env);
  // if caller resolved to a PromiseValue, await it
  if ((fn as any)?.type === "promise") {
    const pv = fn as PromiseValue;
    const resolved = await pv.promise;
    return resolved as RuntimeValue;
  }
  if (fn.type == "native-function") {
    const res = (fn as NativeFunctionValue).call(
      args,
      call.line!,
      call.column!,
      env,
    );
    const awaited = await Promise.resolve(res as any);
    if ((awaited as any)?.type === "promise")
      return await (awaited as PromiseValue).promise;
    return awaited as RuntimeValue;
  }
  if (fn.type == "function") {
    const func = fn as FunctionValue;
    const scope = new Environment(func.declarationEnv);
    if (func.expectedArgs != 0 && func.expectedArgs != args.length)
      throw throwError(
        new InterpreterError(
          "Invalid number of arguments. Expected " +
            func.expectedArgs +
            " but received " +
            args.length,
        ),
      );
    for (let i = 0; i < func.parameters.length; i++) {
      const varname = func.parameters[i];
      scope.declareVar(varname, args[i], false);
    }
    let result: RuntimeValue = MK_NULL();
    for (const statement of func.body)
      result = await evaluate(statement, scope);
    return result;
  }
  if (fn.type == "class") {
    const cls = fn as ClassValue;
    const instanceEnv = new Environment();
    instanceEnv.scopeType = "class-instance";
    const instance = new Map<string, RuntimeValue>();
    const privateMembers = new Map<string, RuntimeValue>();
    const parameters: Map<string, RuntimeValue> = new Map();
    cls.parameters.forEach((param, index) => {
      const arg = args[index] ? args[index] : MK_NULL();
      instanceEnv.declareVar(param, arg, false);
      parameters.set(param, arg);
    });
    const classInstance: ClassInstanceValue = {
      type: "class-instance",
      name: cls.name,
      value: MK_OBJECT(instance),
      privateMembers: MK_OBJECT(privateMembers),
      environment: instanceEnv,
      parameters: cls.parameters,
    };
    instanceEnv.declareVar("this", classInstance, true);
    for (const member of cls.blocks.body) {
      if (member.kind == "FunctionDeclaration") {
        const func = member as FunctionDeclaration;
        const fn_value = {
          type: "function",
          name: func.name,
          parameters: func.parameters,
          expectedArgs: func.expectedArgs,
          declarationEnv: env,
          body: func.body,
        } as FunctionValue;
        privateMembers.set(func.name, fn_value);
        instanceEnv.declareVar(func.name, fn_value, true);
      } else if (member.kind == "VariableDeclaration") {
        const var_decl = member as VariableDeclaration;
        const var_value = await evaluate(var_decl, instanceEnv);
        const name = (var_decl.assignee as Identifier).symbol;
        privateMembers.set(name, var_value);
      }
    }
    for (const member of cls.blocks.public) {
      if (member.kind == "FunctionDeclaration") {
        const func = member as FunctionDeclaration;
        const fn_value = {
          type: "function",
          name: func.name,
          parameters: func.parameters,
          expectedArgs: func.expectedArgs,
          declarationEnv: instanceEnv,
          body: func.body,
        } as FunctionValue;
        instance.set(func.name, fn_value);
        instanceEnv.declareVar(func.name, fn_value, true);
      } else if (member.kind == "VariableDeclaration") {
        const var_decl = member as VariableDeclaration;
        const var_value = await evaluate(var_decl, instanceEnv);
        const name = (var_decl.assignee as Identifier).symbol;
        instance.set(name, var_value);
      }
    }
    for (const member of cls.blocks.private) {
      if (member.kind == "FunctionDeclaration") {
        const func = member as FunctionDeclaration;
        const fn_value = {
          type: "function",
          name: func.name,
          parameters: func.parameters,
          expectedArgs: func.expectedArgs,
          declarationEnv: instanceEnv,
          body: func.body,
        } as FunctionValue;
        privateMembers.set(func.name, fn_value);
        instanceEnv.declareVar(func.name, fn_value, true);
      } else if (member.kind == "VariableDeclaration") {
        const var_decl = member as VariableDeclaration;
        const var_value = await evaluate(var_decl, instanceEnv);
        const name = (var_decl.assignee as Identifier).symbol;
        privateMembers.set(name, var_value);
      }
    }
    if (cls.init) {
      const initFunc = cls.init as FunctionValue;
      if (initFunc.parameters.length != 0)
        throw throwError(
          new InterpreterError(
            "Class initializer 'init' cannot have parameters",
          ),
        );
      for (const stmt of initFunc.body) await evaluate(stmt, instanceEnv);
    }
    return classInstance;
  }
  throw throwError(
    new InterpreterError(
      "Cannot call value that is not a function: " + JSON.stringify(fn),
    ),
  );
}

export const evaluate_list_expression = async (
  list: ListLiteral,
  env: Environment,
): Promise<RuntimeValue> =>
  ({
    type: "list",
    value: await Promise.all(
      list.values.map(async (value) => await evaluate(value, env)),
    ),
  }) as ListValue;

export const evaluate_ternary_expression = async (
  node: TernaryExpression,
  env: Environment,
): Promise<RuntimeValue> =>
  (await evaluate(node.condition, env))
    ? await evaluate(node.left, env)
    : await evaluate(node.right, env);

export async function evaluate_choose_expression(
  node: ChooseExpression,
  env: Environment,
): Promise<RuntimeValue> {
  const subject = await evaluate(node.subject, env);
  const tempEnv = new Environment(env);
  if (node.tempVariable)
    tempEnv.declareVar(node.tempVariable.symbol, subject, false);
  let conditionsMet = false;
  const results: RuntimeValue[] = [];
  for (const chooseCase of node.cases) {
    if (chooseCase.conditions) {
      const conditions = [] as RuntimeValue[];
      for (const c of chooseCase.conditions)
        conditions.push(await evaluate(c, tempEnv));
      if (
        conditions.some(
          (cond: RuntimeValue, index: number) =>
            equals(cond, subject) ||
            ((chooseCase.conditions![index].kind == "BinaryExpression" ||
              chooseCase.conditions![index].kind == "LogicalExpression") &&
              (cond as BoolValue).value),
        )
      ) {
        conditionsMet = true;
        if (node.chooseAll)
          results.push(await evaluate(chooseCase.body as Expression, tempEnv));
        else return await evaluate(chooseCase.body as Expression, tempEnv);
      }
    }
  }
  if (node.defaultCase && !conditionsMet) {
    if (node.chooseAll)
      results.push(
        await evaluate(node.defaultCase.body as Expression, tempEnv),
      );
    else return await evaluate(node.defaultCase.body as Expression, tempEnv);
  }
  return MK_LIST(results);
}
