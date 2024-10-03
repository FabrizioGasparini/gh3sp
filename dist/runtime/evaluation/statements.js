"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluate_program = evaluate_program;
exports.evaluate_variable_declaration = evaluate_variable_declaration;
exports.evaluate_function_declaration = evaluate_function_declaration;
exports.evaluate_if_statement = evaluate_if_statement;
exports.evaluate_for_statement = evaluate_for_statement;
exports.evaluate_while_statement = evaluate_while_statement;
const interpreter_1 = require("../interpreter");
const values_1 = require("../values");
function evaluate_program(program, env) {
    let lastEvaluated = (0, values_1.MK_NULL)();
    for (const statement of program.body) {
        lastEvaluated = (0, interpreter_1.evaluate)(statement, env);
    }
    return lastEvaluated;
}
function evaluate_variable_declaration(declaration, env) {
    const value = declaration.value ? (0, interpreter_1.evaluate)(declaration.value, env) : (0, values_1.MK_NULL)();
    return env.declareVar(declaration.identifier, value, declaration.constant);
}
function evaluate_function_declaration(declaration, env) {
    const fn = {
        type: "function",
        name: declaration.name,
        parameters: declaration.parameters,
        declarationEnv: env,
        body: declaration.body,
    };
    return env.declareVar(declaration.name, fn, true);
}
function evaluate_if_statement(node, env) {
    const condition = (0, interpreter_1.evaluate)(node.condition, env);
    if (condition.value == true) {
        let result = (0, values_1.MK_NULL)();
        for (const statement of node.then)
            result = (0, interpreter_1.evaluate)(statement, env);
        return result;
    }
    else {
        if (node.else) {
            let result = (0, values_1.MK_NULL)();
            for (const statement of node.else)
                result = (0, interpreter_1.evaluate)(statement, env);
            return result;
        }
    }
    return (0, values_1.MK_NULL)();
}
function evaluate_for_statement(node, env) {
    let assignment;
    if (node.declared)
        assignment = node.assignment;
    else
        assignment = node.assignment;
    (0, interpreter_1.evaluate)(assignment, env);
    let condition = (0, interpreter_1.evaluate)(node.condition, env);
    let result = (0, values_1.MK_NULL)();
    while (condition.value) {
        for (const statement of node.body)
            result = (0, interpreter_1.evaluate)(statement, env);
        (0, interpreter_1.evaluate)(node.compoundAssignment, env);
        condition = (0, interpreter_1.evaluate)(node.condition, env);
    }
    return result;
}
function evaluate_while_statement(node, env) {
    const maxIterations = 10000;
    let iterations = 0;
    let condition = (0, interpreter_1.evaluate)(node.condition, env);
    let result = (0, values_1.MK_NULL)();
    while (condition.value) {
        if (iterations++ >= maxIterations)
            throw "Potential infinite loop detected. Loop exceeded the maximum number of allowed iterations (10000).";
        for (const statement of node.body)
            result = (0, interpreter_1.evaluate)(statement, env);
        condition = (0, interpreter_1.evaluate)(node.condition, env);
    }
    return result;
}
