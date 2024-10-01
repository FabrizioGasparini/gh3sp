"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGlobalEnvironment = createGlobalEnvironment;
const builtin_functions_1 = require("./builtin_functions");
const values_1 = require("./values");
function createGlobalEnvironment() {
    const env = new Environment();
    env.declareVar("true", (0, values_1.MK_BOOL)(true), true);
    env.declareVar("false", (0, values_1.MK_BOOL)(false), true);
    env.declareVar("null", (0, values_1.MK_NULL)(), true);
    // Declare native methods
    env.declareVar("print", (0, values_1.MK_NATIVE_FUNCTION)(builtin_functions_1.print), true);
    env.declareVar("type", (0, values_1.MK_NATIVE_FUNCTION)(builtin_functions_1.type), true);
    env.declareVar("time", (0, values_1.MK_NATIVE_FUNCTION)(builtin_functions_1.timeFunction), true);
    env.declareVar("str", (0, values_1.MK_NATIVE_FUNCTION)(builtin_functions_1.str), true);
    env.declareVar("int", (0, values_1.MK_NATIVE_FUNCTION)(builtin_functions_1.int), true);
    return env;
}
class Environment {
    constructor(parentENV) {
        this.parent = parentENV;
        this.variables = new Map();
        this.constants = new Set();
    }
    declareVar(varname, value, constant) {
        if (this.variables.has(varname)) {
            throw `Cannot declare variable '${varname}' as it already is defined.`;
        }
        this.variables.set(varname, value);
        if (constant)
            this.constants.add(varname);
        return value;
    }
    assignVar(varname, value) {
        const env = this.resolve(varname);
        if (env.constants.has(varname))
            throw `Cannot reassign to variable ${varname} as it was declared constant.`;
        env.variables.set(varname, value);
        return value;
    }
    lookupVar(varname) {
        const env = this.resolve(varname);
        return env.variables.get(varname);
    }
    resolve(varname) {
        if (this.variables.has(varname))
            return this;
        if (this.parent == undefined)
            throw `Cannot resolve '${varname}' as it does not exists.`;
        return this.parent.resolve(varname);
    }
}
exports.default = Environment;
