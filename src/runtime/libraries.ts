import path from "node:path";

export async function compileLibrary(filePath: string) {
    filePath = "file:///" + path.resolve(filePath).replaceAll("\\", "/");
    const library = await import(filePath);

    if (!library.default.constants && !library.default.functions) {
        throw new Error(`Libreria ${filePath} non contiene un export corretto`);
    }
    return library.default;
}
