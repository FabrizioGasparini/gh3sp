import { CallExpression, CompoundAssignmentExpression, ForStatement, IfStatement, StringLiteral, WhileStatement } from "./ast";
import { Statement, Program, Expression, BinaryExpression, NumericLiteral, Identifier, VariableDeclaration, AssignmentExpression, Property, ObjectLiteral, MemberExpression, FunctionDeclaration } from "./ast";
import { tokenize, Token, TokenType } from "./lexer";

export default class Parser {
    private tokens: Token[] = [];
    private currentLine: number = 0;

    private not_eof(): boolean {
        return this.tokens[0].type != TokenType.EOF;
    }

    private at() {
        return this.tokens[0] as Token;
    }

    private eat() {
        const prev = this.tokens.shift() as Token;
        return prev;
    }

    private expect(type: TokenType, err: string) {
        const prev = this.tokens.shift() as Token;

        if (!prev || prev.type != type) {
            throw `Parser Error:\n ${err}. ${JSON.stringify(prev)}. Expecting: ${type}`;
        }

        return prev;
    }

    public produceAST(sourceCode: string): Program {
        this.tokens = tokenize(sourceCode);

        const program: Program = {
            kind: "Program",
            body: [],
        };

        // Parse until END OF FILE
        while (this.not_eof()) {
            program.body.push(this.parse_statement());
        }

        return program;
    }

    private parse_statement(): Statement {
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

            default:
                return this.parse_expression();
        }
    }

    private parse_function_declaration(): Statement {
        this.eat(); // eat fn keyword
        const name = this.expect(TokenType.Identifier, "Expected function name following fn keyword").value;

        const args = this.parse_args();
        const parameters: string[] = [];
        for (const arg of args) {
            if (arg.kind != "Identifier") throw "Inside function declaration expected parameters to be of type string." + arg;

            parameters.push((arg as Identifier).symbol);
        }

        this.expect(TokenType.OpenBrace, "Expected function body following declaration.");

        const body: Statement[] = [];
        while (this.not_eof() && this.at().type != TokenType.CloseBrace) body.push(this.parse_statement());

        this.expect(TokenType.CloseBrace, "Closing brace expected at the end of function declaration");
        const fn = {
            kind: "FunctionDeclaration",
            name,
            parameters,
            body,
        } as FunctionDeclaration;

        return fn;
    }

    private parse_variable_declaration(): Statement {
        const isConstant = this.eat().type == TokenType.Const;
        const identifier = this.expect(TokenType.Identifier, "Expected identifier name following let/const keywords").value;

        if (this.at().type == TokenType.Semicolon || this.at().type == TokenType.EOF) {
            this.eat();
            if (isConstant) throw `Must assign value to constant expression '${identifier}'. No value provided.`;

            return {
                kind: "VariableDeclaration",
                identifier,
                constant: false,
            } as VariableDeclaration;
        }

        this.expect(TokenType.Equal, "Expected equals token following identifier in variable declaration.");

        const declaration = {
            kind: "VariableDeclaration",
            identifier,
            constant: isConstant,
            value: this.parse_expression(),
        } as VariableDeclaration;

        return declaration;
    }

    private parse_expression(): Expression {
        return this.parse_compound_assignment_expression();
    }

    private parse_if_statement(): Expression {
        this.eat(); // Go past 'if' token

        this.expect(TokenType.OpenParen, "Expected '(' following if keyword");

        const condition = this.parse_expression();
        this.expect(TokenType.CloseParen, "Expected ')' following if condition");

        const thenBranch: Statement[] = [];
        if (this.at().type == TokenType.OpenBrace) {
            this.eat();

            while (this.at().type != TokenType.CloseBrace) thenBranch.push(this.parse_statement());

            this.expect(TokenType.CloseBrace, "Expected '}' at the end of if block");
        } else {
            thenBranch.push(this.parse_statement());

            if (this.at().type != TokenType.Else) this.expect(TokenType.Semicolon, "Expected ';' at the end of if statement");
        }

        const elseBranch: Statement[] | undefined = [];
        if (this.at().type == TokenType.Else) {
            this.eat();

            if (this.at().type == TokenType.If) elseBranch.push(this.parse_if_statement());
            else {
                if (this.at().type == TokenType.OpenBrace) {
                    this.eat();

                    while (this.at().type != TokenType.CloseBrace) elseBranch.push(this.parse_statement());

                    this.expect(TokenType.CloseBrace, "Expected '}' at the end of else block");
                } else {
                    elseBranch.push(this.parse_statement());

                    if (this.at().type != TokenType.Else) this.expect(TokenType.Semicolon, "Expected ';' at the end of else statement");
                }
            }
        }

        return {
            kind: "IfStatement",
            condition,
            then: thenBranch,
            else: elseBranch,
        } as IfStatement;
    }

    private parse_for_statement(): Expression {
        this.eat(); // Go past for keyword

        this.expect(TokenType.OpenParen, "Expected '(' following for keyword");

        let assignment: Statement;
        let declared: boolean;
        if (this.at().type == TokenType.Let) {
            assignment = this.parse_variable_declaration();
            declared = true;
        } else if (this.at().type == TokenType.Const) {
            this.eat();
            throw `Invalid variable usage: Cannot reassign a constant variable '${this.at().value}' inside a for loop.`;
        } else {
            assignment = this.parse_assignment_expression();
            declared = false;
        }

        this.expect(TokenType.Semicolon, "Expected ';' following for assignment");
        const condition = this.parse_expression();

        this.expect(TokenType.Semicolon, "Expected ';' following for condition");

        const compoundAssignment = this.parse_compound_assignment_expression();

        this.expect(TokenType.CloseParen, "Expected ')' following for compound assignment");

        const body: Statement[] = [];
        if (this.at().type == TokenType.OpenBrace) {
            this.eat(); // Go past {
            while (this.at().type != TokenType.CloseBrace) body.push(this.parse_statement());

            this.expect(TokenType.CloseBrace, "Expected '}' at the end of for block");
        } else {
            body.push(this.parse_statement());
            this.expect(TokenType.Semicolon, "Expected ';' at the end of for declaration");
        }

        return {
            kind: "ForStatement",
            assignment,
            declared,
            condition,
            compoundAssignment,
            body,
        } as ForStatement;
    }

    private parse_while_statement(): Expression {
        this.eat(); // Go past for keyword

        this.expect(TokenType.OpenParen, "Expected '(' following for keyword");

        const condition = this.parse_expression();

        this.expect(TokenType.CloseParen, "Expected ')' following for compound assignment");

        const body: Statement[] = [];
        if (this.at().type == TokenType.OpenBrace) {
            this.eat(); // Go past {
            while (this.at().type != TokenType.CloseBrace) body.push(this.parse_statement());

            this.expect(TokenType.CloseBrace, "Expected '}' at the end of for block");
        } else {
            body.push(this.parse_statement());
            this.expect(TokenType.Semicolon, "Expected ';' at the end of while declaration");
        }

        return {
            kind: "WhileStatement",
            condition,
            body,
        } as WhileStatement;
    }

    // Order Of Operations (Expressions)
    // ===================
    // Assignment Expression
    // Equality Expression
    // Object Expression
    // Additive Expression
    // Multiplicative Expression
    // Exponential Expression
    // Call Member Expression
    // Member Expression
    // Primary Expression

    private parse_compound_assignment_expression(): Expression {
        const left = this.parse_assignment_expression();

        if (this.at().type == TokenType.BinaryOperator && this.at().value.includes("=")) {
            const operator = this.eat().value;

            const value = this.parse_assignment_expression();

            return { kind: "CompoundAssignmentExpression", assigne: left, value, operator } as CompoundAssignmentExpression;
        }

        return left;
    }

    private parse_assignment_expression(): Expression {
        const left = this.parse_equality_expression();

        if (this.at().type == TokenType.Equal) {
            this.eat();

            const value = this.parse_assignment_expression();

            return { kind: "AssignmentExpression", assigne: left, value } as AssignmentExpression;
        }

        return left;
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
            } as BinaryExpression;
        }

        return left;
    }

    private parse_object_expression(): Expression {
        if (this.at().type != TokenType.OpenBrace) return this.parse_additive_expression();

        this.eat(); // Go past brace
        const properties = new Array<Property>();

        while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
            const key = this.expect(TokenType.Identifier, "Object key expected.").value;
            if (this.at().type == TokenType.Comma) {
                this.eat(); // Go past comma
                properties.push({ key, kind: "Property" });
                continue;
            } else if (this.at().type == TokenType.CloseBrace) {
                properties.push({ key, kind: "Property" });
                continue;
            }

            this.expect(TokenType.Colon, "Missing colon following key in Object.");
            const value = this.parse_expression();

            properties.push({ key, kind: "Property", value: value });
            if (this.at().type != TokenType.CloseBrace) {
                this.expect(TokenType.Comma, "Expected comma or closing brace following property.");
            }
        }

        this.expect(TokenType.CloseBrace, "Object missing closing brace.");
        return { kind: "ObjectLiteral", properties: properties } as ObjectLiteral;
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
            } as BinaryExpression;
        }

        return left;
    }

    private parse_multiplicative_expression(): Expression {
        let left = this.parse_exponential_expression();

        while (this.at().value == "*" || this.at().value == "/" || this.at().value == "%") {
            const operator = this.eat().value;
            const right = this.parse_exponential_expression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
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
        } as CallExpression;

        if (this.at().type == TokenType.OpenParen) call_expression = this.parse_call_expression(call_expression);

        return call_expression;
    }

    private parse_args(): Expression[] {
        this.expect(TokenType.OpenParen, "Expected open parenthesis.");
        const args = this.at().type == TokenType.CloseParen ? [] : this.parse_args_list();

        this.expect(TokenType.CloseParen, "Missing closing parenthesis inside argument list.");
        return args;
    }

    private parse_args_list(): Expression[] {
        const args = [this.parse_expression()];

        while (this.at().type == TokenType.Comma && this.eat()) args.push(this.parse_expression());

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

                if (property.kind != "Identifier") throw "Cannot use dot operator without an identifier on the right.";
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
                } as Identifier;

            case TokenType.Number:
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(this.eat().value),
                } as NumericLiteral;

            case TokenType.String: {
                return {
                    kind: "StringLiteral",
                    value: this.eat().value,
                } as StringLiteral;
            }

            case TokenType.OpenParen: {
                this.eat(); // Go past parenthesis
                const value = this.parse_expression();
                this.expect(TokenType.CloseParen, "Unexpected token found inside parenthesized expression. Expected closing parenthesis."); // If the closing parenthesis is not found
                return value;
            }

            default:
                throw `Unexpected token found during parsing! ${JSON.stringify(this.at())}`;
        }
    }
}