export enum TokenType {
    // Literal Types
    Number,
    Identifier,
    String,

    // Keywords
    Let,
    Const,
    Fn,

    // Grouping & Operators
    BinaryOperator,
    Equals,
    Dot,
    Comma,
    Colon,
    Semicolon,
    OpenParen, // (
    CloseParen, // )
    OpenBracket, // [
    CloseBracket, // ]
    OpenBrace, // {
    CloseBrace, // }
    EOF // End of file
}

const KEYWORDS: Record<string, TokenType> = {
    let: TokenType.Let,
    const: TokenType.Const,
    fn: TokenType.Fn
}

export interface Token {
    value: string;
    type: TokenType;
}

function token(value = "", type: TokenType): Token {
    return { value, type };
}

function isalpha(src: string) {
    return src.toUpperCase() != src.toLocaleLowerCase()
} 

function isskippable(src: string) {
    return src == " " || src == "\n" ||src == "\t" || src == "\r"
}

function issignlecomment(src: string[]) {
    return src[0] + src[1] == "//";
}

function ismulticomment(src: string[]) {
    return src[0] + src[1] == "/*";
}

function isint(src: string) {
    const c = src.charCodeAt(0);
    const bounds = ['0'.charCodeAt(0), '9'.charCodeAt(0)]
    
    return (c >= bounds[0] && c <= bounds[1]);
}

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>()
    const src = sourceCode.split("");
    
    while (src.length > 0) {
        if (issignlecomment(src))
        {
            while (src[0] != "\n")
                src.shift()
            
            src.shift()
        }
        else if (ismulticomment(src))
        {
            while (src[0] + src[1] != "*/")
                src.shift()
            
            src.shift()
            src.shift()
        }
        else if (src[0] == ".")
            tokens.push(token(src.shift(), TokenType.Dot));
        else if (src[0] == ",")
            tokens.push(token(src.shift(), TokenType.Comma));
        else if (src[0] == ":") 
            tokens.push(token(src.shift(), TokenType.Colon));
        else if (src[0] == ";")
            tokens.push(token(src.shift(), TokenType.Semicolon));

        else if (src[0] == "(")
            tokens.push(token(src.shift(), TokenType.OpenParen));
        else if (src[0] == ")")
            tokens.push(token(src.shift(), TokenType.CloseParen));
            
        else if (src[0] == "[") 
            tokens.push(token(src.shift(), TokenType.OpenBracket));
        else if (src[0] == "]")
            tokens.push(token(src.shift(), TokenType.CloseBracket));
        
        else if (src[0] == "{") 
            tokens.push(token(src.shift(), TokenType.OpenBrace));
        else if (src[0] == "}")
            tokens.push(token(src.shift(), TokenType.CloseBrace));
        
        else if (src[0] == "=")
            tokens.push(token(src.shift(), TokenType.Equals));
        else if (src[0] == "+" || src[0] == "-" || src[0] == "*" || (src[0] == "/" && (src[1] != "/" && src[1] != "*")) || src[0] == "%" || src[0] == "^") {
            tokens.push(token(src.shift(), TokenType.BinaryOperator));
        }
        else if (isint(src[0]))
        {
            let num = "";
            while (src.length > 0 && isint(src[0])) {
                num += src.shift();
            }
            tokens.push(token(num, TokenType.Number));
        }
        else if (isalpha(src[0]))
        {
            let ident = "";
            while (src.length > 0 && isalpha(src[0])) {
                ident += src.shift();
            }
            
            const reserved = KEYWORDS[ident]

            if (typeof reserved == "number") {
                tokens.push(token(ident, reserved))
            } else {
                tokens.push(token(ident, TokenType.Identifier));
            }
        }
        else if (isskippable(src[0]))
            src.shift() // Skip character
        else
            throw `Unrecognized character found in source: ${JSON.stringify(src[0]).charCodeAt(0)}`
    }

    tokens.push(token("EndOfFile", TokenType.EOF))
    return tokens
}