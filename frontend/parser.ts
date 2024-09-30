import { CallExpression } from "./ast.ts";
import { Statement, Program, Expression, BinaryExpression, NumericLiteral, Identifier, VariableDeclaration, AssignmentExpression, Property, ObjectLiteral, MemberExpression, FunctionDeclaration } from "./ast.ts";
import { tokenize, Token, TokenType } from "./lexer.ts";

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
            throw `Parser Error:\n ${err}. ${prev}. Expecting: ${type}`;
        }

        return prev;
    }

    public produceAST(sourceCode: string): Program {
        this.tokens = tokenize(sourceCode)

        const program: Program = {
            kind: "Program",
            body: [],
        }

        // Parse until END OF FILE
        while (this.not_eof())
        {
            program.body.push(this.parse_statement())
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
            
            default:
                return this.parse_expression()
        }
    }

    private parse_function_declaration(): Statement {
        this.eat(); // eat fn keyword
        const name = this.expect(TokenType.Identifier, "Expected function name following fn keyword").value;

        const args = this.parse_args();
        const parameters: string[] = [];
        for (const arg of args) {
            if (arg.kind != "Identifier") 
                throw "Inside function declaration expected parameters to be of type string." + arg;
            
            parameters.push((arg as Identifier).symbol)
        }
        
        this.expect(TokenType.OpenBrace, "Expected function body following declaration.")
        
        const body: Statement[] = [];
        while (this.not_eof() && this.at().type != TokenType.CloseBrace)
            body.push(this.parse_statement())
        
        this.expect(TokenType.CloseBrace, "Closing brace expected at the end of function declaration")
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
        const identifier = this.expect(
            TokenType.Identifier,
            "Expected identifier name following let/const keywords"
        ).value;

        if (this.at().type == TokenType.Semicolon || this.at().type == TokenType.EOF) {
            this.eat()
            if (isConstant) 
                throw `Must assign value to constant expression '${identifier}'. No value provided.`;
            
            return {
                kind: "VariableDeclaration",
                identifier,
                constant: false
            } as VariableDeclaration
        }

        this.expect(TokenType.Equals, "Expected equals token following identifier in variable declaration.")

        const declaration = {
            kind: "VariableDeclaration",
            identifier,
            constant: isConstant,
            value: this.parse_expression(),
        } as VariableDeclaration

        return declaration
    }

    private parse_expression(): Expression {
        return this.parse_assignment_expression();
    }

    private parse_assignment_expression(): Expression {
        const left = this.parse_object_expression();

        if (this.at().type == TokenType.Equals) {
            this.eat();

            const value = this.parse_assignment_expression();

            return { kind: "AssignmentExpression", assigne: left, value } as AssignmentExpression;
        }

        return left;
    }

    private parse_object_expression(): Expression {
        if (this.at().type != TokenType.OpenBrace)
            return this.parse_additive_expression();

        this.eat() // Go past brace
        const properties = new Array<Property>();

        while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
            const key = this.expect(TokenType.Identifier, "Object key expected.").value;
            if (this.at().type == TokenType.Comma) {
                this.eat(); // Go past comma
                properties.push({ key, kind: "Property"})
                continue;
            } else if (this.at().type == TokenType.CloseBrace) {
                properties.push({ key, kind: "Property"})
                continue;
            }

            this.expect(TokenType.Colon, "Missing colon following key in Object.")
            const value = this.parse_expression();

            properties.push({ key, kind: "Property", value: value })
            if (this.at().type != TokenType.CloseBrace) {
                this.expect(TokenType.Comma, "Expected comma or closing brace following property.")
            }
        }

        this.expect(TokenType.CloseBrace, "Object missing closing brace.");
        return { kind: "ObjectLiteral", properties: properties} as ObjectLiteral;
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
            } as BinaryExpression
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
            } as BinaryExpression
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
                operator
            } as BinaryExpression
        }

        return left
    }

    private parse_call_member_expression(): Expression {
        const member = this.parse_member_expression();

        if (this.at().type == TokenType.OpenParen)
            return this.parse_call_expression(member);
        
        return member
    }
    
    private parse_call_expression(caller: Expression): Expression {
        let call_expression: Expression = {
            kind: "CallExpression",
            caller,
            args: this.parse_args()
        } as CallExpression

        if (this.at().type == TokenType.OpenParen)
            call_expression = this.parse_call_expression(call_expression)

        return call_expression
    }
    
    private parse_args(): Expression[] {
        this.expect(TokenType.OpenParen, "Expected open parenthesis.")
        const args = this.at().type == TokenType.CloseParen
        ? []
        : this.parse_args_list();
        
        this.expect(TokenType.CloseParen, "Missing closing parenthesis inside argument list.")
        return args;
    }

    private parse_args_list(): Expression[] {
        const args = [this.parse_assignment_expression()];

        while (this.at().type == TokenType.Comma && this.eat())
            args.push(this.parse_assignment_expression())

        return args;
    }

    private parse_member_expression(): Expression {
        let object = this.parse_primary_expression();

        while (this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket) {
            const operator = this.eat()

            let property: Expression;
            let computed: boolean;

            if (operator.type == TokenType.Dot) {
                computed = false
                property = this.parse_primary_expression()

                if (property.kind != "Identifier")
                    throw 'Cannot use dot operator without an identifier on the right.'
            } else {
                computed = true
                property = this.parse_expression()
                this.expect(TokenType.CloseBracket, "Missing closing bracket in computed value")
            }
            
            object = {
                kind: "MemberExpression",
                object,
                property,
                computed
            } as MemberExpression
        }

        return object
    }

    private parse_primary_expression(): Expression {
        const token = this.at().type;

        switch (token) {
            case TokenType.Identifier:
                return {
                    kind: "Identifier",
                    symbol: this.eat().value
                } as Identifier

            case TokenType.Number:
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(this.eat().value)
                } as NumericLiteral
            
            case TokenType.OpenParen: {
                this.eat(); // Go past parenthesis
                const value = this.parse_expression()
                this.expect(TokenType.CloseParen, "Unexpected token found inside parenthesized expression. Expected closing parenthesis."); // If the closing parenthesis is not found
                return value;
            }
    
            default:
                throw `Unexpected token found during parsing! ${JSON.stringify(this.at())}`
        }
    }   
}