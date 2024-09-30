import Parser from "./frontend/parser.ts";
import { createGlobalEnvironment } from "./runtime/environments.ts";
import { evaluate } from "./runtime/interpreter.ts";

//repl()
run("./main.gh3")

async function run(filePath: string) {
    const parser = new Parser()
    const env = createGlobalEnvironment()
    
    const input = await Deno.readTextFile(filePath)
    const program = parser.produceAST(input)
    evaluate(program, env)
}

// deno-lint-ignore no-unused-vars
function repl() {
    const parser = new Parser()
    const env = createGlobalEnvironment()

    // Initialize Repl
    console.log("Repl v0.1")

    while (true) {
        const input = prompt("> ")
        // Check for no user input or exit keyword
        if (!input || input.includes("exit"))
            Deno.exit(1)
        
        const program = parser.produceAST(input);

        evaluate(program, env)
    }
}