import { handleError, LexerError } from "@core/utils/errors_handler.ts";

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
    Not,
    Choose,
    ChooseAll,
    Case,
    DefaultCase,

    // Control Flow
    Break,
    Continue,
    Pass,

    // Declarations
    Import,
    Export,

    // Special Keywords
    Reactive,

    // Operators
    BinaryOperator,
    CompoundOperator,
    LogicOperator,
    ArrowOperator,

    // Comparison Operators
    EqualEqual,
    NotEqual,
    LessThan,
    GreaterThan,
    LessThanOrEqual,
    GreaterThenOrEqual,

    // Symbols
    Equal,
    Dot,
    Comma,
    Colon,
    Semicolon,
    QuestionMark,

    // Grouping
    OpenParen,
    CloseParen, // ()
    OpenBracket,
    CloseBracket, // []
    OpenBrace,
    CloseBrace, // {}

    // Non-Code Tokens
    NL, // New Line
    EOF, // End of file
}

// === Tokens Records === \\
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
    not: TokenType.Not,
    choose: TokenType.Choose,
    chooseall: TokenType.ChooseAll,
    case: TokenType.Case,
    default: TokenType.DefaultCase,

    break: TokenType.Break,
    continue: TokenType.Continue,
    pass: TokenType.Pass,

    import: TokenType.Import,
    export: TokenType.Export,

    reactive: TokenType.Reactive,
};

const singleCharTokens: Record<string, TokenType> = {
    ".": TokenType.Dot,
    ",": TokenType.Comma,
    ":": TokenType.Colon,
    ";": TokenType.Semicolon,
    "?": TokenType.QuestionMark,
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
    "??": TokenType.BinaryOperator,

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

    "=>": TokenType.ArrowOperator,
};

const tripleCharTokens: Record<string, TokenType> = {
    "//=": TokenType.CompoundOperator,
    "??=": TokenType.CompoundOperator,
};

// Token Type
export interface Token {
    value: string;
    type: TokenType;
}

function token(value = "", type: TokenType): Token {
    return { value, type };
}

// === Check Functions === \\
// Checks if the given character is made ONLY of alphabetic character, or the current char is a '_'
const isAlpha = (char: string): boolean => char.toUpperCase() != char.toLocaleLowerCase() || char[0] == "_";

// Checks if the given character is a 'space', 'tab' and 'carriage return', which is skippable
const isSkippable = (char: string): boolean => char == " " || char == "\t" || char == "\r";

// Checks if the given character is '#', which is the single line comment symbol
const isSignleComment = (char: string): boolean => char == "#";

// Checks if the given characters are '/*', which is the beginning of a multi-line comment
const isMultiComment = (src: string[]): boolean => src[0] + src[1] == "/*";

// Checks if the given character is a digit (between 0 - 9)
const isNum = (char: string): boolean => char.charCodeAt(0) >= "0".charCodeAt(0) && char.charCodeAt(0) <= "9".charCodeAt(0);

// Checks if the given characters are in a '-d' format, which is when the current character is a '-' and the next one is a digit '0 - 9'
const isNegative = (src: string[], token: Token): boolean => src[0] == "-" && isNum(src[1]) && token.type != TokenType.Number && token.type != TokenType.Identifier;

// Checks if the given 'n' characters, with 'n' being the 'length' of the token, are contained in the specified tokens 'record'
const isMultiCharToken = (src: string[], length: number, record: Record<string, TokenType>): boolean => src.slice(0, length).join("") in record;

// Checks if the given character is the end of the line
const isEndOfLine = (char: string): boolean => char == "\n";

// Checks if the given character is the begging of a string (" or ')
const isString = (char: string): boolean => char == '"' || char == "'";

// === Parsing Functions === \\
// Parses a 'quoted string' ('', "") from the given characters
function parseString(src: string[]): string {
    const quoteType = src.shift(); // Removes opening quote: " or '
    let str = "";

    while (src.length > 0 && src[0] != quoteType) str += src.shift();

    src.shift(); // Removes closing quote: " or '
    return str;
}

// Parses a 'number' (integer, float, negative) from the given characters
function parseNumber(src: string[], token: Token): string {
    let num = "";

    while (src.length > 0 && (isNum(src[0]) || src[0] == "." || isNegative(src, token)) && (src[0] != "-" || (num.length == 0 && src[0] == "-"))) {
        // If (the current character is a '.' AND the number already contains a '.') OR (the current character is a '-' and it isn't at the start of the number), throw an error
        if (src[0] == "." && num.includes(".")) throw handleError(new LexerError("Invalid number format"), currentLine, currentColumn);

        num += src.shift();
    }

    return num;
}

// Parses a 'keyword' if the given characters are found inside the 'KEYWORDS' record, or a
function parseIdentifierOrKeyword(src: string[]): Token {
    let ident = "";

    while (src.length > 0 && (isAlpha(src[0]) || isNum(src[0]))) ident += src.shift();

    const reserved = KEYWORDS[ident];
    if (typeof reserved === "number") return token(ident, reserved);
    else return token(ident, TokenType.Identifier);
}

// Parses a 'token' of a given 'length', from the given 'record'
function parseMultiCharToken(src: string[], length: number, record: Record<string, TokenType>): Token {
    let value: string = "";
    for (let i = 0; i < length; i++) value += src[i];

    const type = record[value];

    for (let i = 0; i < length; i++) src.shift();

    return token(value, type);
}

// === Comments Function === \\
// Skips the single line token
function skipSingleLineComment(src: string[]): void {
    while (src.length > 0 && src[0] !== "\n") src.shift(); // Removes the comment until the end of the line
    src.shift(); // Removes the NL token
}

function skipMultiLineComment(src: string[]): void {
    while (src.length > 0 && src[0] + src[1] !== "*/") src.shift(); // Removes the comment until it finds the end of the multi-line comment
    src.shift();
    src.shift(); // Removes "*/"
}

// Variables to keep count of the current position inside the code, for errors handling purposes
let currentLine = 1;
let currentColumn = 1;

// Returns a list of tokens from the given 'source code'
export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split("");

    /* == Importance Order == *\
       1. New Line
       2. Skippable

       3. Single-Line Comment
       4. Multi-Line Comment

       5. Triple-Char Token
       6. Double-Char Token

       7. Number
       8. Negative Number

       9. String

       10. Single-Char Token

       11. Identifier/Keyword
    \* ====================== */

    while (src.length > 0) {
        const current = src[0];

        if (isEndOfLine(current)) {
            tokens.push(token(src.shift(), TokenType.NL));
            currentLine += 1;
            currentColumn = 1;
            continue;
        }

        if (isSkippable(current)) {
            src.shift();
            continue;
        }

        currentColumn += current.length;

        if (isSignleComment(current)) skipSingleLineComment(src);
        else if (isMultiComment(src)) skipMultiLineComment(src);
        else if (isMultiCharToken(src, 3, tripleCharTokens)) tokens.push(parseMultiCharToken(src, 3, tripleCharTokens));
        else if (isMultiCharToken(src, 2, doubleCharTokens)) tokens.push(parseMultiCharToken(src, 2, doubleCharTokens));
        else if (isNum(current)) tokens.push(token(parseNumber(src, tokens[tokens.length - 1]), TokenType.Number));
        else if (isNegative(src, tokens[tokens.length - 1])) tokens.push(token(parseNumber(src, tokens[tokens.length - 1]), TokenType.Number));
        else if (isString(current)) tokens.push(token(parseString(src), TokenType.String));
        else if (current in singleCharTokens) tokens.push(token(src.shift(), singleCharTokens[current]));
        else if (isAlpha(current)) tokens.push(parseIdentifierOrKeyword(src));
        else throw handleError(new LexerError("Unrecognized character found in source: " + JSON.stringify(current).charCodeAt(0)), currentLine, currentColumn);
    }

    tokens.push(token("EndOfFile", TokenType.EOF));
    return tokens;
}
