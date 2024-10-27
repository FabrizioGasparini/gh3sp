import { handleError, ImportError } from "../utils/errors_handler.ts";
import { MK_NATIVE_FUNCTION, MK_OBJECT, type FunctionCall, type RuntimeValue } from "./values.ts";
import { default_libraries } from "./built-in/libraries.ts";
import process from "node:process";

type Object = {functions: Record<string | number | symbol, never>, constants: Record<string | number | symbol, never>}

export async function compileLibrary(filePath: string) {
    const fullPath = (process.cwd() + "\\" + filePath).replaceAll("\\", "/");
    let library;
    if (filePath in default_libraries) {
        for (const [key, value] of Object.entries(default_libraries)) if (key == filePath) library = value  
    }
    else {
        if(!fullPath.includes(".gh3lib")) throw handleError(new ImportError("Library file must be of type 'Gh3sp Library' (.gh3lib)", fullPath), 0, 0);


        try {
            library = await import(fullPath);
            library = library.default;
        } catch (error) {
            let message
            if (error instanceof Error) message = error.message.split("\n")[0]
            else message = String(error)
            throw handleError(new ImportError(message, fullPath), 0, 0);
        }
    }
        
    const lib_objects = [];
    for (const [key, value] of Object.entries(library)) {
        if (value == null) continue;
        
        if (!(value as Object).constants || !(value as Object).functions) {
            throw handleError(new ImportError("Library doesn't contain a valid export", fullPath), 0, 0);
        }
        
        const properties = new Map<string, RuntimeValue>();
        for (const [f_key, f_value] of Object.entries((value as Object).functions)) properties.set(f_key, MK_NATIVE_FUNCTION((f_value as FunctionCall)));
        for (const [c_key, c_value] of Object.entries((value as Object).constants)) properties.set(c_key, c_value as RuntimeValue);

        lib_objects.push({ name: key, object: MK_OBJECT(properties) })
    }
    return lib_objects;
}
