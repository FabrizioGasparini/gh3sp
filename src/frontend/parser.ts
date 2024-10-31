import type Environment from "../runtime/environments.ts";
import { evaluate } from "../runtime/interpreter.ts";
import { compileLibrary } from "../runtime/libraries.ts";
import { handleError, ParserError } from "../utils/errors_handler.ts";
import { CallExpression, CompoundAssignmentExpression, ForEachStatement, ForStatement, IfStatement, ListLiteral, StringLiteral, WhileStatement, type LogicalExpression, type TernaryExpression } from "./ast.ts";
import { Statement, Program, Expression, BinaryExpression, NumericLiteral, Identifier, VariableDeclaration, AssignmentExpression, Property, ObjectLiteral, MemberExpression, FunctionDeclaration } from "./ast.ts";
import { tokenize, Token, TokenType } from "./lexer.ts";

export default class Parser {
    private tokens: Token[] = [];
    private isDeclaring: boolean = false;
    private currentLine: number = 1;
    private currentColumn: number = 1;

    private env: Environment;

    constructor(env: Environment) {
        this.env = env;
    }

    private not_eof(): boolean {
        return this.tokens[0].type != TokenType.EOF;
    }

    private at() {
        while(this.tokens[0].type == TokenType.NewLine) this.skipNewLine()
        return this.tokens[0] as Token;
    }

    private eat() {
        const prev = this.tokens.shift() as Token;
        this.currentColumn += prev.value.length;
        return prev;
    }

    private expect(type: TokenType, err: string) {
        const prev = this.tokens.shift() as Token;

        if (prev.type == TokenType.NewLine) this.skipNewLine();

        if (!prev || prev.type != type) this.throwError(new ParserError(err, type));

        this.currentColumn += prev.value.length;

        return prev;
    }

    private isEndOfLine(): boolean {
        return this.at().type == TokenType.NewLine
    }

    public async produceAST(sourceCode: string) {
        this.tokens = tokenize(sourceCode);

        while (this.at().type == TokenType.Import) {
            await this.parse_import_statement()
            while (this.isEndOfLine()) this.skipNewLine();
        }

        return evaluate(this.parse_program(), this.env)
    }

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

    private throwError(error: Error) {
        handleError(error, this.currentLine, this.currentColumn);
    }

    private skipNewLine() {
        this.eat();
        this.currentLine++;
        this.currentColumn = 1;
    }

    private parse_statement(): Statement {
        if (this.isEndOfLine()) {
            this.skipNewLine();
            return this.parse_statement();
        }

        switch (this.at().type) {
            case TokenType.Let:
                return this.parse_variable_declaration();
            case TokenType.Const:
                return this.parse_variable_declaration();

            case TokenType.Fn:
                return this.parse_function_declaration();

            case TokenType.If:
                return this.parse_if_statement();

            case TokenType.For:
                return this.parse_for_statement();
            case TokenType.While:
                return this.parse_while_statement();
            case TokenType.ForEach:
                return this.parse_foreach_statement();

            case TokenType.Import:
                throw this.throwError(new ParserError("Libraries can only be imported at the start of the program."))

            default:
                return this.parse_expression();
        }
    }

    private parse_function_declaration(): Statement {
        this.eat(); // eat fn keyword
        let name = undefined;
        if (this.at().type == TokenType.Identifier)
            if (this.isDeclaring) this.throwError(new SyntaxError("Cannot declare a named function during variable declaration"));
            else name = this.eat().value;

        const args = this.parse_args();
        const parameters: string[] = [];
        for (const arg of args) {
            if (arg.kind != "Identifier") this.throwError(new SyntaxError("Expected string parameters inside of function declaration. " + arg));

            parameters.push((arg as Identifier).symbol);
        }

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
        } else this.throwError(new SyntaxError("Expected '{' of '=>' after function arguments declaration"))

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

    private parse_variable_declaration(): Statement {
        const isConstant = this.eat().type == TokenType.Const;
        const identifier = this.expect(TokenType.Identifier, "Expected identifier name following let/const keywords").value;

        const assignee = { kind: "Identifier", symbol: identifier, line: this.currentLine, column: this.currentColumn } as Identifier;

        if (this.at().type == TokenType.Semicolon || this.at().type == TokenType.EOF) {
            this.eat();
            if (isConstant) this.throwError(new SyntaxError(`Must assign value to constant expression '${assignee}'. No value provided.`));

            return {
                kind: "VariableDeclaration",
                assignee,
                constant: false,
                line: this.currentLine,
                column: this.currentColumn,
            } as VariableDeclaration;
        }

        this.expect(TokenType.Equal, "Expected equals token following identifier in variable declaration");

        this.isDeclaring = true;

        const declaration = {
            kind: "VariableDeclaration",
            assignee,
            constant: isConstant,
            value: this.parse_statement(),
            line: this.currentLine,
            column: this.currentColumn,
        } as VariableDeclaration;

        this.isDeclaring = false;

        return declaration;
    }

    private parse_if_statement(): Statement {
        this.eat(); // Go past 'if' token

        this.expect(TokenType.OpenParen, "Expected '(' following if keyword");

        const condition = this.parse_expression();        
        if(!condition) throw this.throwError(new SyntaxError("Expected condition inside if statement"));
        
        this.expect(TokenType.CloseParen, "Expected ')' following if condition");

        const thenBranch: Statement[] = [];
        if (this.at().type == TokenType.OpenBrace) {
            this.expect(TokenType.OpenBrace, "Expected '{' following if condition");

            while (this.at().type != TokenType.CloseBrace) thenBranch.push(this.parse_statement());

            this.expect(TokenType.CloseBrace, "Expected '}' at the end of if block");
        } else if (this.at().type == TokenType.ArrowOperator) {
            this.eat(); // Go past =>
            thenBranch.push(this.parse_statement());
        } else this.throwError(new SyntaxError("Expected '{' of '=>' at the end of if statement"))
        
        const elseBranch: Statement[] | undefined = [];
        if (this.at().type == TokenType.Else) {
            this.eat();
            
            if (this.at().type == TokenType.If) elseBranch.push(this.parse_if_statement());
            else {
                if (this.at().type == TokenType.OpenBrace) {
                    this.expect(TokenType.OpenBrace, "Expected '{' following if condition");
                    
                    while (this.at().type != TokenType.CloseBrace) elseBranch.push(this.parse_statement());
                    
                    this.expect(TokenType.CloseBrace, "Expected '}' at the end of else block");
                } else if (this.at().type == TokenType.ArrowOperator) {
                    this.eat(); // Go past =>
                    elseBranch.push(this.parse_statement());            
                } else this.throwError(new SyntaxError("Expected '{' of '=>' at the end of else statement"))
            }
        }
        
        return {
            kind: "IfStatement",
            condition,
            then: thenBranch,
            else: elseBranch,
            line: this.currentLine,
            column: this.currentColumn,
        } as IfStatement;
    }
    
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

    
    private parse_expression(): Expression {
        return this.parse_compound_assignment_expression();
    }

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

    private parse_exponential_expression(): Expression {
        let left = this.parse_call_member_expression();

        while (this.at().value == "^") {
            const operator = this.eat().value;
            const right = this.parse_call_member_expression();
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

    private parse_call_member_expression(): Expression {
        const member = this.parse_member_expression();

        if (this.at().type == TokenType.OpenParen) return this.parse_call_expression(member);

        return member;
    }

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

    private parse_args(): Expression[] {
        this.expect(TokenType.OpenParen, "Expected open parenthesis");
        const args = this.at().type == TokenType.CloseParen ? [] : this.parse_args_list();

        this.expect(TokenType.CloseParen, "Missing closing parenthesis inside argument list");
        return args;
    }

    private parse_args_list(): Expression[] {
        const args = [this.parse_statement()];

        while (this.at().type == TokenType.Comma && this.eat()) args.push(this.parse_statement());

        return args;
    }

    private parse_member_expression(): Expression {
        let object = this.parse_primary_expression();

        while (this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket) {
            const operator = this.eat();

            let property: Expression;
            let computed: boolean;

            if (operator.type == TokenType.Dot) {
                computed = false;
                property = this.parse_primary_expression();

                if (property.kind != "Identifier") this.throwError(new SyntaxError("Cannot use dot operator without an identifier on the right"));
            } else {
                computed = true;
                property = this.parse_expression();
                this.expect(TokenType.CloseBracket, "Missing closing bracket in computed value");
            }

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

