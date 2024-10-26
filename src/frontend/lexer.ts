import { handleError, LexerError } from "../utils/errors_handler.ts";

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
    While,

    ForEach,
    In,

    Import,

    // Grouping & Operators
    BinaryOperator,
    CompoundOperator,
    LogicOperator,
    Equal,
    SpreadOperator,

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

    NewLine,
    EOF, // End of file
}

// Tokens Records
const KEYWORDS: Record<string, TokenType> = {
    let: TokenType.Let,
    const: TokenType.Const,

    fn: TokenType.Fn,

    if: TokenType.If,
    else: TokenType.Else,

    for: TokenType.For,
    while: TokenType.While,

    foreach: TokenType.ForEach,
    in: TokenType.In,

    import: TokenType.Import,
};

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
    "!": TokenType.LogicOperator,
    "<": TokenType.LessThan,
    ">": TokenType.GreaterThan,
};

const doubleCharTokens: Record<string, TokenType> = {
    "==": TokenType.EqualEqual,
    "!=": TokenType.NotEqual,
    "<=": TokenType.LessThanOrEqual,
    ">=": TokenType.GreaterThenOrEqual,
    "//": TokenType.BinaryOperator,
    "++": TokenType.CompoundOperator,
    "--": TokenType.CompoundOperator,
    "+=": TokenType.CompoundOperator,
    "-=": TokenType.CompoundOperator,
    "*=": TokenType.CompoundOperator,
    "/=": TokenType.CompoundOperator,
    "%=": TokenType.CompoundOperator,
    "^=": TokenType.CompoundOperator,
    "&&": TokenType.LogicOperator,
    "||": TokenType.LogicOperator,
};

const tripleCharTokens: Record<string, TokenType> = {
    "...": TokenType.SpreadOperator,
    "//=": TokenType.CompoundOperator,
};

// Token Type
export interface Token {
    value: string;
    type: TokenType;
}

function token(value = "", type: TokenType): Token {
    return { value, type };
}

// Check Functions
function isAlpha(src: string) {
    return src.toUpperCase() != src.toLocaleLowerCase();
}

function isSkippable(src: string) {
    return src == " " || src == "\t" || src == "\r";
}

function isSignleComment(src: string[]) {
    return src[0] == "#";
}

function isMultiComment(src: string[]) {
    return src[0] + src[1] == "/*";
}

function isNum(src: string) {
    const c = src.charCodeAt(0);
    const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];

    return c >= bounds[0] && c <= bounds[1];
}

function isDecimal(src: string[]) {
    return src[0] == "." && isNum(src[1]);
}

function isNegative(src: string[]) {
    return src[0] == "-" && isNum(src[1]);
}

function isMultiCharToken(src: string[], length: number, record: Record<string, TokenType>) {
    let value: string = "";
    for (let i = 0; i < length; i++) value += src[i];

    return value in record;
}

// Parsing Functions
function parseString(src: string[]): string {
    const quoteType = src.shift(); // Removes quote (" or ')
    let str = "";

    while (src.length > 0 && src[0] != quoteType) str += src.shift();

    src.shift(); // Removes closing quote
    return str;
}

function parseNumber(src: string[]): string {
    let num = "";
    while (src.length > 0 && (isNum(src[0]) || isDecimal(src) || isNegative(src))) {
        if (isDecimal(src) && num.includes(".")) throw handleError(new LexerError("Invalid number format"), currentLine, currentColumn);
        num += src.shift();
    }
    return num;
}

function parseIdentifierOrKeyword(src: string[]): Token {
    let ident = "";
    while (src.length > 0 && isAlpha(src[0])) ident += src.shift();

    const reserved = KEYWORDS[ident];
    if (typeof reserved === "number") return token(ident, reserved);
    else return token(ident, TokenType.Identifier);
}

function skipSingleLineComment(src: string[]): void {
    while (src.length > 0 && src[0] !== "\n") src.shift();
    src.shift(); // Rimuovi il newline finale
}

function skipMultiLineComment(src: string[]): void {
    while (src.length > 0 && src[0] + src[1] !== "*/") src.shift();
    src.shift(); // Rimuovi "*"
    src.shift(); // Rimuovi "/"
}

function parseMultiCharToken(src: string[], length: number, record: Record<string, TokenType>): Token {
    let value: string = "";
    for (let i = 0; i < length; i++) value += src[i];

    const type = record[value];

    for (let i = 0; i < length; i++) src.shift();

    return token(value, type);
}

let currentLine = 1;
let currentColumn = 1;

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split("");

    while (src.length > 0) {
        const current = src[0];

        if (current == "\n") {
            tokens.push(token(src.shift(), TokenType.NewLine));
            currentLine += 1;
            currentColumn = 1;
            continue;
        } else if (isSkippable(current)) {
            src.shift();
            continue;
        }
        currentColumn += current.length;

        if (isSignleComment(src)) skipSingleLineComment(src);
        else if (isMultiComment(src)) skipMultiLineComment(src);
        else if (isMultiCharToken(src, 3, tripleCharTokens)) tokens.push(parseMultiCharToken(src, 3, tripleCharTokens));
        else if (isMultiCharToken(src, 2, doubleCharTokens)) tokens.push(parseMultiCharToken(src, 2, doubleCharTokens));
        else if (isNum(current)) tokens.push(token(parseNumber(src), TokenType.Number));
        else if (isNegative(src)) tokens.push(token(parseNumber(src), TokenType.Number));
        else if (current == '"' || current == "'") tokens.push(token(parseString(src), TokenType.String));
        else if (current in singleCharTokens) tokens.push(token(src.shift(), singleCharTokens[current]));
        else if (isAlpha(current)) tokens.push(parseIdentifierOrKeyword(src));
        else throw handleError(new LexerError("Unrecognized character found in source: " + JSON.stringify(current).charCodeAt(0)), currentLine, currentColumn);
    }

    tokens.push(token("EndOfFile", TokenType.EOF));
    return tokens;
}
