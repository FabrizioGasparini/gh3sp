import { AssignmentExpression, CompoundAssignmentExpression, ForEachStatement, ForStatement, FunctionDeclaration, Identifier, IfStatement, NumericLiteral, Program, VariableDeclaration, WhileStatement } from "../../frontend/ast.ts";
import Environment from "../environments.ts";
import { evaluate, throwError } from "../interpreter.ts";
import { RuntimeValue, MK_NULL, FunctionValue, ListValue, MK_NUMBER } from "../values.ts";

export function evaluate_program(program: Program, env: Environment): RuntimeValue {
    let lastEvaluated: RuntimeValue = MK_NULL();

    for (const statement of program.body) {
        lastEvaluated = evaluate(statement, env);
    }

    return lastEvaluated;
}

export function evaluate_variable_declaration(declaration: VariableDeclaration, env: Environment): RuntimeValue {
    const value = declaration.value ? evaluate(declaration.value, env) : MK_NULL();
    if (declaration.value?.kind == "ListLiteral") (value as ListValue).name = (declaration.assignee as Identifier).symbol;

    return env.declareVar((declaration.assignee as Identifier).symbol, value, declaration.constant);
}

export function evaluate_function_declaration(declaration: FunctionDeclaration, env: Environment): RuntimeValue {
    const fn = {
        type: "function",
        name: declaration.name,
        parameters: declaration.parameters,
        declarationEnv: env,
        body: declaration.body,
    } as FunctionValue;

    if (declaration.name) return env.declareVar(declaration.name, fn, true);
    return fn;
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

    const scope = new Environment(env);

    const variable = (assignment.assignee as Identifier).symbol;
    evaluate(assignment, scope);

    let iterations = 0;

    let condition = evaluate(node.condition, scope);
    let result: RuntimeValue = MK_NULL();

    if (node.body.length == 0) return result;
    while (condition.value) {
        if (iterations++ >= env.MAX_ITERATIONS) throw throwError("Potential infinite loop detected. Loop exceeded the maximum number of allowed iterations (10000)");

        for (const statement of node.body) result = evaluate(statement, scope);

        if (node.increment.kind == "CompoundAssignmentExpression") evaluate(node.increment as CompoundAssignmentExpression, scope);
        else if (node.increment.kind == "NumericLiteral") env.assignVar(variable, MK_NUMBER(env.lookupVar(variable).value + evaluate(node.increment as NumericLiteral, scope).value));
        else if (node.increment.kind == "Identifier") env.assignVar(variable, MK_NUMBER(env.lookupVar(variable).value + env.lookupVar((node.increment as Identifier).symbol).value));
        condition = evaluate(node.condition, scope);
    }

    return result;
}

export function evaluate_while_statement(node: WhileStatement, env: Environment): RuntimeValue {
    let iterations = 0;

    let condition = evaluate(node.condition, env);
    let result: RuntimeValue = MK_NULL();

    if (node.body.length == 0) return result;
    while (condition.value) {
        if (iterations++ >= env.MAX_ITERATIONS) throw throwError("Potential infinite loop detected. Loop exceeded the maximum number of allowed iterations (10000)");

        for (const statement of node.body) result = evaluate(statement, env);

        condition = evaluate(node.condition, env);
    }

    return result;
}

export function evaluate_foreach_statement(node: ForEachStatement, env: Environment): RuntimeValue {
    const scope = new Environment(env);

    const list = env.lookupVar(node.list.symbol) as ListValue;

    if (node.declared) scope.declareVar(node.element.symbol, MK_NULL(), false);

    let result: RuntimeValue = MK_NULL();
    if (list.value.length == 0) return result;
    list.value.forEach((element) => {
        scope.assignVar(node.element.symbol, element);

        for (const statement of node.body) result = evaluate(statement, scope);
    });

    return result;
}
