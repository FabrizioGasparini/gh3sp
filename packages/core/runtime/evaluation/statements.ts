import {
  AssignmentExpression,
  ChooseStatement,
  ClassDeclaration,
  CompoundAssignmentExpression,
  Expression,
  ForEachStatement,
  ForStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  NumericLiteral,
  Program,
  Statement,
  VariableDeclaration,
  WhileStatement,
  type ControlFlowStatement,
  type ExportDeclaration,
  type ImportStatement,
} from "@core/frontend/ast";
import { InterpreterError } from "@core/utils/errors_handler";
import Environment from "@core/runtime/environments";
import { evaluate, throwError } from "@core/runtime/interpreter";
import { compileLibrary } from "@core/libraries/index";
import {
  RuntimeValue,
  MK_NULL,
  FunctionValue,
  ListValue,
  MK_NUMBER,
  type ReactiveValue,
  type BreakSignal,
  type ContinueSignal,
  NativeFunctionValue,
  ObjectValue,
  Signal,
  BoolValue,
  ClassValue,
  CustomValue,
} from "@core/runtime/values";
import { getCustomTypeDescriptor } from "@core/runtime/custom_types";

export const evaluate_program = async (
  program: Program,
  env: Environment,
): Promise<RuntimeValue> => {
  let result: RuntimeValue = MK_NULL();
  for (const stmt of program.body) result = await evaluate(stmt, env);
  return result;
};

export function equals(a: RuntimeValue, b: RuntimeValue): boolean {
  // If both values are null, they are equal
  if (a.type == "null" && b.type == "null") return true;
  // If both values are numbers, they are equal if their values are equal
  if (a.type == "number" && b.type == "number") return a.value == b.value;
  // If both values are strings, they are equal if their values are equal
  if (a.type == "string" && b.type == "string") return a.value == b.value;
  // If both values are booleans, they are equal if their values are equal
  if (a.type == "boolean" && b.type == "boolean") return a.value == b.value;
  // If both values are lists, they are equal if their names and values are equal
  if (a.type == "list" && b.type == "list")
    return (
      a.value.length == b.value.length &&
      a.value.every((item: RuntimeValue, index: number) =>
        equals(item, b.value[index]),
      )
    );
  // If both values are objects, they are equal if their keys and values are equal
  if (a.type == "object" && b.type == "object") {
    const objA = a as ObjectValue;
    const objB = b as ObjectValue;

    if (objA.properties.size !== objB.properties.size) return false;
    for (const [key, value] of objA.properties) {
      if (
        !objB.properties.has(key) ||
        !equals(value, objB.properties.get(key)!)
      )
        return false;
    }

    return true;
  }

  // If both values are custom, try descriptor's equals or fallback to underlying value comparison
  if (a.type == "custom" && b.type == "custom") {
    const ca = a as CustomValue;
    const cb = b as CustomValue;
    if (ca.name !== cb.name) return false;
    const desc = getCustomTypeDescriptor(ca.name);
    if (desc && desc.equals) return desc.equals(ca, cb);
    if (ca.value && cb.value) return equals(ca.value, cb.value);
    return false;
  }

  // If both values are reactive, they are equal if their names and nodes are equal
  if (a.type == "reactive" && b.type == "reactive") {
    const reactiveA = a as ReactiveValue;
    const reactiveB = b as ReactiveValue;

    return (
      reactiveA.name == reactiveB.name &&
      reactiveA.node.kind == reactiveB.node.kind &&
      equals(reactiveA.value, reactiveB.value)
    );
  }
  // If both values are functions, they are equal if their names and bodies are equal
  if (a.type == "function" && b.type == "function") {
    const fnA = a as FunctionValue;
    const fnB = b as FunctionValue;

    return (
      fnA.name == fnB.name &&
      fnA.parameters.length == fnB.parameters.length &&
      fnA.body.length == fnB.body.length &&
      fnA.body.every((stmt, index) => stmt.kind == fnB.body[index].kind)
    );
  }
  // If both values are native functions, they are equal if their names are equal
  if (a.type == "native-function" && b.type == "native-function") {
    return (a as NativeFunctionValue).name == (b as NativeFunctionValue).name;
  }
  // If the types are different, they are not equal
  return false;
}

// Adds the given variable to the given environment and returns it
export async function evaluate_variable_declaration(
  declaration: VariableDeclaration,
  env: Environment,
): Promise<RuntimeValue> {
  const value = declaration.value
    ? declaration.reactive
      ? ({
          type: "reactive",
          node: declaration.value!,
          name: (declaration.assignee as Identifier).symbol,
        } as ReactiveValue)
      : await evaluate(declaration.value, env)
    : MK_NULL();

  // If the value is a list, the variable takes the name of the list's name
  if (declaration.value?.kind == "ListLiteral")
    (value as ListValue).name = (declaration.assignee as Identifier).symbol;

  // Adds the declared variable to the specified environment and returns it
  return env.declareVar(
    (declaration.assignee as Identifier).symbol,
    value,
    declaration.constant,
  );
}

// Adds the given function to the given environment and returns it, or just returns it if it's an anonymous function
export async function evaluate_function_declaration(
  declaration: FunctionDeclaration,
  env: Environment,
): Promise<RuntimeValue> {
  const fn = {
    type: "function",
    name: declaration.name,
    parameters: declaration.parameters,
    expectedArgs: declaration.expectedArgs,
    declarationEnv: env,
    body: declaration.body,
  } as FunctionValue;

  // If the functions has a name (standard function), it adds it to the environment and returns it, otherwise it just returns it (anonymous function)
  return declaration.name ? env.declareVar(declaration.name, fn, true) : fn;
}

export async function evaluate_class_declaration(
  declaration: ClassDeclaration,
  env: Environment,
): Promise<RuntimeValue> {
  const cls = {
    type: "class",
    name: declaration.name,
    parameters: declaration.parameters,
    blocks: declaration.blocks,
    init: declaration.init
      ? ((await evaluate(
          declaration.init as FunctionDeclaration,
          env,
        )) as FunctionValue)
      : null,
  } as ClassValue;

  // If the functions has a name (standard function), it adds it to the environment and returns it, otherwise it just returns it (anonymous function)
  return declaration.name ? env.declareVar(declaration.name, cls, true) : cls;
}

// Evaluates the if statement's condition, if it's true it evaluates the 'then' node and returns it, if it's false it evaluates the 'else' node and returns it. If both nodes are empty, it just returns NULL
export const evaluate_if_statement = async (
  node: IfStatement,
  env: Environment,
): Promise<RuntimeValue> => {
  const cond = await evaluate(node.condition, env);
  if (cond.value == true) {
    for (const stmt of node.then) return await evaluate(stmt, env);
    return MK_NULL();
  }
  if (node.else) {
    for (const stmt of node.else) return await evaluate(stmt, env);
  }
  return MK_NULL();
};

// Evaluates the for statement
export async function evaluate_for_statement(
  node: ForStatement,
  env: Environment,
): Promise<RuntimeValue> {
  if (node.body.length == 0) return MK_NULL();

  const assignment = node.declared
    ? (node.assignment as VariableDeclaration)
    : (node.assignment as AssignmentExpression);

  const loop_env = new Environment(env);
  await evaluate(assignment, loop_env);

  const variable = (assignment.assignee as Identifier).symbol;
  const variable_env =
    assignment.kind == "VariableDeclaration" ? loop_env : env;

  let iterations = 0;
  let condition = await evaluate(node.condition, loop_env);

  while (condition.value) {
    loop_env.scopeType = "loop";
    if (iterations++ >= loop_env.MAX_ITERATIONS)
      throwError(
        new InterpreterError(
          `Potential infinite loop detected. Loop exceeded the maximum number of allowed iterations (${loop_env.MAX_ITERATIONS})`,
        ),
      );

    try {
      for (const stmt of node.body) await evaluate(stmt, loop_env);
    } catch (signal) {
      const sig = signal as Signal;
      switch (sig.type) {
        case "break":
          loop_env.scopeType = "global";
          break;

        case "continue":
          break;

        default:
          throw signal;
      }
    }

    if (loop_env.scopeType !== "loop") return MK_NULL();

    switch (node.increment.kind) {
      case "CompoundAssignmentExpression":
        await evaluate(
          node.increment as CompoundAssignmentExpression,
          loop_env,
        );
        break;

      case "NumericLiteral":
        variable_env.assignVar(
          variable,
          MK_NUMBER(
            variable_env.lookupVar(variable).value +
              (await evaluate(node.increment as NumericLiteral, loop_env))
                .value,
          ),
        );
        break;

      case "Identifier":
        variable_env.assignVar(
          variable,
          MK_NUMBER(
            variable_env.lookupVar(variable).value +
              variable_env.lookupVar((node.increment as Identifier).symbol)
                .value,
          ),
        );
        break;

      default:
        throwError(
          new InterpreterError(
            `Invalid increment kind (${node.increment.kind})`,
          ),
        );
    }

    condition = await evaluate(node.condition, loop_env);
  }

  return MK_NULL();
}

// Evaluates the while statement
export async function evaluate_while_statement(
  node: WhileStatement,
  env: Environment,
): Promise<RuntimeValue> {
  if (node.body.length == 0) return MK_NULL();
  const loop_env: Environment = new Environment(env);
  let iterations = 0;
  let condition = await evaluate(node.condition, env);

  while (condition.value) {
    loop_env.scopeType = "loop";
    if (iterations++ >= loop_env.MAX_ITERATIONS)
      throw throwError(
        new InterpreterError(
          `Potential infinite loop detected. Loop exceeded the maximum number of allowed iterations (${loop_env.MAX_ITERATIONS})`,
        ),
      );

    try {
      for (const stmt of node.body) await evaluate(stmt, loop_env);
    } catch (signal) {
      const sig = signal as Signal;
      switch (sig.type) {
        case "break":
          loop_env.scopeType = "global";
          break;

        case "continue":
          break;

        default:
          throw signal;
      }
    }

    if (loop_env.scopeType !== "loop") return MK_NULL();

    condition = await evaluate(node.condition, loop_env);
  }

  return MK_NULL();
}

// Evaluates foreach statements
export async function evaluate_foreach_statement(
  node: ForEachStatement,
  env: Environment,
): Promise<RuntimeValue> {
  const list =
    node.list.kind == "Identifier"
      ? (env.lookupVar(node.list.symbol) as ListValue)
      : ((await evaluate(node.list, env)) as ListValue);

  if (list.value.length == 0) return MK_NULL();
  const loopElement: Identifier =
    node.element.kind == "Identifier"
      ? node.element
      : ((node.element as VariableDeclaration).assignee as Identifier);

  const loopIndex: Identifier | null = node.index
    ? node.index.kind == "Identifier"
      ? node.index
      : ((node.index as VariableDeclaration).assignee as Identifier)
    : null;

  for (let i = 0; i < list.value.length; i++) {
    const loop_env = new Environment(env);
    if (node.element.kind == "VariableDeclaration")
      loop_env.declareVar(
        ((node.element as VariableDeclaration).assignee as Identifier).symbol,
        MK_NULL(),
        false,
      );
    if (node.index && node.index.kind == "VariableDeclaration")
      loop_env.declareVar(
        ((node.index as VariableDeclaration).assignee as Identifier).symbol,
        MK_NUMBER(0),
        false,
      );

    const element = list.value[i];
    loop_env.scopeType = "loop";
    loop_env.assignVar(loopElement.symbol, element);
    if (loopIndex)
      loop_env.assignVar((loopIndex as Identifier).symbol, MK_NUMBER(i));
    try {
      for (const stmt of node.body) await evaluate(stmt, loop_env);
    } catch (signal) {
      const sig = signal as Signal;
      switch (sig.type) {
        case "break":
          loop_env.scopeType = "global";
          break;
        case "continue":
          break;
        default:
          throw signal;
      }
    }
    if (loop_env.scopeType !== "loop") return MK_NULL();
  }
  return MK_NULL();
}

// Evaluates the import statement
export async function evaluate_import_statement(
  node: ImportStatement,
  env: Environment,
): Promise<RuntimeValue> {
  if (env.parent)
    throw throwError(
      new InterpreterError("Cannot import libraries outside of the main scope"),
    );
  await compileLibrary(node.path, env);
  return MK_NULL();
}

// Evaluates break, continue and pass statements
export async function evaluate_control_flow_statement(
  node: ControlFlowStatement,
  env: Environment,
): Promise<RuntimeValue> {
  if (env.scopeType !== "loop")
    throw throwError(new SyntaxError("Invalid 'break' outside loop"));
  switch (node.value) {
    case "break":
      throw { type: "break" } as BreakSignal;
    case "continue":
      throw { type: "continue" } as ContinueSignal;
    case "pass":
      return MK_NULL();
  }
}

export async function evaluate_choose_statement(
  node: ChooseStatement,
  env: Environment,
): Promise<RuntimeValue> {
  const subject = await evaluate(node.subject, env);
  const tempEnv = new Environment(env);
  if (node.tempVariable)
    tempEnv.declareVar(node.tempVariable.symbol, subject, false);
  let conditionsMet = false;
  for (const chooseCase of node.cases) {
    if (chooseCase.conditions) {
      const conditions: RuntimeValue[] = [];
      for (const cond of chooseCase.conditions)
        conditions.push(await evaluate(cond, tempEnv));
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
        for (const stmt of chooseCase.body as Statement[])
          await evaluate(stmt, tempEnv);
        if (!node.chooseAll) return MK_NULL();
      }
    }
  }
  if (node.defaultCase && !conditionsMet)
    for (const stmt of node.defaultCase.body as Statement[])
      await evaluate(stmt, tempEnv);
  return MK_NULL();
}

// Evaluates the exported variables and functions
export async function evaluate_export_declaration(
  node: ExportDeclaration,
  env: Environment,
): Promise<RuntimeValue> {
  let name: string = "";
  switch (node.declaration.kind) {
    case "VariableDeclaration":
      name = ((node.declaration as VariableDeclaration).assignee as Identifier)
        .symbol;
      break;
    case "FunctionDeclaration":
      name = (node.declaration as FunctionDeclaration).name;
      break;
    case "ClassDeclaration":
      name = (node.declaration as ClassDeclaration).name;
      break;
  }

  await evaluate(node.declaration, env);
  env.exported.add(name);

  return MK_NULL();
}
