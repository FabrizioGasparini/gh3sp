import { RuntimeValue, MK_NUMBER, MK_STRING } from "./values.ts";
import { NumericLiteral, Statement, BinaryExpression, Program, Identifier, VariableDeclaration, AssignmentExpression, ObjectLiteral, CallExpression, FunctionDeclaration, MemberExpression, StringLiteral, IfStatement, CompoundAssignmentExpression, ForStatement, WhileStatement, ListLiteral, ForEachStatement } from "../frontend/ast.ts";
import Environment from "./environments.ts";
import { evaluate_identifier, evaluate_binary_expression, evaluate_assignment_expression, evaluate_object_expression, evaluate_call_expression, evaluate_member_expression, evaluate_compound_assignment_expression, evaluate_list_expression } from "./evaluation/expressions.ts";
import { evaluate_for_statement, evaluate_foreach_statement, evaluate_function_declaration, evaluate_if_statement, evaluate_program, evaluate_variable_declaration, evaluate_while_statement } from "./evaluation/statements.ts";
import { handleError, InterpreterError } from "../utils/errors_hander.ts";

let currentLine: number = 0;
let currentColumn: number = 0;

export function evaluate(astNode: Statement, env: Environment): RuntimeValue {
    if (astNode.line && astNode.column) {
        currentLine = astNode.line;
        currentColumn = astNode.column;
    }

    switch (astNode.kind) {
        case "NumericLiteral":
            return MK_NUMBER((astNode as NumericLiteral).value);

        case "StringLiteral":
            return MK_STRING((astNode as StringLiteral).value);

        case "Identifier":
            return evaluate_identifier(astNode as Identifier, env);

        case "BinaryExpression":
            return evaluate_binary_expression(astNode as BinaryExpression, env);

        case "Program":
            return evaluate_program(astNode as Program, env);

        case "VariableDeclaration":
            return evaluate_variable_declaration(astNode as VariableDeclaration, env);

        case "AssignmentExpression":
            return evaluate_assignment_expression(astNode as AssignmentExpression, env);

        case "CompoundAssignmentExpression":
            return evaluate_compound_assignment_expression(astNode as CompoundAssignmentExpression, env);

        case "ObjectLiteral":
            return evaluate_object_expression(astNode as ObjectLiteral, env);

        case "CallExpression":
            return evaluate_call_expression(astNode as CallExpression, env);

        case "FunctionDeclaration":
            return evaluate_function_declaration(astNode as FunctionDeclaration, env);

        case "MemberExpression":
            return evaluate_member_expression(astNode as MemberExpression, env);

        case "IfStatement":
            return evaluate_if_statement(astNode as IfStatement, env);

        case "ForStatement":
            return evaluate_for_statement(astNode as ForStatement, env);

        case "WhileStatement":
            return evaluate_while_statement(astNode as WhileStatement, env);

        case "ForEachStatement":
            return evaluate_foreach_statement(astNode as ForEachStatement, env);

        case "ListLiteral":
            return evaluate_list_expression(astNode as ListLiteral, env);

        default:
            throw throwError(`This AST Node has not yet been setup for interpretation. ${JSON.stringify(astNode)}`);
    }
}

export function throwError(error: string) {
    throw handleError(new InterpreterError(error), currentLine, currentColumn);
}
