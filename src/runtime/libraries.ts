import { handleError, ImportError } from "../utils/errors_handler.ts";
import { MK_NATIVE_FUNCTION, MK_OBJECT, type FunctionCall, type RuntimeValue } from "./values.ts";
import { default_libraries } from "./built-in/libraries.ts";
import process from "node:process";
import { readFileSync } from "node:fs";
import Environment, { createGlobalEnvironment } from "./environments.ts";
import Parser from "../frontend/parser.ts";
import { evaluate } from "./interpreter.ts";
import { existsSync } from "node:fs";

// Library Object Type
type Object = {functions: Record<string | number | symbol, never>, constants: Record<string | number | symbol, never>}

// Compiles the library from the given path
export async function compileLibrary(filePath: string, env: Environment) {
    // Declares the full path of the given library path
    let library;
    
    // If the filepath is in the default libraries, sets the library as that default library
    if (filePath in default_libraries) {
        for (const [key, value] of Object.entries(default_libraries)) if (key == filePath) library = value
    } else {
        const fullPath = (process.cwd() + "\\" + filePath).replaceAll("\\", "/");
        if(!existsSync(fullPath)) throw handleError(new ImportError("Library not found", filePath), 0, 0);

        switch (filePath.split(".")[1]) {
            case "gh3lib": {
                // Tries to import the library from the given file path
                try { library = (await import(fullPath)).default; }
                catch (error) {
                    // Throws an error if the library is not found
                    let message
                    if (error instanceof Error) message = error.message.split("\n")[0]
                    else message = String(error)
                    throw handleError(new ImportError(message, fullPath), 0, 0);
                }

                break
            }
            case "gh3": {    
                env.imported.add(filePath);
                const code = readFileSync(fullPath, "utf-8");
                const newEnv = createGlobalEnvironment();
                newEnv.imported = env.imported;
                const parser = new Parser(newEnv);
                
                evaluate(await parser.produceAST(code, newEnv), newEnv)

                const exported = new Map<string, RuntimeValue>();
                for (const key of newEnv.exported.keys()) exported.set(key, newEnv.lookupVar(key))
                
                let splits = filePath.split(".")
                splits = splits[splits.length - 2].split("/")
                return [{ name: splits[splits.length - 1], object: MK_OBJECT(exported) }]
            }
            default: throw handleError(new ImportError("Library file must be of type 'Gh3sp Library' (.gh3lib)", fullPath), 0, 0);
        }
        

    }
        
    if (!library) throw handleError(new ImportError("Library not found", filePath), 0, 0);

    // Declares a list of objects found inside the library
    const lib_objects = [];
    // Loops through the imported library's exported object
    for (const [key, value] of Object.entries(library)) {
        // Goes to the next object if this value is NULL
        if (value == null) continue;
        
        // Throws an error if the value doesn't contain 'constants' and 'functions'
        if (!(value as Object).constants || !(value as Object).functions) throw handleError(new ImportError("Library doesn't contain a valid export", filePath), 0, 0);
        
        // Declares a map of properties of the library's object
        const properties = new Map<string, RuntimeValue>();

        // Adds library's functions to the properties map
        for (const [f_key, f_value] of Object.entries((value as Object).functions)) properties.set(f_key, MK_NATIVE_FUNCTION((f_value as FunctionCall)));
        // Adds constants's functions to the properties map
        for (const [c_key, c_value] of Object.entries((value as Object).constants)) properties.set(c_key, c_value as RuntimeValue);
        
        // Adds the properties map as an object to the list of objects og the library
        lib_objects.push({ name: key, object: MK_OBJECT(properties) })
    }
    
    env.imported.add(filePath);
    return lib_objects;
}
