import Parser from "./frontend/parser.ts";
import { createGlobalEnvironment } from "./runtime/environments.ts";
import { evaluate } from "./runtime/interpreter.ts";

run(await Deno.readTextFile("./main.gh3"))

export function run(input: string) {
    const parser = new Parser()
    const env = createGlobalEnvironment()
    
    const program = parser.produceAST(input)
    evaluate(program, env)
}
console.log()