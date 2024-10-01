export enum TokenType {
    // Literal Types
    Identifier,
    Number,
    String,

    // Keywords
    Let,
    Const,
    Fn,
    If,
    Else,
    For,

    // Grouping & Operators
    BinaryOperator,
    Equal,
    
    // Comparison Operators
    EqualEqual,
    NotEqual,
    LessThan,
    GreaterThan,
    LessThanOrEqual,
    GreaterThenOrEqual,

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

// Tokens Records

const KEYWORDS: Record<string, TokenType> = {
    let: TokenType.Let,
    const: TokenType.Const,
    fn: TokenType.Fn,
    if: TokenType.If,
    else: TokenType.Else,
    for: TokenType.For
}

const singleCharTokens: Record<string, TokenType> = {
    ".": TokenType.Dot,
    ",": TokenType.Comma,
    ":": TokenType.Colon,
    ";": TokenType.Semicolon,
    "(": TokenType.OpenParen,
    ")": TokenType.CloseParen,
    "[": TokenType.OpenBracket,
    "]": TokenType.CloseBracket,
    "{": TokenType.OpenBrace,
    "}": TokenType.CloseBrace,
    "=": TokenType.Equal,
    "+": TokenType.BinaryOperator,
    "-": TokenType.BinaryOperator,
    "*": TokenType.BinaryOperator,
    "/": TokenType.BinaryOperator,
    "%": TokenType.BinaryOperator,
    "^": TokenType.BinaryOperator,
    "<": TokenType.LessThan,
    ">": TokenType.GreaterThan
}

const doubleCharTokens: Record<string, TokenType> = {
    "==": TokenType.EqualEqual,
    "!=": TokenType.NotEqual,
    "<=": TokenType.LessThanOrEqual,
    ">=": TokenType.GreaterThenOrEqual,
    "+=": TokenType.BinaryOperator,
    "-=": TokenType.BinaryOperator,
    "*=": TokenType.BinaryOperator,
    "/=": TokenType.BinaryOperator,
    "%=": TokenType.BinaryOperator,
    "^=": TokenType.BinaryOperator
}

// Token Type
export interface Token {
    value: string;
    type: TokenType;
}

function token(value = "", type: TokenType): Token {
    return { value, type };
}

// Check Functions

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

function isnum(src: string) {
    const c = src.charCodeAt(0);
    const bounds = ['0'.charCodeAt(0), '9'.charCodeAt(0)]
    
    return (c >= bounds[0] && c <= bounds[1]);
}

function isdecimal(src: string[]) {
    return (src[0] == "." && isnum(src[1]));
}

function isdoublechartoken(src: string[]) {
    return (src[0] + (src[1])) in doubleCharTokens;
}

// Parsing Functions

function parseString(src: string[]): string {
    const quoteType = src.shift();  // Removes quote (" or ')
    let str = "";
    
    while (src.length > 0 && src[0] !== quoteType)
        str += src.shift();
    
    src.shift();  // Removes closing quote
    return str;
}

function parseNumber(src: string[]): string {
    let num = "";
    while (src.length > 0 && (isnum(src[0]) || isdecimal(src))) {
        if (isdecimal(src) && num.includes(".")) throw 'Invalid number format.';
        num += src.shift();
    }
    return num;
}

function parseIdentifierOrKeyword(src: string[]): Token {
    let ident = "";
    while (src.length > 0 && isalpha(src[0]))
        ident += src.shift();
    
    const reserved = KEYWORDS[ident];
    if (typeof reserved === "number")
        return token(ident, reserved);
    else
        return token(ident, TokenType.Identifier);

}

function skipSingleLineComment(src: string[]): void {
    while (src.length > 0 && src[0] !== "\n") src.shift();
    src.shift();  // Rimuovi il newline finale
}

function skipMultiLineComment(src: string[]): void {
    while (src.length > 0 && src[0] + src[1] !== "*/") src.shift();
    src.shift();  // Rimuovi "*"
    src.shift();  // Rimuovi "/"
}

function parseDoubleCharToken(src: string[]): Token {
    const value = (src[0] + src[1]);
    const type = doubleCharTokens[value]
    
    src.shift()
    src.shift()
    
    return token(value, type);
}

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>()
    const src = sourceCode.split("");
    
    while (src.length > 0) {
        const current = src[0]
        
        if (issignlecomment(src))
            skipSingleLineComment(src)
        
        else if (ismulticomment(src))
            skipMultiLineComment(src)
        
        else if (isdoublechartoken(src))
            tokens.push(parseDoubleCharToken(src))
        
        else if (current == '"' || current == "'") 
            tokens.push(token(parseString(src), TokenType.String));
        
        else if (current in singleCharTokens) 
            tokens.push(token(src.shift(), singleCharTokens[current]));
        
        else if (isnum(current))
            tokens.push(token(parseNumber(src), TokenType.Number));
        
        else if (isalpha(current))
            tokens.push(parseIdentifierOrKeyword(src))
    
        else if (isskippable(current))
            src.shift() // Skip character
        else
            throw 'Unrecognized character found in source: ' + JSON.stringify(current).charCodeAt(0);
    }

    tokens.push(token("EndOfFile", TokenType.EOF))
    return tokens
}