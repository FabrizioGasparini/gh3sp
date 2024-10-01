"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
exports.tokenize = tokenize;
var TokenType;
(function (TokenType) {
    // Literal Types
    TokenType[TokenType["Identifier"] = 0] = "Identifier";
    TokenType[TokenType["Number"] = 1] = "Number";
    TokenType[TokenType["String"] = 2] = "String";
    // Keywords
    TokenType[TokenType["Let"] = 3] = "Let";
    TokenType[TokenType["Const"] = 4] = "Const";
    TokenType[TokenType["Fn"] = 5] = "Fn";
    TokenType[TokenType["If"] = 6] = "If";
    TokenType[TokenType["Else"] = 7] = "Else";
    TokenType[TokenType["For"] = 8] = "For";
    TokenType[TokenType["While"] = 9] = "While";
    // Grouping & Operators
    TokenType[TokenType["BinaryOperator"] = 10] = "BinaryOperator";
    TokenType[TokenType["Equal"] = 11] = "Equal";
    // Comparison Operators
    TokenType[TokenType["EqualEqual"] = 12] = "EqualEqual";
    TokenType[TokenType["NotEqual"] = 13] = "NotEqual";
    TokenType[TokenType["LessThan"] = 14] = "LessThan";
    TokenType[TokenType["GreaterThan"] = 15] = "GreaterThan";
    TokenType[TokenType["LessThanOrEqual"] = 16] = "LessThanOrEqual";
    TokenType[TokenType["GreaterThenOrEqual"] = 17] = "GreaterThenOrEqual";
    TokenType[TokenType["Dot"] = 18] = "Dot";
    TokenType[TokenType["Comma"] = 19] = "Comma";
    TokenType[TokenType["Colon"] = 20] = "Colon";
    TokenType[TokenType["Semicolon"] = 21] = "Semicolon";
    TokenType[TokenType["OpenParen"] = 22] = "OpenParen";
    TokenType[TokenType["CloseParen"] = 23] = "CloseParen";
    TokenType[TokenType["OpenBracket"] = 24] = "OpenBracket";
    TokenType[TokenType["CloseBracket"] = 25] = "CloseBracket";
    TokenType[TokenType["OpenBrace"] = 26] = "OpenBrace";
    TokenType[TokenType["CloseBrace"] = 27] = "CloseBrace";
    TokenType[TokenType["EOF"] = 28] = "EOF"; // End of file
})(TokenType || (exports.TokenType = TokenType = {}));
// Tokens Records
const KEYWORDS = {
    let: TokenType.Let,
    const: TokenType.Const,
    fn: TokenType.Fn,
    if: TokenType.If,
    else: TokenType.Else,
    for: TokenType.For,
    while: TokenType.While,
};
const singleCharTokens = {
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
};
const doubleCharTokens = {
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
};
function token(value = "", type) {
    return { value, type };
}
// Check Functions
function isalpha(src) {
    return src.toUpperCase() != src.toLocaleLowerCase();
}
function isskippable(src) {
    return src == " " || src == "\n" || src == "\t" || src == "\r";
}
function issignlecomment(src) {
    return src[0] + src[1] == "//";
}
function ismulticomment(src) {
    return src[0] + src[1] == "/*";
}
function isnum(src) {
    const c = src.charCodeAt(0);
    const bounds = ['0'.charCodeAt(0), '9'.charCodeAt(0)];
    return (c >= bounds[0] && c <= bounds[1]);
}
function isdecimal(src) {
    return (src[0] == "." && isnum(src[1]));
}
function isdoublechartoken(src) {
    return (src[0] + (src[1])) in doubleCharTokens;
}
// Parsing Functions
function parseString(src) {
    const quoteType = src.shift(); // Removes quote (" or ')
    let str = "";
    while (src.length > 0 && src[0] !== quoteType)
        str += src.shift();
    src.shift(); // Removes closing quote
    return str;
}
function parseNumber(src) {
    let num = "";
    while (src.length > 0 && (isnum(src[0]) || isdecimal(src))) {
        if (isdecimal(src) && num.includes("."))
            throw 'Invalid number format.';
        num += src.shift();
    }
    return num;
}
function parseIdentifierOrKeyword(src) {
    let ident = "";
    while (src.length > 0 && isalpha(src[0]))
        ident += src.shift();
    const reserved = KEYWORDS[ident];
    if (typeof reserved === "number")
        return token(ident, reserved);
    else
        return token(ident, TokenType.Identifier);
}
function skipSingleLineComment(src) {
    while (src.length > 0 && src[0] !== "\n")
        src.shift();
    src.shift(); // Rimuovi il newline finale
}
function skipMultiLineComment(src) {
    while (src.length > 0 && src[0] + src[1] !== "*/")
        src.shift();
    src.shift(); // Rimuovi "*"
    src.shift(); // Rimuovi "/"
}
function parseDoubleCharToken(src) {
    const value = (src[0] + src[1]);
    const type = doubleCharTokens[value];
    src.shift();
    src.shift();
    return token(value, type);
}
function tokenize(sourceCode) {
    const tokens = new Array();
    const src = sourceCode.split("");
    while (src.length > 0) {
        const current = src[0];
        if (issignlecomment(src))
            skipSingleLineComment(src);
        else if (ismulticomment(src))
            skipMultiLineComment(src);
        else if (isdoublechartoken(src))
            tokens.push(parseDoubleCharToken(src));
        else if (current == '"' || current == "'")
            tokens.push(token(parseString(src), TokenType.String));
        else if (current in singleCharTokens)
            tokens.push(token(src.shift(), singleCharTokens[current]));
        else if (isnum(current))
            tokens.push(token(parseNumber(src), TokenType.Number));
        else if (isalpha(current))
            tokens.push(parseIdentifierOrKeyword(src));
        else if (isskippable(current))
            src.shift(); // Skip character
        else
            throw 'Unrecognized character found in source: ' + JSON.stringify(current).charCodeAt(0);
    }
    tokens.push(token("EndOfFile", TokenType.EOF));
    return tokens;
}
