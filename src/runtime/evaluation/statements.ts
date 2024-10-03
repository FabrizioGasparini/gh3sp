import { AssignmentExpression, ForStatement, FunctionDeclaration, IfStatement, Program, VariableDeclaration, WhileStatement } from "../../frontend/ast";
import Environment from "../environments";
import { evaluate } from "../interpreter";
import { RuntimeValue, MK_NULL, FunctionValue } from "../values";

export function evaluate_program(program: Program, env: Environment): RuntimeValue {
    let lastEvaluated: RuntimeValue = MK_NULL();

    for (const statement of program.body) {
        lastEvaluated = evaluate(statement, env);
    }

    return lastEvaluated;
}

export function evaluate_variable_declaration(declaration: VariableDeclaration, env: Environment): RuntimeValue {
    const value = declaration.value ? evaluate(declaration.value, env) : MK_NULL();

    return env.declareVar(declaration.identifier, value, declaration.constant);
}

export function evaluate_function_declaration(declaration: FunctionDeclaration, env: Environment): RuntimeValue {
    const fn = {
        type: "function",
        name: declaration.name,
        parameters: declaration.parameters,
        declarationEnv: env,
        body: declaration.body,
    } as FunctionValue;

    return env.declareVar(declaration.name, fn, true);
}

export function evaluate_if_statement(node: IfStatement, env: Environment): RuntimeValue {
    const condition = evaluate(node.condition, env);

    if (condition.value == true) {
        let result: RuntimeValue = MK_NULL();
        for (const statement of node.then) result = evaluate(statement, env);

        return result;
    } else {
        if (node.else) {
            let result: RuntimeValue = MK_NULL();
            for (const statement of node.else) result = evaluate(statement, env);

            return result;
        }
    }

    return MK_NULL();
}

export function evaluate_for_statement(node: ForStatement, env: Environment): RuntimeValue {
    let assignment: VariableDeclaration | AssignmentExpression;
    if (node.declared) assignment = node.assignment as VariableDeclaration;
    else assignment = node.assignment as AssignmentExpression;

    evaluate(assignment, env);

    let condition = evaluate(node.condition, env);
    let result: RuntimeValue = MK_NULL();
    while (condition.value) {
        for (const statement of node.body) result = evaluate(statement, env);

        evaluate(node.compoundAssignment, env);
        condition = evaluate(node.condition, env);
    }

    return result;
}

export function evaluate_while_statement(node: WhileStatement, env: Environment): RuntimeValue {
    const maxIterations = 10000;
    let iterations = 0;

    let condition = evaluate(node.condition, env);
    let result: RuntimeValue = MK_NULL();
    while (condition.value) {
        if (iterations++ >= maxIterations) throw "Potential infinite loop detected. Loop exceeded the maximum number of allowed iterations (10000).";

        for (const statement of node.body) result = evaluate(statement, env);

        condition = evaluate(node.condition, env);
    }

    return result;
}
