"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    // Literal Types
    TokenType[TokenType["Number"] = 0] = "Number";
    TokenType[TokenType["Identifier"] = 1] = "Identifier";
    TokenType[TokenType["String"] = 2] = "String";
    // Keywords
    TokenType[TokenType["Let"] = 3] = "Let";
    TokenType[TokenType["Const"] = 4] = "Const";
    TokenType[TokenType["Fn"] = 5] = "Fn";
    // Grouping & Operators
    TokenType[TokenType["BinaryOperator"] = 6] = "BinaryOperator";
    TokenType[TokenType["Equals"] = 7] = "Equals";
    TokenType[TokenType["Dot"] = 8] = "Dot";
    TokenType[TokenType["Comma"] = 9] = "Comma";
    TokenType[TokenType["Colon"] = 10] = "Colon";
    TokenType[TokenType["Semicolon"] = 11] = "Semicolon";
    TokenType[TokenType["OpenParen"] = 12] = "OpenParen";
    TokenType[TokenType["CloseParen"] = 13] = "CloseParen";
    TokenType[TokenType["OpenBracket"] = 14] = "OpenBracket";
    TokenType[TokenType["CloseBracket"] = 15] = "CloseBracket";
    TokenType[TokenType["OpenBrace"] = 16] = "OpenBrace";
    TokenType[TokenType["CloseBrace"] = 17] = "CloseBrace";
    TokenType[TokenType["EOF"] = 18] = "EOF"; // End of file
})(TokenType = exports.TokenType || (exports.TokenType = {}));
const KEYWORDS = {
    let: TokenType.Let,
    const: TokenType.Const,
    fn: TokenType.Fn
};
function token(value = "", type) {
    return { value, type };
}
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
function isint(src) {
    const c = src.charCodeAt(0);
    const bounds = ['0'.charCodeAt(0), '9'.charCodeAt(0)];
    return (c >= bounds[0] && c <= bounds[1]);
}
function tokenize(sourceCode) {
    const tokens = new Array();
    const src = sourceCode.split("");
    while (src.length > 0) {
        if (issignlecomment(src)) {
            while (src.length > 0 && src[0] != "\n")
                src.shift();
            src.shift();
        }
        else if (ismulticomment(src)) {
            while (src.length > 0 && src[0] + src[1] != "*/")
                src.shift();
            src.shift();
            src.shift();
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
        else if (isint(src[0])) {
            let num = "";
            while (src.length > 0 && isint(src[0])) {
                num += src.shift();
            }
            tokens.push(token(num, TokenType.Number));
        }
        else if (isalpha(src[0])) {
            let ident = "";
            while (src.length > 0 && isalpha(src[0])) {
                ident += src.shift();
            }
            const reserved = KEYWORDS[ident];
            if (typeof reserved == "number") {
                tokens.push(token(ident, reserved));
            }
            else {
                tokens.push(token(ident, TokenType.Identifier));
            }
        }
        else if (isskippable(src[0]))
            src.shift(); // Skip character
        else
            throw `Unrecognized character found in source: ${JSON.stringify(src[0]).charCodeAt(0)}`;
    }
    tokens.push(token("EndOfFile", TokenType.EOF));
    return tokens;
}
exports.tokenize = tokenize;
