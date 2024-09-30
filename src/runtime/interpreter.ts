import { RuntimeValue, MK_NUMBER } from "./values"
import { NumericLiteral, Statement, BinaryExpression, Program, Identifier, VariableDeclaration, AssignmentExpression, ObjectLiteral, CallExpression, FunctionDeclaration, MemberExpression } from "../frontend/ast"
import Environment from "./environments";
import { evaluate_identifier, evaluate_binary_expression, evaluate_assignment_expression, evaluate_object_expression, evaluate_call_expression, evaluate_member_expression } from "./evaluation/expressions";
import { evaluate_function_declaration, evaluate_program, evaluate_variable_declaration } from "./evaluation/statements";

export function evaluate(astNode: Statement, env: Environment): RuntimeValue {
    switch (astNode.kind) {
        case "NumericLiteral":
            return MK_NUMBER((astNode as NumericLiteral).value);
        
        case "Identifier":
            return evaluate_identifier(astNode as Identifier, env);
        
        case "BinaryExpression":
            return evaluate_binary_expression(astNode as BinaryExpression, env);
            
        case "Program":
            return evaluate_program(astNode as Program, env);
        
        case "VariableDeclaration":
            return evaluate_variable_declaration(astNode as VariableDeclaration, env);
        
        case "AssignmentExpression":
            return evaluate_assignment_expression(astNode as AssignmentExpression, env)
        
        case "ObjectLiteral":
            return evaluate_object_expression(astNode as ObjectLiteral, env);        
        
        case "CallExpression":
            return evaluate_call_expression(astNode as CallExpression, env);
        
        case "FunctionDeclaration":
            return evaluate_function_declaration(astNode as FunctionDeclaration, env)
        
        case "MemberExpression":
            return evaluate_member_expression(astNode as MemberExpression, env)
            
        default:
            console.log(astNode)
            throw `This AST Node has not yet been setup for interpretation. ${JSON.stringify(astNode)}`;
    }
}