import Parser from "./frontend/parser.ts";
import { createGlobalEnvironment } from "./runtime/environments.ts";
import { evaluate } from "./runtime/interpreter.ts";

run(await Deno.readTextFile("./main.gh3"));

export function run(input: string) {
    const env = createGlobalEnvironment();
    const parser = new Parser(env);

    parser.produceAST(input, env).then((AST) => {
        return evaluate(AST, env);
    });
}
