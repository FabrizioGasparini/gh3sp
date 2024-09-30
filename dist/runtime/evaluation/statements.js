"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluate_function_declaration = exports.evaluate_variable_declaration = exports.evaluate_program = void 0;
const interpreter_1 = require("../interpreter");
const values_1 = require("../values");
function evaluate_program(program, env) {
    let lastEvaluated = (0, values_1.MK_NULL)();
    for (const statement of program.body) {
        lastEvaluated = (0, interpreter_1.evaluate)(statement, env);
    }
    return lastEvaluated;
}
exports.evaluate_program = evaluate_program;
function evaluate_variable_declaration(declaration, env) {
    const value = declaration.value
        ? (0, interpreter_1.evaluate)(declaration.value, env)
        : (0, values_1.MK_NULL)();
    return env.declareVar(declaration.identifier, value, declaration.constant);
}
exports.evaluate_variable_declaration = evaluate_variable_declaration;
function evaluate_function_declaration(declaration, env) {
    const fn = {
        type: "function",
        name: declaration.name,
        parameters: declaration.parameters,
        declarationEnv: env,
        body: declaration.body
    };
    return env.declareVar(declaration.name, fn, true);
}
exports.evaluate_function_declaration = evaluate_function_declaration;
