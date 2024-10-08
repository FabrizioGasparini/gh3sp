import "node:process";
import process from "node:process";
import { TokenType } from "../frontend/lexer.ts";

class Print {
    static RED = "\x1b[31m";
    static GREEN = "\x1b[32m";
    static BLUE = "\x1b[34m";
    static YELLOW = "\x1b[33m";
    static MAGENTA = "\x1b[35m";
    static CYAN = "\x1b[36m";
    static WHITE = "\x1b[37m";
    static BOLD = "\x1b[1m";
    static UNDERLINE = "\x1b[4m";
    static DEFAULT = "\x1b[0m";
}

export function handleError(error: Error, line: number, column: number) {
    console.error(Print.RED + `${error.name}: ${Print.DEFAULT}${error.message} at ${process.argv[2]}:${line}:${column}`);
    const stackLines = error.stack!.split("\n");
    for (let i = 0; i < stackLines.length; i++) {
        // Ignora la prima riga dello stack trace che contiene "Error:"
        if (i > 0) {
            console.error(stackLines[i]);
        }
    }
    process.exit(1);
}

export class ParserError extends Error {
    constructor(error: string, type: TokenType) {
        super(`${error}. Expecting: ${TokenType[type]}`);
        this.name = "ParsingError";
    }
}
