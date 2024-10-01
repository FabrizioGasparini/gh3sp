"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeFunction = timeFunction;
exports.str = str;
exports.int = int;
exports.type = type;
exports.print = print;
const values_1 = require("./values");
const values_2 = require("./values");
function timeFunction() {
    return (0, values_2.MK_NUMBER)(Date.now());
}
function str(args) {
    try {
        return (0, values_1.MK_STRING)((args[0].value).toString());
    }
    catch (_a) {
        throw `Invalid argument passed inside 'str' function`;
    }
}
function int(args) {
    try {
        return (0, values_2.MK_NUMBER)(parseInt(args[0].value));
    }
    catch (_a) {
        throw `Invalid argument passed inside 'int' function`;
    }
}
function type(args) {
    try {
        return (0, values_1.MK_STRING)(args[0].type);
    }
    catch (_a) {
        throw `Invalid argument passed inside 'type' function`;
    }
}
function print(args) {
    const params = [];
    for (const arg of args) {
        const test = JSON.parse(JSON.stringify(parse(arg)));
        params.push(test);
    }
    ;
    console.log(...params);
    return (0, values_2.MK_NULL)();
}
function parse(node) {
    switch (node.type) {
        case "number":
        case "string":
        case "boolean":
        case "null":
            return node.value;
        case "object":
            return parse_object(node);
        case "function":
            return parse_function(node);
        case "native-function":
            return "Node Type not implemented yet: " + node.type;
        default:
            return node;
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
