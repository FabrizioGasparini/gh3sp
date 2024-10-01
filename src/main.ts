import Parser from "./frontend/parser.ts";
import { createGlobalEnvironment } from "./runtime/environments.ts";
import { evaluate } from "./runtime/interpreter.ts";

export function run(input: string) {
    const parser = new Parser()
    const env = createGlobalEnvironment()
    
    const program = parser.produceAST(input)
    evaluate(program, env)
}