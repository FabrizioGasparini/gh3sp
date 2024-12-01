import type Environment from "../runtime/environments.ts";
import { compileLibrary } from "../runtime/libraries.ts";
import { handleError, ParserError } from "../utils/errors_handler.ts";
import { CallExpression, CompoundAssignmentExpression, ForEachStatement, ForStatement, IfStatement, ListLiteral, StringLiteral, WhileStatement, type LogicalExpression, type TernaryExpression, type ControlFlowStatement } from "./ast.ts";
import { Statement, Program, Expression, BinaryExpression, NumericLiteral, Identifier, VariableDeclaration, AssignmentExpression, Property, ObjectLiteral, MemberExpression, FunctionDeclaration } from "./ast.ts";
import { tokenize, Token, TokenType } from "./lexer.ts";

export default class Parser {
    // Declares a list of Tokens
    private tokens: Token[] = [];
    // Specifies whether the parser is declaring a variable or not
    private isDeclaring: boolean = false;
    // Defines the current parsed line
    private currentLine: number = 1;
    // Defines the current parsed column
    private currentColumn: number = 1;
    
    // Declares the working environment
    private env: Environment;
    
    constructor(env: Environment) {
        this.env = env;
    }
    
    // Returns true if the current token is not the last one
    private not_eof(): boolean {
        return this.tokens[0].type != TokenType.EOF;
    }
    
    // Returns the current token, skipping empty lines
    private at() {
        while(this.tokens[0].type == TokenType.NL) this.skipNewLine()
            return this.tokens[0] as Token;
    }
    
    // Skips and returns the current token
    private eat() {
        const prev = this.tokens.shift() as Token;
        this.currentColumn += prev.value.length;
        return prev;
    }
    
    // Throws an error if the current Token does not have the given TokenType, otherwise the current token
    private expect(type: TokenType, err: string) {
        const prev = this.tokens.shift() as Token;

        if (prev.type == TokenType.NL) this.skipNewLine();

        if (!prev || prev.type != type) this.throwError(new ParserError(err, type));

        this.currentColumn += prev.value.length;

        return prev;
    }

    // Returns true if the current token is a new line
    private isEndOfLine(): boolean {
        return this.tokens[0].type == TokenType.NL
    }

    // Returns the parsed program linked to all the imported libraries
    public async produceAST(sourceCode: string) {
        // Gets the token from the source code using the lexer 
        this.tokens = tokenize(sourceCode);
        
        // Imports all the libraries 
        while (this.at().type == TokenType.Import) {
            await this.parse_import_statement()
            while (this.isEndOfLine()) this.skipNewLine();
        }
        
        // Returns the parsed program 
        return this.parse_program()
    }

    // Returns the parsed program
    private parse_program(): Program {
        const program: Program = {
            kind: "Program",
            body: [],
        };
        
        // Parse until END OF FILE
        while (this.not_eof()) {
            if (this.isEndOfLine()) {
                this.skipNewLine();
                if (!this.not_eof()) break;
            }

            program.body.push(this.parse_statement());
        }

        return program;
    }

    // Throws a given error specifying the current line and the current column
    private throwError(error: Error) {
        handleError(error, this.currentLine, this.currentColumn);
    }

    // Skips new line
    private skipNewLine() {
        this.eat();
        this.currentLine++;
        this.currentColumn = 1;
    }

    // Parses a statement and returns it
    private parse_statement(): Statement {
        if (this.isEndOfLine()) {
            this.skipNewLine();
            return this.parse_statement();
        }

        let stmt: Statement;
        switch (this.at().type) {
            case TokenType.Let:
                stmt = this.parse_variable_declaration();
                break;
            case TokenType.Const:
                stmt = this.parse_variable_declaration();
                break;
                
            case TokenType.Fn:
                stmt = this.parse_function_declaration();
                break;

            case TokenType.If:
                stmt = this.parse_if_statement();
                break;

            case TokenType.For:
                stmt = this.parse_for_statement();
                break;
            case TokenType.While:
                stmt = this.parse_while_statement();
                break;
            case TokenType.ForEach:
                stmt = this.parse_foreach_statement();
                break;
            
            case TokenType.Break:
                stmt = { kind: "ControlFlowStatement", value: this.eat().value } as ControlFlowStatement;
                break;
            case TokenType.Continue:
                stmt = { kind: "ControlFlowStatement", value: this.eat().value } as ControlFlowStatement;
                break;
            case TokenType.Pass:
                stmt = { kind: "ControlFlowStatement", value: this.eat().value } as ControlFlowStatement;
                break;
            
            case TokenType.Import:
                throw this.throwError(new ParserError("Libraries can only be imported at the start of the program."))
        
            // If it's not a statement, parse an expression
            default:
                return this.parse_expression();
        }


        return stmt
    }

    // Returns a function declaration statement
    private parse_function_declaration(): Statement {
        // Eat the 'fn' keyword
        this.eat();

        // Defines a name for the function if it finds an identifier
        let name = undefined;
        if (this.at().type == TokenType.Identifier)
        {
            // Throws an error if it finds an identifier while declaring a function as a variable
            if (this.isDeclaring) this.throwError(new SyntaxError("Cannot declare a named function during variable declaration"));
            name = this.eat().value;
        }
            
        // Gets a list of arguments for the function
        const args = this.parse_args();
        // Defines a list of parameters names
        const parameters: string[] = [];
        for (const arg of args) {
            // Throws an error if the current argument is not of type 'Identifier'
            if (arg.kind != "Identifier") this.throwError(new SyntaxError("Expected string parameters inside of function declaration. " + arg));

            // Adds the found parameters name to the parameters list
            parameters.push((arg as Identifier).symbol);
        }

        // Declares the list of statements found in body
        const body: Statement[] = [];
        if (this.at().type == TokenType.OpenBrace) {
            // Eat the '{' token
            this.eat();

            // While the body is not closed
            while (this.at().type != TokenType.CloseBrace) {
                // Skips all the empty lines
                while (this.isEndOfLine()) this.skipNewLine();
                
                // If it's at the end of the body, breaks out of the loop
                if (this.at().type == TokenType.CloseBrace) break;
                
                // Pushes the parsed statement to the function body's list
                body.push(this.parse_statement());
            }
            // Expects a '}' token after the function body
            this.expect(TokenType.CloseBrace, "Expected '}' at the end of for block");
        }
        // If it's an in-line function
        else if (this.at().type == TokenType.ArrowOperator) {
            // Eat the '=>' token
            this.eat();
            // Pushes the parsed statement to the function body's list
            body.push(this.parse_statement());     
        }
        // Throws an error if the function declaration isn't followed by a '{' or a '=>' token
        else this.throwError(new SyntaxError("Expected '{' of '=>' after function declaration"))

        const fn = {
            kind: "FunctionDeclaration",
            name,
            parameters,
            body,
            line: this.currentLine,
            column: this.currentColumn,
        } as FunctionDeclaration;

        return fn;
    }

    // Returns a variable declaration statement
    private parse_variable_declaration(): Statement {
        // True if the following token is of type 'Const'
        const isConstant = this.eat().type == TokenType.Const;

        // True if the following token is of type 'Reactive' 
        const reactive: boolean = this.at().type == TokenType.Reactive;
        
        // If the variable is reactive, eats the 'reactive' token
        if (reactive)
            this.eat()
        
        // Expects an identifier as the next token and gets it's value
        const identifier = this.expect(TokenType.Identifier, "Expected identifier name following let/const keywords").value;
        
        const assignee = { kind: "Identifier", symbol: identifier, line: this.currentLine, column: this.currentColumn } as Identifier;

        // If the next token is a new line or the end of the file
        if (this.isEndOfLine() || !this.not_eof()) {
            // Throws an error if the variable is a constant
            if (isConstant) this.throwError(new SyntaxError(`Must assign value to constant expression '${assignee}'. No value provided.`));

            // Returns a variable with undefined value
            return {
                kind: "VariableDeclaration",
                assignee,
                constant: false,
                line: this.currentLine,
                column: this.currentColumn,
                negative: false,
                reactive: false
            } as VariableDeclaration;
        }

        // Expects a '=' token following the variable identifier
        this.expect(TokenType.Equal, "Expected '=' after variable declaration")
        
        // Sets declaring mode to true
        this.isDeclaring = true;
        // True if the following token has a value of '-'
        const negative = this.at().value == "-"
        
        const declaration = {
            kind: "VariableDeclaration",
            assignee,
            constant: isConstant,
            value: this.parse_statement(),
            line: this.currentLine,
            column: this.currentColumn,
            reactive,
            negative,
        } as VariableDeclaration;

        // Sets declaring mode to false
        this.isDeclaring = false;

        return declaration;
    }

    // Returns an if statement
    private parse_if_statement(): Statement {
        // Eats the 'if' token
        this.eat();

        // Expects a '(' token after the if keyword
        this.expect(TokenType.OpenParen, "Expected '(' following 'if' keyword");

        // Parses the if condition
        const condition = this.parse_expression();        
        // Throws an error if the condition is not found
        if(!condition) throw this.throwError(new SyntaxError("Expected a valid condition for the 'if' statement"));
        
        // Expects a ')' token after the if condition
        this.expect(TokenType.CloseParen, "Expected ')' following 'if' condition");

        // Declares the 'than' body list
        const thenBody: Statement[] = [];
        if (this.at().type == TokenType.OpenBrace) {
            // Eat the '{' token
            this.eat();
            // While the body is not closed
            while (this.at().type != TokenType.CloseBrace) {
                // Skips all the empty lines
                while (this.isEndOfLine()) this.skipNewLine();
                
                // If it's at the end of the body, breaks out of the loop
                if (this.at().type == TokenType.CloseBrace) break;
                
                // Pushes the parsed statement to the 'if' body's list
                thenBody.push(this.parse_statement());
            }
            // Expects a '}' token after the if body
            this.expect(TokenType.CloseBrace, "Expected '}' following 'if' body");
        }
        // If it's an in-line statement
        else if (this.at().type == TokenType.ArrowOperator) {
            // Eat the '=>' token
            this.eat();
            // Pushes the parsed statement to the 'if' body's list
            thenBody.push(this.parse_statement());  
        }
        // Throws an error if the 'if' condition isn't followed by a '{' or a '=>' token
        else this.throwError(new SyntaxError("Expected '{' of '=>' following 'if' body"))
        
        // Declares the 'else' body list
        const elseBody: Statement[] | undefined = [];
        if (this.at().type == TokenType.Else) {
            // Eat the 'else' token
            this.eat();
            
            // If the next token is of type 'if' add a new if statement to the else body 
            if (this.at().type == TokenType.If) elseBody.push(this.parse_if_statement());
            else {
                if (this.at().type == TokenType.OpenBrace) {
                    // Eat the '{' token
                    this.eat();
                    // While the body is not closed
                    while (this.at().type != TokenType.CloseBrace) {
                        // Skips all the empty lines
                        while (this.isEndOfLine()) this.skipNewLine();
                        
                        // If it's at the end of the body, breaks out of the loop
                        if (this.at().type == TokenType.CloseBrace) break;
                        
                        // Pushes the parsed statement to the 'else' body's list
                        elseBody.push(this.parse_statement());
                    }
                    // Expects a '}' token after the else body
                    this.expect(TokenType.CloseBrace, "Expected '}' following 'else' body");
                } else if (this.at().type == TokenType.ArrowOperator) {
                    // Eat the '=>' token
                    this.eat();
                    // Pushes the parsed statement to the 'else' body's list
                    elseBody.push(this.parse_statement());           
                }
                // Throws an error if the 'else' condition isn't followed by a '{' or a '=>' token
                else this.throwError(new SyntaxError("Expected '{' of '=>' following 'else' body"))
            }
        }
        
        return {
            kind: "IfStatement",
            condition,
            then: thenBody,
            else: elseBody,
            line: this.currentLine,
            column: this.currentColumn,
        } as IfStatement;
    }
    
    // Returns a for statement
    private parse_for_statement(): Statement {
        this.eat(); // Go past for keyword
        
        this.expect(TokenType.OpenParen, "Expected '(' following for keyword");
        
        let assignment: Statement;
        let declared: boolean;
        if (this.at().type == TokenType.Let) {
            assignment = this.parse_variable_declaration();
            declared = true;
        } else if (this.at().type == TokenType.Const) {
            this.eat();
            throw this.throwError(new SyntaxError(`Cannot reassign constant variable '${this.at().value}' inside a for loop.`));
        } else {
            assignment = this.parse_assignment_expression();
            declared = false;
        }
        
        this.expect(TokenType.Semicolon, "Expected ';' following for assignment");
        const condition = this.parse_expression();
        
        this.expect(TokenType.Semicolon, "Expected ';' following for condition");
        
        const increment = this.parse_expression();
        
        this.expect(TokenType.CloseParen, "Expected ')' following for compound assignment");
        
        const body: Statement[] = [];
        if (this.at().type == TokenType.OpenBrace) {
            this.eat(); // Go past {
                while (this.at().type != TokenType.CloseBrace) {
                    while (this.isEndOfLine()) this.skipNewLine();
                    
                    if (this.at().type == TokenType.CloseBrace) break;
                    
                    body.push(this.parse_statement());
                }
                this.expect(TokenType.CloseBrace, "Expected '}' at the end of for block");
        } else if (this.at().type == TokenType.ArrowOperator) {
            this.eat(); // Go past =>
            body.push(this.parse_statement());  
        } else this.throwError(new SyntaxError("Expected '{' of '=>' at the end of for statement"))
        
        return {
            kind: "ForStatement",
            assignment,
        declared,
        condition,
        increment,
        body,
        line: this.currentLine,
        column: this.currentColumn,
        } as ForStatement;
    }

    // Returns a foreach statement
    private parse_foreach_statement(): Statement {
        this.eat(); // Go past foreach keyword

        this.expect(TokenType.OpenParen, "Expected '(' following for keyword");

        let declared: boolean = false;
        if (this.at().type == TokenType.Let) {
            this.eat();
            declared = true;
        } else if (this.at().type == TokenType.Const) this.throwError(new SyntaxError(`Cannot reassign constant variable '${this.at().value}' inside a foreach loop.`));

        const element = this.parse_statement();

        this.expect(TokenType.In, "Expected 'in' following foreach assignment");

        const list = this.parse_statement();

        this.expect(TokenType.CloseParen, "Expected ')' following list identifier");

        const body: Statement[] = [];
        if (this.at().type == TokenType.OpenBrace) {
            this.eat(); // Go past {
            while (this.at().type != TokenType.CloseBrace) {
                while (this.isEndOfLine()) this.skipNewLine();

                if (this.at().type == TokenType.CloseBrace) break;

                body.push(this.parse_statement());
            }

            this.expect(TokenType.CloseBrace, "Expected '}' at the end of for block");
        } else if (this.at().type == TokenType.ArrowOperator) {
            this.eat(); // Go past =>
            body.push(this.parse_statement());            
        } else this.throwError(new SyntaxError("Expected '{' of '=>' at the end of foreach statement"))

        return {
            kind: "ForEachStatement",
            element,
            body,
            list,
            declared,
            line: this.currentLine,
            column: this.currentColumn,
        } as ForEachStatement;
    }

    // Returns a while statement
    private parse_while_statement(): Statement {
        this.eat(); // Go past for keyword
        this.expect(TokenType.OpenParen, "Expected '(' following for keyword");

        const condition = this.parse_expression();

        this.expect(TokenType.CloseParen, "Expected ')' following for compound assignment");

        const body: Statement[] = [];
        if (this.at().type == TokenType.OpenBrace) {
            this.eat(); // Go past {
            while (this.at().type != TokenType.CloseBrace) {
                while (this.isEndOfLine()) this.skipNewLine();

                if (this.at().type == TokenType.CloseBrace) break;

                body.push(this.parse_statement());
            }

            this.expect(TokenType.CloseBrace, "Expected '}' at the end of for block");
        } else if (this.at().type == TokenType.ArrowOperator) {
            this.eat(); // Go past =>
            body.push(this.parse_statement());            
        } else this.throwError(new SyntaxError("Expected '{' of '=>' at the end of while statement"))

        return {
            kind: "WhileStatement",
            condition,
            body,
            line: this.currentLine,
            column: this.currentColumn,
        } as WhileStatement;
    }

    // Returns an import statement
    private async parse_import_statement() {
        this.eat(); // Go past import keyword
        const path = this.expect(TokenType.String, "Expected 'string' following import keyword").value;

        const library_objects = await compileLibrary(path);
        for(const obj of library_objects) this.env.declareVar(obj.name, obj.object, true);
    }

    // Order Of Operations (Expressions)
    // ===================
    // Compound Assignment Expression
    // Assignment Expression
    // Logical AND Expression
    // Logical OR Expression
    // Nullish Coalescing Expression
    // Ternary Expression
    // Equality Expression
    // Object Expression
    // Additive Expression
    // Multiplicative Expression
    // Exponential Expression
    // Call Member Expression
    // Member Expression
    // Primary Expression

    // Returns a parsed expression
    private parse_expression(): Expression {
        return this.parse_compound_assignment_expression();
    }

    // Returns a compound assignment expression
    private parse_compound_assignment_expression(): Expression {
        const left = this.parse_assignment_expression();

        if (this.at().type == TokenType.CompoundOperator) {
            const operator = this.eat().value;

            let value;
            if (operator == "++" || operator == "--") value = { kind: "NumericLiteral", value: 1 } as NumericLiteral;
            else value = this.parse_assignment_expression();

            return {
                kind: "CompoundAssignmentExpression",
                assignee: left,
                value,
                operator,
                line: this.currentLine,
                column: this.currentColumn,
            } as CompoundAssignmentExpression;
        }

        return left;
    }
    
    // Returns an assignment expression
    private parse_assignment_expression(): Expression {
        const left = this.parse_logical_or_expression();
        
        if (this.at().type == TokenType.Equal) {
            this.eat();
            
            const value = this.parse_statement();
            
            return {
                kind: "AssignmentExpression",
                assignee: left,
                value,
                line: this.currentLine,
                column: this.currentColumn,
            } as AssignmentExpression;
        }
        
        return left;
    }
    
    // Returns a logical OR expression
    private parse_logical_or_expression(): Expression {
        let left = this.parse_logical_and_expression();
        
        if (this.at().type == TokenType.LogicOperator && this.at().value == "||") {
            const operator = this.eat().value;
            const right = this.parse_logical_and_expression();
            
            left = {
                kind: "LogicalExpression",
                left,
                right,
                operator,
                line: this.currentLine,
                column: this.currentColumn,
            } as LogicalExpression;
        }
        
        return left
    }
    
    // Returns a logical AND expression
    private parse_logical_and_expression(): Expression {
        let left = this.parse_logical_not_expression();
        
        if (this.at().type == TokenType.LogicOperator && this.at().value == "&&") {
            const operator = this.eat().value;
            const right = this.parse_logical_not_expression();
            
            left = {
                kind: "LogicalExpression",
                left,
                right,
                operator,
                line: this.currentLine,
                column: this.currentColumn,
            } as LogicalExpression;
        }
        
        return left
    }
    
    // Returns a logical NOT expression
    private parse_logical_not_expression(): Expression {
        if (this.at().type == TokenType.LogicOperator && this.at().value == "!") {
            const operator = this.eat().value;
            const right = this.parse_nullish_coalescing_expression();

            return {
                kind: "LogicalExpression",
                left: {"kind": "BooleanLiteral", "value": true},
                right: right,
                operator,
                line: this.currentLine,
                column: this.currentColumn,
            } as LogicalExpression;
        }

        return this.parse_nullish_coalescing_expression()
    }

    // Returns a nullish coalescing expression
    private parse_nullish_coalescing_expression(): Expression {        
        const left = this.parse_ternary_expression();

        if (this.at().type == TokenType.BinaryOperator && this.at().value == "??")
        {
            this.eat() // Go past ??
            const right = this.parse_equality_expression()

            return {
                kind: "BinaryExpression",
                operator: "??",
                left,
                right,
                line: this.currentLine,
                column: this.currentColumn,
            } as BinaryExpression
        }

        return left;
    }
        
    // Returns a ternary expression
    private parse_ternary_expression(): Expression {        
        const condition = this.parse_equality_expression();

        if (this.at().type == TokenType.QuestionMark)
        {
            this.eat() // Go past ?
            const left = this.parse_equality_expression()

            this.expect(TokenType.Colon, "Expected ':' between ternary expressions values")

            const right = this.parse_equality_expression()

            return {
                kind: "TernaryExpression",
                condition,
                left,
                right,
                line: this.currentLine,
                column: this.currentColumn,
            } as TernaryExpression
        }

        return condition;
    }

    // Returns an equality expression
    private parse_equality_expression(): Expression {
        let left = this.parse_object_expression();

        while (this.at().type == TokenType.EqualEqual || this.at().type == TokenType.NotEqual || this.at().type == TokenType.LessThanOrEqual || this.at().type == TokenType.GreaterThenOrEqual || this.at().type == TokenType.LessThan || this.at().type == TokenType.GreaterThan) {
            const operator = this.eat().value;
            const right = this.parse_object_expression();

            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
                line: this.currentLine,
                column: this.currentColumn,
            } as BinaryExpression;
        }

        return left;
    }

    // Returns an object expression
    private parse_object_expression(): Expression {
        if (this.at().type != TokenType.OpenBrace) return this.parse_list_expression();

        this.eat(); // Go past brace
        const properties = new Array<Property>();

        while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
            while (this.isEndOfLine()) this.skipNewLine();

            let key = "";
            if (this.at().type == TokenType.Identifier || this.at().type == TokenType.String) key = this.eat().value;
            else this.throwError(new ParserError("Object key expected", TokenType.Identifier));
            if (this.at().type == TokenType.Comma) {
                this.eat(); // Go past comma
                properties.push({ key, kind: "Property" });
                continue;
            } else if (this.at().type == TokenType.CloseBrace) {
                properties.push({ key, kind: "Property" });
                continue;
            }

            this.expect(TokenType.Colon, "Missing colon following key in Object");
            const value = this.parse_expression();

            properties.push({ key, kind: "Property", value: value });
            while (this.isEndOfLine()) this.skipNewLine();
            if (this.at().type != TokenType.CloseBrace) {
                this.expect(TokenType.Comma, "Expected comma or closing brace following property");
            }
        }

        this.expect(TokenType.CloseBrace, "Object missing closing brace");
        return {
            kind: "ObjectLiteral",
            properties: properties,
            line: this.currentLine,
            column: this.currentColumn,
        } as ObjectLiteral;
    }

    // Returns a list expression
    private parse_list_expression(): Expression {
        if (this.at().type != TokenType.OpenBracket) return this.parse_additive_expression();

        this.eat(); // Go past [

        const values: Expression[] = [];
        while (this.not_eof() && this.at().type != TokenType.CloseBracket) {
            const value = this.parse_expression();

            if (this.at().type == TokenType.Comma) {
                this.eat(); // Go past , or ]
                values.push(value);
                continue;
            } else if (this.at().type == TokenType.CloseBracket) {
                values.push(value);
            }

            if (this.at().type != TokenType.CloseBracket) {
                this.expect(TokenType.Comma, "Expected ']' at the end of a list");
            }
        }

        this.expect(TokenType.CloseBracket, "Expected ']' after list declaration");
        return {
            kind: "ListLiteral",
            values: values,
            line: this.currentLine,
            column: this.currentColumn,
        } as ListLiteral;
    }

    // Returns an additive expression
    private parse_additive_expression(): Expression {
        let left = this.parse_multiplicative_expression();

        while (this.at().value == "+" || this.at().value == "-") {
            const operator = this.eat().value;
            const right = this.parse_multiplicative_expression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
                line: this.currentLine,
                column: this.currentColumn,
            } as BinaryExpression;
        }

        return left;
    }

    // Returns a multiplicative expression
    private parse_multiplicative_expression(): Expression {
        let left = this.parse_exponential_expression();

        while (this.at().value == "*" || this.at().value == "/" || this.at().value == "%" || this.at().value == "//") {
            const operator = this.eat().value;
            const right = this.parse_exponential_expression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
                line: this.currentLine,
                column: this.currentColumn,
            } as BinaryExpression;
        }

        return left;
    }

    // Returns an exponential expression
    private parse_exponential_expression(): Expression {
        let left = this.parse_call_member_expression();

        while (this.at().value == "^") {
            const operator = this.eat().value;

            const negative = this.at().value == "-" 
            if(negative) this.eat()

            const right = this.parse_call_member_expression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                negative,
                operator,
                line: this.currentLine,
                column: this.currentColumn,
            } as BinaryExpression;
        }

        return left;
    }

    // Returns a call member expression
    private parse_call_member_expression(): Expression {
        const member = this.parse_member_expression();

        if (this.at().type == TokenType.OpenParen) return this.parse_call_expression(member);

        return member;
    }

    // Returns a call expression
    private parse_call_expression(caller: Expression): Expression {
        let call_expression: Expression = {
            kind: "CallExpression",
            caller,
            args: this.parse_args(),
            line: this.currentLine,
            column: this.currentColumn,
        } as CallExpression;

        if (this.at().type == TokenType.OpenParen) call_expression = this.parse_call_expression(call_expression);
        return call_expression;
    }

    // Returns a list of arguments for the call expression
    private parse_args(): Expression[] {
        this.expect(TokenType.OpenParen, "Expected open parenthesis");
        const args = this.at().type == TokenType.CloseParen ? [] : this.parse_args_list();

        this.expect(TokenType.CloseParen, "Missing closing parenthesis inside argument list");
        return args;
    }

    // Returns a list of arguments for the call expression
    private parse_args_list(): Expression[] {
        const args = [this.parse_statement()];

        while (this.at().type == TokenType.Comma && this.eat()) args.push(this.parse_statement());

        return args;
    }

    // Returns a member expression
    private parse_member_expression(): Expression {
        let object = this.parse_primary_expression();

        while (this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket) {
            const operator = this.eat();

            const computed = operator.type == TokenType.OpenBracket;
            const property = this.parse_primary_expression();

            if (computed) this.expect(TokenType.CloseBracket, "Missing closing bracket in computed value");
            else if (property.kind != "Identifier") this.throwError(new SyntaxError("Cannot use dot operator without an identifier on the right"))

            object = {
                kind: "MemberExpression",
                object,
                property,
                computed,
                line: this.currentLine,
                column: this.currentColumn,
            } as MemberExpression;
        }

        return object;
    }

    // Returns a primary expression
    private parse_primary_expression(): Expression {
        const token = this.at().type;

        switch (token) {
            case TokenType.Identifier:
                return {
                    kind: "Identifier",
                    symbol: this.eat().value,
                    line: this.currentLine,
                    column: this.currentColumn,
                } as Identifier;

            case TokenType.Number:
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(this.eat().value),
                    line: this.currentLine,
                    column: this.currentColumn,
                } as NumericLiteral;

            case TokenType.String: {
                return {
                    kind: "StringLiteral",
                    value: this.eat().value,
                    line: this.currentLine,
                    column: this.currentColumn,
                } as StringLiteral;
            }

            case TokenType.OpenParen: {
                this.eat(); // Go past parenthesis
                const value = this.parse_statement();
                this.expect(TokenType.CloseParen, "Unexpected token found inside parenthesized expression. Expected closing parenthesis"); // If the closing parenthesis is not found
                return value;
            }

            case TokenType.EOF:
                throw this.throwError(new RangeError("Parser unexpectedly reached the end of file"));

            default:
                throw this.throwError(new SyntaxError(`Unexpected token found during parsing: ${JSON.stringify(this.at().value)} (${TokenType[this.at().type]})`));
        }
    }
}

