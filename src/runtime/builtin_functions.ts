import { FunctionValue, ObjectValue } from "./values.ts";
import { MK_NULL, MK_NUMBER, RuntimeValue } from "./values.ts";

export function timeFunction() {
    return MK_NUMBER(Date.now());
}

export function print(args: RuntimeValue[]) {
    const params = []
    for (const arg of args) {
        const test = JSON.parse(JSON.stringify(parse(arg)))
        params.push(test)
    };

    console.log(...params)
    return MK_NULL()
}

function parse(node: RuntimeValue) {
    switch (node.type)
    {
        case "number":
        case "string":
        case "boolean":
        case "null":
            return node.value
        case "object":
            return parse_object(node as ObjectValue)
        case "function":
            return parse_function(node as FunctionValue)
        case "native-function":
            return "Node Type not implemented yet: " + node.type
        
        default:
            return node
    }
}


function parse_object(obj: ObjectValue) {
    const object: {[key: string]: RuntimeValue} = {}

    for (const [ key, value ] of obj.properties.entries()) {    
        object[key] = parse(value as RuntimeValue);
    }

    return object
}

function parse_function(fn: FunctionValue) {
    let func = fn.name + "(";
    
    for (let i = 0; i < fn.parameters.length; i++) {
        const param = fn.parameters[i];
        if (i < fn.parameters.length - 1)
            func += param + ", ";
        else
            func += param;
    }
    
    func += ")"
    return func
}