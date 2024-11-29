import GMath from "../../libraries/GMath.ts";
import { type FunctionCall, type RuntimeValue, MK_NATIVE_FUNCTION } from "../values.ts";
import { MK_OBJECT } from "../values.ts";
import Random from "../../libraries/Random.ts";
import List from "../../libraries/built-in/List.ts";
import String from "../../libraries/built-in/String.ts";
import JSON from "../../libraries/JSON.ts";

// List of all the libraries which are 'default', so the just need to be imported to be used
export const default_libraries = { GMath, Random, JSON };

// Parses the 'built-in' libraries
const libraries = [List, String]
const output_libraries = []
for (const lib of libraries)
{
    for (const [name, obj] of Object.entries(lib))
    {
        const properties = new Map<string, RuntimeValue>();
        for (const [key, value] of Object.entries(obj.functions)) properties.set(key, MK_NATIVE_FUNCTION((value as FunctionCall)));
        for (const [key, value] of Object.entries(obj.constants)) properties.set(key, value as RuntimeValue);
        
        output_libraries.push({name, object: MK_OBJECT(properties)})
    }
}
        
// List of all the libraries which are 'built-in', so the are already implemented
export const built_in_libraries = output_libraries;