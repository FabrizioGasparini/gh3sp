import { print, timeFunction } from "./builtin_functions.ts";
import { MK_BOOL, MK_NATIVE_FUNCTION, MK_NULL, RuntimeValue } from "./values.ts";

export function createGlobalEnvironment() {
    const env = new Environment();
    env.declareVar("true", MK_BOOL(true), true);
    env.declareVar("false", MK_BOOL(false), true);
    env.declareVar("null", MK_NULL(), true);

    // Declare native methods
    env.declareVar("print", MK_NATIVE_FUNCTION(print), true)
    env.declareVar("time", MK_NATIVE_FUNCTION(timeFunction), true)

    return env;
}

export default class Environment {
    private parent?: Environment;
    private variables: Map<string, RuntimeValue>;
    private constants: Set<string>;

    constructor(parentENV?: Environment) {
        this.parent = parentENV;
        this.variables = new Map()
        this.constants = new Set()

    }

    public declareVar(varname: string, value: RuntimeValue, constant: boolean): RuntimeValue {
        if (this.variables.has(varname)) {
            throw `Cannot declare variable '${varname}' as it already is defined.`;
        }
        
        this.variables.set(varname, value);
        
        if (constant)
            this.constants.add(varname)
        
        return value;
    }
    
    public assignVar(varname: string, value: RuntimeValue): RuntimeValue {
        const env = this.resolve(varname);
        
        if (env.constants.has(varname))
            throw `Cannot reassign to variable ${varname} as it was declared constant.`    
        
        env.variables.set(varname, value);
        return value;
    }
    
    public lookupVar(varname: string): RuntimeValue {
        const env = this.resolve(varname);

        return env.variables.get(varname) as RuntimeValue;
    }

    public resolve(varname: string): Environment {
        if (this.variables.has(varname))
            return this;

        if (this.parent == undefined)
            throw `Cannot resolve '${varname}' as it does not exists.`

        return this.parent.resolve(varname)
    }
}