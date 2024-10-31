import Parser from "./frontend/parser.ts";
import { createGlobalEnvironment } from "./runtime/environments.ts";

//run(await Deno.readTextFile("./main.gh3"));

export function run(input: string) {
    const env = createGlobalEnvironment();
    const parser = new Parser(env);

    return parser.produceAST(input);
}
