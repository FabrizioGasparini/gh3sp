import { AssignmentExpression, ChooseStatement, CompoundAssignmentExpression, Expression, ForEachStatement, ForStatement, FunctionDeclaration, Identifier, IfStatement, NumericLiteral, Program, Statement, VariableDeclaration, WhileStatement, type ControlFlowStatement, type ExportDeclaration, type ImportStatement } from "../../frontend/ast.ts";
import { InterpreterError } from "../../utils/errors_handler.ts";
import Environment from "../environments.ts";
import { evaluate, throwError } from "../interpreter.ts";
import { compileLibrary } from "../libraries.ts";
import { RuntimeValue, MK_NULL, FunctionValue, ListValue, MK_NUMBER, type ReactiveValue, type BreakSignal, type ContinueSignal, NativeFunctionValue, ObjectValue, Signal, BoolValue  } from "../values.ts";

export const evaluate_program = (program: Program, env: Environment): RuntimeValue => (program.body.map(stmt => evaluate(stmt, env))[program.body.length - 1])

export function equals(a: RuntimeValue, b: RuntimeValue): boolean {
    // If both values are null, they are equal
    if (a.type == "null" && b.type == "null") return true;
    // If both values are numbers, they are equal if their values are equal
    if (a.type == "number" && b.type == "number") return a.value == b.value;
    // If both values are strings, they are equal if their values are equal
    if (a.type == "string" && b.type == "string") return a.value == b.value;
    // If both values are booleans, they are equal if their values are equal
    if (a.type == "boolean" && b.type == "boolean") return a.value == b.value;
    // If both values are lists, they are equal if their names and values are equal
    if (a.type == "list" && b.type == "list") return a.value.length == b.value.length && a.value.every((item: RuntimeValue, index: number) => equals(item, b.value[index]));
    // If both values are objects, they are equal if their keys and values are equal
    if (a.type == "object" && b.type == "object") {
        const objA = a as ObjectValue;
        const objB = b as ObjectValue;

        if (objA.properties.size !== objB.properties.size) return false;
        for (const [key, value] of objA.properties) {
            if (!objB.properties.has(key) || !equals(value, objB.properties.get(key)!)) return false;
        }

        return true;
    }
    // If both values are reactive, they are equal if their names and nodes are equal
    if (a.type == "reactive" && b.type == "reactive") {
        const reactiveA = a as ReactiveValue;
        const reactiveB = b as ReactiveValue;

        return reactiveA.name == reactiveB.name && reactiveA.node.kind == reactiveB.node.kind && equals(reactiveA.value, reactiveB.value);
    }
    // If both values are functions, they are equal if their names and bodies are equal
    if (a.type == "function" && b.type == "function") {
        const fnA = a as FunctionValue;
        const fnB = b as FunctionValue;

        return fnA.name == fnB.name && fnA.parameters.length == fnB.parameters.length && fnA.body.length == fnB.body.length &&
            fnA.body.every((stmt, index) => stmt.kind == fnB.body[index].kind);
    }
    // If both values are native functions, they are equal if their names are equal
    if (a.type == "native-function" && b.type == "native-function") {
        return (a as NativeFunctionValue).name == (b as NativeFunctionValue).name;
    }
    // If the types are different, they are not equal
    return false;
}

// Adds the given variable to the given environment and returns it 
export function evaluate_variable_declaration(declaration: VariableDeclaration, env: Environment): RuntimeValue {
    const value = declaration.value
        ? declaration.reactive
            ? { type: "reactive", node: declaration.value!, name: (declaration.assignee as Identifier).symbol } as ReactiveValue
            : evaluate(declaration.value, env)
        : MK_NULL();
    
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
        expectedArgs: declaration.expectedArgs,
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
    const loop_env = new Environment(env);
    evaluate(assignment, loop_env);
        
    // Declares the for statement's index variable
    const variable = (assignment.assignee as Identifier).symbol;
    // Sets the for statement's scope as the new scope, if the assignment is a 'VariableDeclaration', otherwise it uses the given environment
    const variable_env = assignment.kind == "VariableDeclaration" ? loop_env : env;
    
    // Declares counter for the number of iterations
    let iterations = 0;
    // Evaluates the starting condition
    let condition = evaluate(node.condition, loop_env);

    // While the for statement's condition is met, evaluates the body nodes
    while (condition.value) {
        loop_env.inside_loop = true
        // Throws an error if the number of executed iterations exceeds the max number of iterations
        if (iterations++ >= loop_env.MAX_ITERATIONS) throwError(new InterpreterError(`Potential infinite loop detected. Loop exceeded the maximum number of allowed iterations (${loop_env.MAX_ITERATIONS})`));
        
        // Evaluates the body's nodes
        try {
            node.body.map(stmt => evaluate(stmt, loop_env));
        } catch (signal) {
            const sig = signal as Signal
            switch (sig.type)
            {
                case "break":
                    loop_env.inside_loop = false
                    break
                
                case "continue":
                    break
                
                default:
                    throw signal
            }
        }

        if (!loop_env.inside_loop) return MK_NULL();
        
        // Depending on the increment type updates the for statement's index variable
        switch (node.increment.kind) {
            case "CompoundAssignmentExpression":
                evaluate(node.increment as CompoundAssignmentExpression, loop_env);
                break;
            
            case "NumericLiteral":
                variable_env.assignVar(variable, MK_NUMBER(variable_env.lookupVar(variable).value + evaluate(node.increment as NumericLiteral, loop_env).value));
                break;
            
            case "Identifier":
                variable_env.assignVar(variable, MK_NUMBER(variable_env.lookupVar(variable).value + variable_env.lookupVar((node.increment as Identifier).symbol).value));
                break;
            
            default:
                throwError(new InterpreterError(`Invalid increment kind (${node.increment.kind})`))
    
        }
        // Re-evaluates and sets the for statement's condition before repeating the loop
        condition = evaluate(node.condition, loop_env);
    }

    return MK_NULL();
}

// Evaluates the while statement
export function evaluate_while_statement(node: WhileStatement, env: Environment): RuntimeValue {
    // If the body is empty return NULL
    if (node.body.length == 0) return MK_NULL();
      
    // Declares the new while statement's scope
    const loop_env: Environment = new Environment(env);

    // Declares counter for the number of iterations
    let iterations = 0;
    // Evaluates the starting condition
    let condition = evaluate(node.condition, env);

    // While the while statement's condition is met, evaluates the body nodes
    while (condition.value) {
        loop_env.inside_loop = true
        // Throws an error if the number of executed iterations exceeds the max number of iterations
        if (iterations++ >= loop_env.MAX_ITERATIONS) throw throwError(new InterpreterError(`Potential infinite loop detected. Loop exceeded the maximum number of allowed iterations (${loop_env.MAX_ITERATIONS})`));
        
        // Evaluates the body's nodes
        try {
            node.body.map(stmt => evaluate(stmt, loop_env));
        } catch (signal) {
            const sig = signal as Signal
            switch (sig.type)
            {
                case "break":
                    loop_env.inside_loop = false
                    break
                
                case "continue":
                    break

                default:
                    throw signal
            }
        }

        if (!loop_env.inside_loop) return MK_NULL();
        
        // Re-evaluates and sets the for statement's condition before repeating the loop
        condition = evaluate(node.condition, loop_env);
    }

    return MK_NULL();
}

// Evaluates foreach statements
export function evaluate_foreach_statement(node: ForEachStatement, env: Environment): RuntimeValue {
    // Looks for the list variabile in the given environment
    const list = node.list.kind == "Identifier"
        ? env.lookupVar(node.list.symbol) as ListValue
        : evaluate(node.list, env) as ListValue
    
    // If the length of the list is 0, return NULL
    if (list.value.length == 0) return MK_NULL();
    

    // If the loop variable is not already declare in the given environment, declares it the foreach statement's scope
    const loopElement: Identifier = node.element.kind == "Identifier"
        ? node.element
        : (node.element as VariableDeclaration).assignee as Identifier;
        
        
    const loopIndex: Identifier | null = node.index
        ? node.index.kind == "Identifier"
            ? node.index
            : (node.index as VariableDeclaration).assignee as Identifier
        : null    

    // Loops through the list
    for (let i = 0; i < list.value.length; i++)
    {
        // Declare the new foreach statement's scope
        const loop_env = new Environment(env);
        if (node.element.kind == "VariableDeclaration") loop_env.declareVar(((node.element as VariableDeclaration).assignee as Identifier).symbol, MK_NULL(), false);
        if (node.index && node.index.kind == "VariableDeclaration") loop_env.declareVar(((node.index as VariableDeclaration).assignee as Identifier).symbol, MK_NUMBER(0), false)

        const element = list.value[i];
        loop_env.inside_loop = true

        // Assigns the value of the current iterated element to the loop variable
        loop_env.assignVar(loopElement.symbol, element);
        if(loopIndex) loop_env.assignVar((loopIndex as Identifier).symbol, MK_NUMBER(i));
        
        // Evaluates the foreach statement's body 
        try {
            node.body.map(stmt => evaluate(stmt, loop_env));
        } catch (signal) {
            const sig = signal as Signal
            switch (sig.type)
            {
                case "break":
                    loop_env.inside_loop = false
                    break
                
                case "continue":
                    break
                    
                default:
                    throw signal
            }
        }
                
        if (!loop_env.inside_loop) return MK_NULL();
    }

    return MK_NULL();
}

// Evaluates the import statement
export function evaluate_import_statement(node: ImportStatement, env: Environment): RuntimeValue {
    // Throws an error if the given environment is not the global scope
    if (env.parent) throw throwError(new InterpreterError("Cannot import libraries outside of the main scope"));
    
    // Compiles the library at the given path
    compileLibrary(node.path, env)

    return MK_NULL()
}

// Evaluates break, continue and pass statements
export function evaluate_control_flow_statement(node: ControlFlowStatement, env: Environment): RuntimeValue {
    // Throws an error, if the given environment is not currently evaluating a loop
    if (!env.inside_loop) throw throwError(new SyntaxError("Invalid 'break' outside loop"))

    // Returns the necessary flow signal, given by the node value, by throwing it
    switch (node.value) {
        case "break":
            throw { type: "break" } as BreakSignal;
        case "continue":
            throw { type: "continue" } as ContinueSignal;
        case "pass":
            return MK_NULL()
    }
}

export function evaluate_choose_statement(node: ChooseStatement, env: Environment): RuntimeValue {
    // Evaluates the subject expression
    const subject = evaluate(node.subject, env);

    // Declares a temporary environment for the choose expression
    const tempEnv = new Environment(env);
    // If a temporary variable is defined, assigns the subject to it
    if (node.tempVariable) tempEnv.declareVar(node.tempVariable.symbol, subject, false);

    let conditionsMet = false;
    // Loops through the cases
    for (const chooseCase of node.cases) {
        if (chooseCase.conditions) {
            // If the case has conditions, evaluates them and checks if any of them is true
            const conditions = chooseCase.conditions.map((cond: Expression) => evaluate(cond, tempEnv));
            if (conditions.some((cond: RuntimeValue, index: number) => equals(cond, subject) || ((chooseCase.conditions![index].kind == "BinaryExpression" || chooseCase.conditions![index].kind == "LogicalExpression") && (cond as BoolValue).value))) {
                conditionsMet = true;
                (chooseCase.body as Statement[]).map((stmt: Statement) => evaluate(stmt, tempEnv));
                if(!node.chooseAll) return MK_NULL(); // If chooseAll is false, exits after the first matching case
            }
        }

    }

    // If the default case exists and no conditions were met, evaluates the default case's body
    if (node.defaultCase && !conditionsMet) (node.defaultCase.body as Statement[]).map((stmt: Statement) => evaluate(stmt, tempEnv));
    
    return MK_NULL()
}

// Evaluates the exported variables and functions
export function evaluate_export_declaration(node: ExportDeclaration, env: Environment): RuntimeValue {
    let name: string = "";
    switch (node.declaration.kind) {
        case "VariableDeclaration":
            name = ((node.declaration as VariableDeclaration).assignee as Identifier).symbol;
            break
    
        case "FunctionDeclaration":
            name = (node.declaration as FunctionDeclaration).name;
            break
    }
    
    evaluate(node.declaration, env)
    env.exported.add(name);
    
    return MK_NULL()
}