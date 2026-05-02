import { built_in_libraries } from "@core/runtime/built-in/libraries";
import { built_in_functions } from "@core/runtime/built-in/functions";
import { built_in_constants } from "@core/runtime/built-in/constants";
import { evaluate, throwError } from "@core/runtime/interpreter";
import {
  MK_NATIVE_FUNCTION,
  RuntimeValue,
  type ReactiveValue,
  type ClassInstanceValue,
  type ObjectValue,
} from "@core/runtime/values";
import { InterpreterError } from "@core/utils/errors_handler";

// Creates the global environment of the program
export function createGlobalEnvironment() {
  // Declares the environment
  const env = new Environment();

  // Declare native functions, constants and libraries
  // built_in_constants.map((constant) => env.declareVar(constant.name, constant.value, true));
  // built_in_functions.map((func) => env.declareVar(func.name, MK_NATIVE_FUNCTION(func), true));
  // built_in_libraries.map((lib) => env.declareVar(lib.name, lib.object, true));

  return env;
}

// Environment class
export default class Environment {
  // Environment parent, NULL if it is the global env
  public parent?: Environment;
  // Max number of allowed iterations
  public MAX_ITERATIONS: number;
  public scopeType: "global" | "loop" | "class-instance" = "global";

  // Map of the environment's declared variables
  public variables: Map<string, RuntimeValue>;
  // Set of the environment's declared constants names
  private constants: Set<string>;

  // Set of the environment's exported variables and functions names
  public exported: Set<string>;
  // Set of the environment's imported modules names
  public imported: Set<string>;

  constructor(parentENV?: Environment) {
    // Sets the env parent to the given env
    this.parent = parentENV;

    // Initializes the variables map
    this.variables = new Map();
    // Initializes the constants set
    this.constants = new Set();

    // Initializes the exported set
    this.exported = new Set();

    // Initializes the exported set
    this.imported = new Set();

    // Sets the max number of allowed iterations
    this.MAX_ITERATIONS = 2 ** 20 - 1;

    // Declare native functions, constants and libraries
    built_in_constants.map((constant) => {
      this.variables.set(constant.name, constant.value);
      this.constants.add(constant.name);
    });

    built_in_functions.map((func) => {
      this.variables.set(func.name, MK_NATIVE_FUNCTION(func));
      this.constants.add(func.name);
    });

    built_in_libraries.map((lib) => {
      this.variables.set(lib.name, lib.object);
      this.constants.add(lib.name);
    });
  }

  // Declares a new variable/constant, given it's name and it's value
  public declareVar(
    varname: string,
    value: RuntimeValue,
    constant: boolean,
  ): RuntimeValue {
    // Throws an error if the given varname already exits in the current environment
    if (this.variables.has(varname))
      throwError(
        new InterpreterError(
          `Cannot declare variable '${varname}' as it already is defined in this scope`,
        ),
      );

    // Sets the new variable to the variables map
    this.variables.set(varname, value);

    // If the constant value is true, sets the new variable to the constants map
    if (constant) this.constants.add(varname);

    return value;
  }

  // Assigns a new value to a given variable
  public assignVar(
    varname: string,
    value: RuntimeValue,
    force: boolean = false,
  ): RuntimeValue {
    // Risolve l'ambiente in cui si trova la variabile
    const env = this.resolve(varname);

    if (!force) {
      if (env.constants.has(varname))
        throw throwError(
          new InterpreterError(
            `Cannot reassign to variable '${varname}' as it was declared as a constant`,
          ),
        );

      if (env.variables.get(varname)?.type === "reactive")
        throw throwError(
          new InterpreterError(
            `Cannot reassign to variable '${varname}' as it was declared as reactive`,
          ),
        );

      if (varname === "this")
        throw throwError(
          new InterpreterError("Cannot reassign 'this' inside a class."),
        );
    }

    env.variables.set(varname, value);

    if (env.scopeType === "class-instance") {
      const classInstance = env.variables.get("this");
      if (classInstance && classInstance.type === "class-instance") {
        const instance = classInstance as ClassInstanceValue;
        if (instance.value.properties.has(varname)) {
          instance.value.properties.set(varname, value);
        } else if (instance.privateMembers.properties.has(varname)) {
          instance.privateMembers.properties.set(varname, value);
        }
      } else if (classInstance && classInstance.type === "object") {
        // Backward compatibility just in case
        const instanceMap = (classInstance as ObjectValue).properties;
        if (instanceMap.has(varname)) instanceMap.set(varname, value);
      }
    }

    return value;
  }

  // Returns the value of a given variable
  public lookupVar = (varname: string): RuntimeValue => {
    const variable = this.resolve(varname).variables.get(
      varname,
    ) as RuntimeValue;
    return variable;
  };

  // Returns the environment where the given variable is found
  public resolve(varname: string): Environment {
    // If the variable is in the current environment, returns the env
    if (this.variables.has(varname)) return this;

    // Throws an error if this environment doesn't have a parent
    if (this.parent == undefined)
      throw throwError(
        new InterpreterError(
          `Cannot resolve '${varname}' as it does not exists`,
        ),
      );

    // Searches the given variable in the parent environment and returns it
    return this.parent.resolve(varname);
  }
}
