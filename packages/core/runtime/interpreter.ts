import {
  RuntimeValue,
  MK_NUMBER,
  MK_STRING,
  MK_BOOL,
  MK_NULL,
} from "@core/runtime/values";
import {
  NumericLiteral,
  Statement,
  BinaryExpression,
  Program,
  Identifier,
  VariableDeclaration,
  AssignmentExpression,
  ObjectLiteral,
  CallExpression,
  FunctionDeclaration,
  MemberExpression,
  StringLiteral,
  IfStatement,
  CompoundAssignmentExpression,
  ForStatement,
  WhileStatement,
  ListLiteral,
  ForEachStatement,
  type LogicalExpression,
  type BooleanLiteral,
  type TernaryExpression,
  type ControlFlowStatement,
  type ExportDeclaration,
  MembershipExpression,
  ChooseStatement,
  ChooseExpression,
  ClassDeclaration,
  AwaitExpression,
} from "@core/frontend/ast";
import Environment from "@core/runtime/environments";
import {
  evaluate_identifier,
  evaluate_binary_expression,
  evaluate_assignment_expression,
  evaluate_object_expression,
  evaluate_call_expression,
  evaluate_member_expression,
  evaluate_compound_assignment_expression,
  evaluate_list_expression,
  evaluate_logical_expression,
  evaluate_ternary_expression,
  evaluate_membership_expression,
  evaluate_choose_expression,
} from "@core/runtime/evaluation/expressions";
import {
  evaluate_choose_statement,
  evaluate_class_declaration,
  evaluate_control_flow_statement,
  evaluate_export_declaration,
  evaluate_for_statement,
  evaluate_foreach_statement,
  evaluate_function_declaration,
  evaluate_if_statement,
  evaluate_program,
  evaluate_variable_declaration,
  evaluate_while_statement,
} from "@core/runtime/evaluation/statements";
import { handleError, InterpreterError } from "@core/utils/errors_handler";

// Declares current line & column, useful for errors handling
let currentLine: number = 0;
let currentColumn: number = 0;

// Evaluates nodes given from the parser
export async function evaluate(
  astNode: Statement,
  env: Environment,
): Promise<RuntimeValue> {
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
      return await evaluate_program(astNode as Program, env);

    case "NumericLiteral":
      return MK_NUMBER((astNode as NumericLiteral).value);

    case "StringLiteral":
      return MK_STRING((astNode as StringLiteral).value);

    case "BooleanLiteral":
      return MK_BOOL((astNode as BooleanLiteral).value);

    case "ObjectLiteral":
      return await evaluate_object_expression(astNode as ObjectLiteral, env);

    case "ListLiteral":
      return await evaluate_list_expression(astNode as ListLiteral, env);

    case "Identifier":
      return await evaluate_identifier(astNode as Identifier, env);

    case "AwaitExpression": {
      const awaited = await evaluate((astNode as any).expression, env);
      // If it's a promise runtime value, await its inner promise
      if ((awaited as any)?.type === "promise") {
        return await (awaited as any).promise;
      }
      return awaited;
    }

    case "VariableDeclaration":
      return await evaluate_variable_declaration(
        astNode as VariableDeclaration,
        env,
      );

    case "FunctionDeclaration":
      return await evaluate_function_declaration(
        astNode as FunctionDeclaration,
        env,
      );

    case "ClassDeclaration":
      return await evaluate_class_declaration(astNode as ClassDeclaration, env);

    case "BinaryExpression":
      return await evaluate_binary_expression(astNode as BinaryExpression, env);

    case "MembershipExpression":
      return await evaluate_membership_expression(
        astNode as MembershipExpression,
        env,
      );

    case "LogicalExpression":
      return await evaluate_logical_expression(
        astNode as LogicalExpression,
        env,
      );

    case "AssignmentExpression":
      return await evaluate_assignment_expression(
        astNode as AssignmentExpression,
        env,
      );

    case "CompoundAssignmentExpression":
      return await evaluate_compound_assignment_expression(
        astNode as CompoundAssignmentExpression,
        env,
      );

    case "CallExpression":
      return await evaluate_call_expression(astNode as CallExpression, env);

    case "MemberExpression":
      return await evaluate_member_expression(astNode as MemberExpression, env);

    case "TernaryExpression":
      return await evaluate_ternary_expression(
        astNode as TernaryExpression,
        env,
      );

    case "ChooseExpression":
      return await evaluate_choose_expression(astNode as ChooseExpression, env);

    case "IfStatement":
      return await evaluate_if_statement(astNode as IfStatement, env);

    case "ForStatement":
      return await evaluate_for_statement(astNode as ForStatement, env);

    case "WhileStatement":
      return await evaluate_while_statement(astNode as WhileStatement, env);

    case "ForEachStatement":
      return await evaluate_foreach_statement(astNode as ForEachStatement, env);

    case "ControlFlowStatement":
      return await evaluate_control_flow_statement(
        astNode as ControlFlowStatement,
        env,
      );

    case "ChooseStatement":
      return await evaluate_choose_statement(astNode as ChooseStatement, env);

    case "ExportDeclaration":
      return await evaluate_export_declaration(
        astNode as ExportDeclaration,
        env,
      );

    case "NullStatement":
      return MK_NULL();

    default:
      throw throwError(
        new InterpreterError(
          `This AST Node has not yet been setup for interpretation. ${JSON.stringify(astNode)}`,
        ),
      );
  }
}

export const throwError = (error: Error) => {
  throw handleError(error, currentLine, currentColumn);
};
