import Parser from "./frontend/parser";
import { createGlobalEnvironment } from "./runtime/environments";
import { evaluate } from "./runtime/interpreter";

export function run(input: string) {
    const parser = new Parser();
    const env = createGlobalEnvironment();

    const program = parser.produceAST(input);
    evaluate(program, env);
}
