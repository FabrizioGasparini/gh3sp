"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = exports.timeFunction = void 0;
const values_1 = require("./values");
function timeFunction() {
    return (0, values_1.MK_NUMBER)(Date.now());
}
exports.timeFunction = timeFunction;
function print(args) {
    const params = [];
    for (const arg of args) {
        const test = JSON.parse(JSON.stringify(parse(arg)));
        params.push(test);
    }
    ;
    console.log(...params);
    return (0, values_1.MK_NULL)();
}
exports.print = print;
function parse(node) {
    switch (node.type) {
        case "number":
        case "boolean":
        case "null":
            return node.value;
        case "object":
            return parse_object(node);
        case "function":
            return parse_function(node);
        case "native-function":
            return "Node Type not implemented yet: " + node.type;
    }
}
function parse_object(obj) {
    const object = {};
    for (const [key, value] of obj.properties.entries()) {
        object[key] = parse(value);
    }
    return object;
}
function parse_function(fn) {
    let func = fn.name + "(";
    for (let i = 0; i < fn.parameters.length; i++) {
        const param = fn.parameters[i];
        if (i < fn.parameters.length - 1)
            func += param + ", ";
        else
            func += param;
    }
    func += ")";
    return func;
}
