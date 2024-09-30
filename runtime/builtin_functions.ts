import { ObjectValue } from "./values.ts";
import { MK_NULL, MK_NUMBER, RuntimeValue } from "./values.ts";

export function timeFunction() {
    return MK_NUMBER(Date.now());
}

export function print(args: RuntimeValue[]) {
    const params = []
    for (const arg of args) {
        switch (arg.type) {
            case "number":
            case "boolean":
            case "null":
                params.push(arg.value)
                break
                
            case "function":
                break
            case "native-function":
                break
            case "object":
                print_obj(arg as ObjectValue)
                break
        }
    };

    console.log(...params)
    return MK_NULL()
}

function print_obj(obj: ObjectValue) {
    console.log(obj)
}