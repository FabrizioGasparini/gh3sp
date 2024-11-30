import { built_in_libraries } from "./built-in/libraries.ts";
import { InterpreterError } from "../utils/errors_handler.ts";
import { built_in_functions } from "./built-in/functions.ts";
import { evaluate, throwError } from "./interpreter.ts";
import { MK_NATIVE_FUNCTION, RuntimeValue, type ReactiveValue } from "./values.ts";
import { built_in_constants } from "./built-in/constants.ts";

// Creates the global environment of the program
export function createGlobalEnvironment() {
    // Declares the environment
    const env = new Environment();

    // Declare native functions, constants and libraries
    built_in_constants.map((constant) => env.declareVar(constant.name, constant.value, true));
    built_in_functions.map((func) => env.declareVar(func.name, MK_NATIVE_FUNCTION(func), true));
    built_in_libraries.map((lib) => env.declareVar(lib.name, lib.object, true));

    return env;
}

// Environment class
export default class Environment {
    // Environment parent, NULL if it is the global env
    public parent?: Environment;
    // Max number of allowed iterations
    public MAX_ITERATIONS: number;

    // Map of the environment's declared variables
    private variables: Map<string, RuntimeValue>;
    // Map of the environment's declared constants
    private constants: Set<string>;

    constructor(parentENV?: Environment) {
        // Sets the env parent to the given env
        this.parent = parentENV;
        // Initializes the variables map
        this.variables = new Map();
        // Initializes the constants map
        this.constants = new Set();

        // Sets the max number of allowed iterations
        this.MAX_ITERATIONS = 222222;
    }

    // Declares a new variable/constant, given it's name and it's value
    public declareVar(varname: string, value: RuntimeValue, constant: boolean): RuntimeValue {
        // Throws an error if the given varname already exits in the environment
        if (this.variables.has(varname)) throwError(new InterpreterError(`Cannot declare variable '${varname}' as it already is defined.`));

        // Sets the new variable to the variables map
        this.variables.set(varname, value);

        // If the constant value is true, sets the new variable to the constants map
        if (constant) this.constants.add(varname);

        return value;
    }

    // Assigns a new variable to a given variable
    public assignVar(varname: string, value: RuntimeValue): RuntimeValue {
        // Gets the variable which the variable is is
        const env = this.resolve(varname);

        // Throws an error if the given varname is inside the constants map
        if (env.constants.has(varname)) throw throwError(new InterpreterError(`Cannot reassign to variable ${varname} as it was declared constant.`));

        // Sets the new given value to the given variable
        env.variables.set(varname, value);
        return value;
    }

    // Returns the value of a given variable
    public lookupVar = (varname: string): RuntimeValue => {
        const variable = this.resolve(varname).variables.get(varname) as RuntimeValue;
        if (variable.type == "reactive")
            return evaluate((variable as ReactiveValue).value, this.resolve(varname))    
        
        return variable;
    };
    // Returns the environment where the given variable is found
    public resolve(varname: string): Environment {
        // If the variable is in the current environment, returns the env
        if (this.variables.has(varname)) return this;

        // Throws an error if this environment doesn't have a parent
        if (this.parent == undefined) throw throwError(new InterpreterError(`Cannot resolve '${varname}' as it does not exists.`));

        // Searches the given variable in the parent environment and returns it
        return this.parent.resolve(varname);
    }
}
