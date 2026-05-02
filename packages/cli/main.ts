import Parser from "@core/frontend/parser";
import { createGlobalEnvironment } from "@core/runtime/environments";
import { evaluate } from "@core/runtime/interpreter";
import { readFileSync } from "node:fs";

(async function main() {
  let input = readFileSync("./main.gh3", "utf-8");
  await run(input);
})();

export async function run(input: string) {
  const env = createGlobalEnvironment();
  const parser = new Parser(env);

  const AST = await parser.produceAST(input, env);
  await evaluate(AST, env);
}
