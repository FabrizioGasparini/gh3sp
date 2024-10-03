"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluate = evaluate;
const values_1 = require("./values");
const expressions_1 = require("./evaluation/expressions");
const statements_1 = require("./evaluation/statements");
function evaluate(astNode, env) {
    switch (astNode.kind) {
        case "NumericLiteral":
            return (0, values_1.MK_NUMBER)(astNode.value);
        case "StringLiteral":
            return (0, values_1.MK_STRING)(astNode.value);
        case "Identifier":
            return (0, expressions_1.evaluate_identifier)(astNode, env);
        case "BinaryExpression":
            return (0, expressions_1.evaluate_binary_expression)(astNode, env);
        case "Program":
            return (0, statements_1.evaluate_program)(astNode, env);
        case "VariableDeclaration":
            return (0, statements_1.evaluate_variable_declaration)(astNode, env);
        case "AssignmentExpression":
            return (0, expressions_1.evaluate_assignment_expression)(astNode, env);
        case "CompoundAssignmentExpression":
            return (0, expressions_1.evaluate_compound_assignment_expression)(astNode, env);
        case "ObjectLiteral":
            return (0, expressions_1.evaluate_object_expression)(astNode, env);
        case "CallExpression":
            return (0, expressions_1.evaluate_call_expression)(astNode, env);
        case "FunctionDeclaration":
            return (0, statements_1.evaluate_function_declaration)(astNode, env);
        case "MemberExpression":
            return (0, expressions_1.evaluate_member_expression)(astNode, env);
        case "IfStatement":
            return (0, statements_1.evaluate_if_statement)(astNode, env);
        case "ForStatement":
            return (0, statements_1.evaluate_for_statement)(astNode, env);
        case "WhileStatement":
            return (0, statements_1.evaluate_while_statement)(astNode, env);
        default:
            console.log(astNode);
            throw `This AST Node has not yet been setup for interpretation. ${JSON.stringify(astNode)}`;
    }
}
