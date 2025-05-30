import { RuntimeValue, MK_NUMBER, MK_STRING, MK_BOOL, MK_NULL } from "./values";
import { NumericLiteral, Statement, BinaryExpression, Program, Identifier, VariableDeclaration, AssignmentExpression, ObjectLiteral, CallExpression, FunctionDeclaration, MemberExpression, StringLiteral, IfStatement, CompoundAssignmentExpression, ForStatement, WhileStatement, ListLiteral, ForEachStatement, type LogicalExpression, type BooleanLiteral, type TernaryExpression, type ControlFlowStatement, type ExportDeclaration } from "../frontend/ast";
import Environment from "./environments";
import { evaluate_identifier, evaluate_binary_expression, evaluate_assignment_expression, evaluate_object_expression, evaluate_call_expression, evaluate_member_expression, evaluate_compound_assignment_expression, evaluate_list_expression, evaluate_logical_expression, evaluate_ternary_expression } from "./evaluation/expressions";
import { evaluate_control_flow_statement, evaluate_export_declaration, evaluate_for_statement, evaluate_foreach_statement, evaluate_function_declaration, evaluate_if_statement, evaluate_program, evaluate_variable_declaration, evaluate_while_statement } from "./evaluation/statements";
import { handleError, InterpreterError } from "../utils/errors_handler";

// Declares current line & column, useful for errors handling
let currentLine: number = 0;
let currentColumn: number = 0;

// Evaluates nodes given from the parser
export function evaluate(astNode: Statement, env: Environment): RuntimeValue {
    // Throws an error if the node is not valid
    if (!astNode) throwError(new InterpreterError(`Invalid node. ${astNode}`));
    
    // If the current node has a line and a column, sets them as the current line and current column
    if (astNode.line && astNode.column) {
        currentLine = astNode.line;
        currentColumn = astNode.column;
    }

    // Evaluates the given node by its kind
    switch (astNode.kind) {
        case "Program":
            return evaluate_program(astNode as Program, env);

        
        case "NumericLiteral":
            return MK_NUMBER((astNode as NumericLiteral).value);

        case "StringLiteral":
            return MK_STRING((astNode as StringLiteral).value);

        case "BooleanLiteral":
            return MK_BOOL((astNode as BooleanLiteral).value);

        case "ObjectLiteral":
            return evaluate_object_expression(astNode as ObjectLiteral, env);

        case "ListLiteral":
            return evaluate_list_expression(astNode as ListLiteral, env);


        case "Identifier":
            return evaluate_identifier(astNode as Identifier, env);
            

        case "VariableDeclaration":
            return evaluate_variable_declaration(astNode as VariableDeclaration, env);

        case "FunctionDeclaration":
            return evaluate_function_declaration(astNode as FunctionDeclaration, env);
        
        
        case "BinaryExpression":
            return evaluate_binary_expression(astNode as BinaryExpression, env);

        case "LogicalExpression":
            return evaluate_logical_expression(astNode as LogicalExpression, env);

        case "AssignmentExpression":
            return evaluate_assignment_expression(astNode as AssignmentExpression, env);

        case "CompoundAssignmentExpression":
            return evaluate_compound_assignment_expression(astNode as CompoundAssignmentExpression, env);
        
        case "CallExpression":
            return evaluate_call_expression(astNode as CallExpression, env);

        case "MemberExpression":
            return evaluate_member_expression(astNode as MemberExpression, env);

        case "TernaryExpression":
            return evaluate_ternary_expression(astNode as TernaryExpression, env);
        
        
        case "IfStatement":
            return evaluate_if_statement(astNode as IfStatement, env);

        case "ForStatement":
            return evaluate_for_statement(astNode as ForStatement, env);

        case "WhileStatement":
            return evaluate_while_statement(astNode as WhileStatement, env);

        case "ForEachStatement":
            return evaluate_foreach_statement(astNode as ForEachStatement, env);
        
        case "ControlFlowStatement":
            return evaluate_control_flow_statement(astNode as ControlFlowStatement, env);
        
        
        case "ExportDeclaration":
            return evaluate_export_declaration(astNode as ExportDeclaration, env);
        
        
        case "NullStatement":
            return MK_NULL();
        
        default:
            throw throwError(new InterpreterError(`This AST Node has not yet been setup for interpretation. ${JSON.stringify(astNode)}`));
    }
}

export const throwError = (error: Error) => {throw handleError(error, currentLine, currentColumn)}
