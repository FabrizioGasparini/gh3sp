import Parser from "@core/frontend/parser.ts";
import { createGlobalEnvironment } from "@core/runtime/environments.ts";
import { evaluate } from "@core/runtime/interpreter.ts";

run(await Deno.readTextFile("./main.gh3"));

export function run(input: string) {
    const env = createGlobalEnvironment();
    const parser = new Parser(env);

    parser.produceAST(input, env).then((AST) => {
        return evaluate(AST, env);
    });
}
