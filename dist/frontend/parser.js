"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lexer_1 = require("./lexer");
class Parser {
    constructor() {
        this.tokens = [];
        this.currentLine = 0;
    }
    not_eof() {
        return this.tokens[0].type != lexer_1.TokenType.EOF;
    }
    at() {
        return this.tokens[0];
    }
    eat() {
        const prev = this.tokens.shift();
        return prev;
    }
    expect(type, err) {
        const prev = this.tokens.shift();
        if (!prev || prev.type != type) {
            throw `Parser Error:\n ${err}. ${JSON.stringify(prev)}. Expecting: ${type}`;
        }
        return prev;
    }
    produceAST(sourceCode) {
        this.tokens = (0, lexer_1.tokenize)(sourceCode);
        const program = {
            kind: "Program",
            body: [],
        };
        // Parse until END OF FILE
        while (this.not_eof()) {
            program.body.push(this.parse_statement());
        }
        return program;
    }
    parse_statement() {
        switch (this.at().type) {
            case lexer_1.TokenType.Let:
                return this.parse_variable_declaration();
            case lexer_1.TokenType.Const:
                return this.parse_variable_declaration();
            case lexer_1.TokenType.Fn:
                return this.parse_function_declaration();
            case lexer_1.TokenType.If:
                return this.parse_if_statement();
            case lexer_1.TokenType.For:
                return this.parse_for_statement();
            case lexer_1.TokenType.While:
                return this.parse_while_statement();
            default:
                return this.parse_expression();
        }
    }
    parse_function_declaration() {
        this.eat(); // eat fn keyword
        const name = this.expect(lexer_1.TokenType.Identifier, "Expected function name following fn keyword").value;
        const args = this.parse_args();
        const parameters = [];
        for (const arg of args) {
            if (arg.kind != "Identifier")
                throw "Inside function declaration expected parameters to be of type string." + arg;
            parameters.push(arg.symbol);
        }
        this.expect(lexer_1.TokenType.OpenBrace, "Expected function body following declaration.");
        const body = [];
        while (this.not_eof() && this.at().type != lexer_1.TokenType.CloseBrace)
            body.push(this.parse_statement());
        this.expect(lexer_1.TokenType.CloseBrace, "Closing brace expected at the end of function declaration");
        const fn = {
            kind: "FunctionDeclaration",
            name,
            parameters,
            body,
        };
        return fn;
    }
    parse_variable_declaration() {
        const isConstant = this.eat().type == lexer_1.TokenType.Const;
        const identifier = this.expect(lexer_1.TokenType.Identifier, "Expected identifier name following let/const keywords").value;
        if (this.at().type == lexer_1.TokenType.Semicolon || this.at().type == lexer_1.TokenType.EOF) {
            this.eat();
            if (isConstant)
                throw `Must assign value to constant expression '${identifier}'. No value provided.`;
            return {
                kind: "VariableDeclaration",
                identifier,
                constant: false,
            };
        }
        this.expect(lexer_1.TokenType.Equal, "Expected equals token following identifier in variable declaration.");
        const declaration = {
            kind: "VariableDeclaration",
            identifier,
            constant: isConstant,
            value: this.parse_expression(),
        };
        return declaration;
    }
    parse_expression() {
        return this.parse_compound_assignment_expression();
    }
    parse_if_statement() {
        this.eat(); // Go past 'if' token
        this.expect(lexer_1.TokenType.OpenParen, "Expected '(' following if keyword");
        const condition = this.parse_expression();
        this.expect(lexer_1.TokenType.CloseParen, "Expected ')' following if condition");
        const thenBranch = [];
        if (this.at().type == lexer_1.TokenType.OpenBrace) {
            this.eat();
            while (this.at().type != lexer_1.TokenType.CloseBrace)
                thenBranch.push(this.parse_statement());
            this.expect(lexer_1.TokenType.CloseBrace, "Expected '}' at the end of if block");
        }
        else {
            thenBranch.push(this.parse_statement());
            if (this.at().type != lexer_1.TokenType.Else)
                this.expect(lexer_1.TokenType.Semicolon, "Expected ';' at the end of if statement");
        }
        const elseBranch = [];
        if (this.at().type == lexer_1.TokenType.Else) {
            this.eat();
            if (this.at().type == lexer_1.TokenType.If)
                elseBranch.push(this.parse_if_statement());
            else {
                if (this.at().type == lexer_1.TokenType.OpenBrace) {
                    this.eat();
                    while (this.at().type != lexer_1.TokenType.CloseBrace)
                        elseBranch.push(this.parse_statement());
                    this.expect(lexer_1.TokenType.CloseBrace, "Expected '}' at the end of else block");
                }
                else {
                    elseBranch.push(this.parse_statement());
                    if (this.at().type != lexer_1.TokenType.Else)
                        this.expect(lexer_1.TokenType.Semicolon, "Expected ';' at the end of else statement");
                }
            }
        }
        return {
            kind: "IfStatement",
            condition,
            then: thenBranch,
            else: elseBranch,
        };
    }
    parse_for_statement() {
        this.eat(); // Go past for keyword
        this.expect(lexer_1.TokenType.OpenParen, "Expected '(' following for keyword");
        let assignment;
        let declared;
        if (this.at().type == lexer_1.TokenType.Let) {
            assignment = this.parse_variable_declaration();
            declared = true;
        }
        else if (this.at().type == lexer_1.TokenType.Const) {
            this.eat();
            throw `Invalid variable usage: Cannot reassign a constant variable '${this.at().value}' inside a for loop.`;
        }
        else {
            assignment = this.parse_assignment_expression();
            declared = false;
        }
        this.expect(lexer_1.TokenType.Semicolon, "Expected ';' following for assignment");
        const condition = this.parse_expression();
        this.expect(lexer_1.TokenType.Semicolon, "Expected ';' following for condition");
        const compoundAssignment = this.parse_compound_assignment_expression();
        this.expect(lexer_1.TokenType.CloseParen, "Expected ')' following for compound assignment");
        const body = [];
        if (this.at().type == lexer_1.TokenType.OpenBrace) {
            this.eat(); // Go past {
            while (this.at().type != lexer_1.TokenType.CloseBrace)
                body.push(this.parse_statement());
            this.expect(lexer_1.TokenType.CloseBrace, "Expected '}' at the end of for block");
        }
        else {
            body.push(this.parse_statement());
            this.expect(lexer_1.TokenType.Semicolon, "Expected ';' at the end of for declaration");
        }
        return {
            kind: "ForStatement",
            assignment,
            declared,
            condition,
            compoundAssignment,
            body,
        };
    }
    parse_while_statement() {
        this.eat(); // Go past for keyword
        this.expect(lexer_1.TokenType.OpenParen, "Expected '(' following for keyword");
        const condition = this.parse_expression();
        this.expect(lexer_1.TokenType.CloseParen, "Expected ')' following for compound assignment");
        const body = [];
        if (this.at().type == lexer_1.TokenType.OpenBrace) {
            this.eat(); // Go past {
            while (this.at().type != lexer_1.TokenType.CloseBrace)
                body.push(this.parse_statement());
            this.expect(lexer_1.TokenType.CloseBrace, "Expected '}' at the end of for block");
        }
        else {
            body.push(this.parse_statement());
            this.expect(lexer_1.TokenType.Semicolon, "Expected ';' at the end of while declaration");
        }
        return {
            kind: "WhileStatement",
            condition,
            body,
        };
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
    parse_compound_assignment_expression() {
        const left = this.parse_assignment_expression();
        if (this.at().type == lexer_1.TokenType.BinaryOperator && this.at().value.includes("=")) {
            const operator = this.eat().value;
            const value = this.parse_assignment_expression();
            return { kind: "CompoundAssignmentExpression", assigne: left, value, operator };
        }
        return left;
    }
    parse_assignment_expression() {
        const left = this.parse_equality_expression();
        if (this.at().type == lexer_1.TokenType.Equal) {
            this.eat();
            const value = this.parse_assignment_expression();
            return { kind: "AssignmentExpression", assigne: left, value };
        }
        return left;
    }
    parse_equality_expression() {
        let left = this.parse_object_expression();
        while (this.at().type == lexer_1.TokenType.EqualEqual || this.at().type == lexer_1.TokenType.NotEqual || this.at().type == lexer_1.TokenType.LessThanOrEqual || this.at().type == lexer_1.TokenType.GreaterThenOrEqual || this.at().type == lexer_1.TokenType.LessThan || this.at().type == lexer_1.TokenType.GreaterThan) {
            const operator = this.eat().value;
            const right = this.parse_object_expression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
            };
        }
        return left;
    }
    parse_object_expression() {
        if (this.at().type != lexer_1.TokenType.OpenBrace)
            return this.parse_additive_expression();
        this.eat(); // Go past brace
        const properties = new Array();
        while (this.not_eof() && this.at().type != lexer_1.TokenType.CloseBrace) {
            const key = this.expect(lexer_1.TokenType.Identifier, "Object key expected.").value;
            if (this.at().type == lexer_1.TokenType.Comma) {
                this.eat(); // Go past comma
                properties.push({ key, kind: "Property" });
                continue;
            }
            else if (this.at().type == lexer_1.TokenType.CloseBrace) {
                properties.push({ key, kind: "Property" });
                continue;
            }
            this.expect(lexer_1.TokenType.Colon, "Missing colon following key in Object.");
            const value = this.parse_expression();
            properties.push({ key, kind: "Property", value: value });
            if (this.at().type != lexer_1.TokenType.CloseBrace) {
                this.expect(lexer_1.TokenType.Comma, "Expected comma or closing brace following property.");
            }
        }
        this.expect(lexer_1.TokenType.CloseBrace, "Object missing closing brace.");
        return { kind: "ObjectLiteral", properties: properties };
    }
    parse_additive_expression() {
        let left = this.parse_multiplicative_expression();
        while (this.at().value == "+" || this.at().value == "-") {
            const operator = this.eat().value;
            const right = this.parse_multiplicative_expression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
            };
        }
        return left;
    }
    parse_multiplicative_expression() {
        let left = this.parse_exponential_expression();
        while (this.at().value == "*" || this.at().value == "/" || this.at().value == "%") {
            const operator = this.eat().value;
            const right = this.parse_exponential_expression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
            };
        }
        return left;
    }
    parse_exponential_expression() {
        let left = this.parse_call_member_expression();
        while (this.at().value == "^") {
            const operator = this.eat().value;
            const right = this.parse_call_member_expression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
            };
        }
        return left;
    }
    parse_call_member_expression() {
        const member = this.parse_member_expression();
        if (this.at().type == lexer_1.TokenType.OpenParen)
            return this.parse_call_expression(member);
        return member;
    }
    parse_call_expression(caller) {
        let call_expression = {
            kind: "CallExpression",
            caller,
            args: this.parse_args(),
        };
        if (this.at().type == lexer_1.TokenType.OpenParen)
            call_expression = this.parse_call_expression(call_expression);
        return call_expression;
    }
    parse_args() {
        this.expect(lexer_1.TokenType.OpenParen, "Expected open parenthesis.");
        const args = this.at().type == lexer_1.TokenType.CloseParen ? [] : this.parse_args_list();
        this.expect(lexer_1.TokenType.CloseParen, "Missing closing parenthesis inside argument list.");
        return args;
    }
    parse_args_list() {
        const args = [this.parse_expression()];
        while (this.at().type == lexer_1.TokenType.Comma && this.eat())
            args.push(this.parse_expression());
        return args;
    }
    parse_member_expression() {
        let object = this.parse_primary_expression();
        while (this.at().type == lexer_1.TokenType.Dot || this.at().type == lexer_1.TokenType.OpenBracket) {
            const operator = this.eat();
            let property;
            let computed;
            if (operator.type == lexer_1.TokenType.Dot) {
                computed = false;
                property = this.parse_primary_expression();
                if (property.kind != "Identifier")
                    throw "Cannot use dot operator without an identifier on the right.";
            }
            else {
                computed = true;
                property = this.parse_expression();
                this.expect(lexer_1.TokenType.CloseBracket, "Missing closing bracket in computed value");
            }
            object = {
                kind: "MemberExpression",
                object,
                property,
                computed,
            };
        }
        return object;
    }
    parse_primary_expression() {
        const token = this.at().type;
        switch (token) {
            case lexer_1.TokenType.Identifier:
                return {
                    kind: "Identifier",
                    symbol: this.eat().value,
                };
            case lexer_1.TokenType.Number:
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(this.eat().value),
                };
            case lexer_1.TokenType.String: {
                return {
                    kind: "StringLiteral",
                    value: this.eat().value,
                };
            }
            case lexer_1.TokenType.OpenParen: {
                this.eat(); // Go past parenthesis
                const value = this.parse_expression();
                this.expect(lexer_1.TokenType.CloseParen, "Unexpected token found inside parenthesized expression. Expected closing parenthesis."); // If the closing parenthesis is not found
                return value;
            }
            default:
                throw `Unexpected token found during parsing! ${JSON.stringify(this.at())}`;
        }
    }
}
exports.default = Parser;
