import { AssignmentExpression, CompoundAssignmentExpression, ForEachStatement, ForStatement, FunctionDeclaration, Identifier, IfStatement, NumericLiteral, Program, VariableDeclaration, WhileStatement, type ImportStatement } from "../../frontend/ast.ts";
import { InterpreterError } from "../../utils/errors_handler.ts";
import Environment from "../environments.ts";
import { evaluate, throwError } from "../interpreter.ts";
import { compileLibrary } from "../libraries.ts";
import { RuntimeValue, MK_NULL, FunctionValue, ListValue, MK_NUMBER } from "../values.ts";

export const evaluate_program = (program: Program, env: Environment): RuntimeValue => (program.body.map(stmt => evaluate(stmt, env))[program.body.length - 1])

// Adds the given variable to the given environment and returns it 
export function evaluate_variable_declaration(declaration: VariableDeclaration, env: Environment): RuntimeValue {
    const value = declaration.value ? evaluate(declaration.value, env) : MK_NULL();
    
    // If the value is a list, the variable takes the name of the list's name 
    if (declaration.value?.kind == "ListLiteral") (value as ListValue).name = (declaration.assignee as Identifier).symbol;
    
    // Adds the declared variable to the specified environment and returns it 
    return env.declareVar((declaration.assignee as Identifier).symbol, value, declaration.constant);
}

// Adds the given function to the given environment and returns it, or just returns it if it's an anonymous function
export function evaluate_function_declaration(declaration: FunctionDeclaration, env: Environment): RuntimeValue {
    const fn = {
        type: "function",
        name: declaration.name,
        parameters: declaration.parameters,
        declarationEnv: env,
        body: declaration.body,
    } as FunctionValue;
    
    // If the functions has a name (standard function), it adds it to the environment and returns it, otherwise it just returns it (anonymous function)
    return declaration.name ? env.declareVar(declaration.name, fn, true) : fn;
}

// Evaluates the if statement's condition, if it's true it evaluates the 'then' node and returns it, if it's false it evaluates the 'else' node and returns it. If both nodes are empty, it just returns NULL
export const evaluate_if_statement = (node: IfStatement, env: Environment): RuntimeValue => {
    return evaluate(node.condition, env).value == true
        // Evaluates 'then' node
        ? node.then.map(stmt => evaluate(stmt, env))[0]
        // Evaluates 'else' node
        : node.else
            ? node.else.map(stmt => evaluate(stmt, env))[0]
            : MK_NULL()
}

// Evaluates the for statement
export function evaluate_for_statement(node: ForStatement, env: Environment): RuntimeValue {
    // If the body is empty return NULL
    if (node.body.length == 0) return MK_NULL();
    
    // Define the assignment node as a 'VariableDeclaration' or an 'AssignmentExpression'
    const assignment = node.declared
        ? node.assignment as VariableDeclaration
        : node.assignment as AssignmentExpression
    
    // Defines the new scope for the for statement & evaluates the assignment in that scope
    const newScope = new Environment(env);
    evaluate(assignment, newScope);
    
    // Sets the for statement's scope as the new scope, if the assignment is a 'VariableDeclaration', otherwise it uses the given environment
    const scope = assignment.kind == "VariableDeclaration" ? newScope : env;

    // Declares the for statement's index variable
    const variable = (assignment.assignee as Identifier).symbol;
    
    // Declares counter for the number of iterations
    let iterations = 0;
    // Evaluates the starting condition
    let condition = evaluate(node.condition, newScope);

    // While the for statement's condition is met, evaluates the body nodes
    while (condition.value) {
        // Throws an error if the number of executed iterations exceeds the max number of iterations
        if (iterations++ >= scope.MAX_ITERATIONS) throwError(new InterpreterError(`Potential infinite loop detected. Loop exceeded the maximum number of allowed iterations (${scope.MAX_ITERATIONS})`));
        
        // Evaluates the body's nodes
        node.body.map(stmt => evaluate(stmt, newScope));
        
        // Depending on the increment type updates the for statement's index variable
        switch (node.increment.kind) {
            case "CompoundAssignmentExpression":
                evaluate(node.increment as CompoundAssignmentExpression, newScope);
                break;
            
            case "NumericLiteral":
                scope.assignVar(variable, MK_NUMBER(scope.lookupVar(variable).value + evaluate(node.increment as NumericLiteral, newScope).value));
                break;
            
            case "Identifier":
                scope.assignVar(variable, MK_NUMBER(scope.lookupVar(variable).value + scope.lookupVar((node.increment as Identifier).symbol).value));
                break;
            
            default:
                throwError(new InterpreterError(`Invalid increment kind (${node.increment.kind})`))
    
        }

        // Re-evaluates and sets the for statement's condition before repeating the loop
        condition = evaluate(node.condition, newScope);
    }

    return MK_NULL();
}

// Evaluates the while statement
export function evaluate_while_statement(node: WhileStatement, env: Environment): RuntimeValue {
    // If the body is empty return NULL
    if (node.body.length == 0) return MK_NULL();
      
    // Declares counter for the number of iterations
    let iterations = 0;
    // Evaluates the starting condition
    let condition = evaluate(node.condition, env);

    // While the while statement's condition is met, evaluates the body nodes
    while (condition.value) {
        // Throws an error if the number of executed iterations exceeds the max number of iterations
        if (iterations++ >= env.MAX_ITERATIONS) throw throwError(new InterpreterError(`Potential infinite loop detected. Loop exceeded the maximum number of allowed iterations (${env.MAX_ITERATIONS})`));

        // Evaluates the body's nodes
        node.body.map(stmt => evaluate(stmt, env));

        // Re-evaluates and sets the for statement's condition before repeating the loop
        condition = evaluate(node.condition, env);
    }

    return MK_NULL();
}

// Evaluates foreach statements
export function evaluate_foreach_statement(node: ForEachStatement, env: Environment): RuntimeValue {
    // Looks for the list variabile in the given environment
    const list = env.lookupVar(node.list.symbol) as ListValue;
    // If the length of the list is 0, return NULL
    if (list.value.length == 0) return MK_NULL();
    
    // Declare the new foreach statement's scope
    const scope = new Environment(env);
    // If the loop variable is not already declare in the given environment, declares it the foreach statement's scope
    if (node.declared) scope.declareVar(node.element.symbol, MK_NULL(), false);
    
    // Loops through the list
    list.value.forEach((element) => {
        // Assigns the value of the current iterated element to the loop variable
        scope.assignVar(node.element.symbol, element);
        
        // Evaluates the foreach statement's body 
        node.body.map(stmt => evaluate(stmt, env));
    });

    return MK_NULL();
}

// Evaluates the import statement
export function evaluate_import_statement(node: ImportStatement, env: Environment): RuntimeValue {
    // Throws an error if the given environment is not the global scope
    if (env.parent) throw throwError(new InterpreterError("Cannot import libraries outside of the main scope"));
    
    // Compiles the library at the given path
    compileLibrary(node.path)

    return MK_NULL()
}
