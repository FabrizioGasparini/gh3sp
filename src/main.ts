import Parser from "./frontend/parser";
import { createGlobalEnvironment } from "./runtime/environments";
import { evaluate } from "./runtime/interpreter";

//run(await Deno.readTextFile("./main.gh3"));

export function run(input: string) {
    const env = createGlobalEnvironment();
    const parser = new Parser(env);

    parser.produceAST(input, env).then((AST) => {
        return evaluate(AST, env);
    });
}
