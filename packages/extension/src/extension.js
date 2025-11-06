"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function addLaunchConfig() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage("Non è stato trovato un workspace.");
        return;
    }
    const launchJsonPath = path.join(workspaceFolder, ".vscode", "launch.json");
    // Controlla se il file launch.json esiste
    fs.readFile(launchJsonPath, "utf8", (err, data) => {
        if (err) {
            // Se il file non esiste, crealo con la configurazione
            const newLaunchConfig = {
                version: "0.2.0",
                configurations: [
                    {
                        name: "Esegui Gh3sp",
                        type: "node",
                        request: "launch",
                        program: "${config:gh3spInterpreterPath}",
                        args: ["${file}"],
                        console: "integratedTerminal",
                    },
                ],
            };
            fs.mkdirSync(path.dirname(launchJsonPath), { recursive: true });
            fs.writeFile(launchJsonPath, JSON.stringify(newLaunchConfig, null, 2), (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Errore durante la creazione del launch.json");
                }
                else {
                    vscode.window.showInformationMessage("Configurazione di esecuzione aggiunta con successo!");
                }
            });
        }
        else {
            const launchConfig = JSON.parse(data);
            const newConfig = {
                name: "Esegui Gh3sp",
                type: "node",
                request: "launch",
                program: "${config:gh3spInterpreterPath}",
                args: ["${file}"],
                console: "integratedTerminal",
            };
            for (const config of launchConfig.configurations) {
                if (config.name === newConfig.name) {
                    vscode.window.showInformationMessage("Configurazione di esecuzione già presente.");
                    return;
                }
            }
            launchConfig.configurations.push(newConfig);
            fs.writeFile(launchJsonPath, JSON.stringify(launchConfig, null, 2), (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Errore durante la modifica del launch.json");
                }
                else {
                    vscode.window.showInformationMessage("Configurazione di esecuzione aggiunta con successo!");
                }
            });
        }
    });
}
async function updateInterpreterPath(value) {
    var config = vscode.workspace.getConfiguration();
    await config.update("gh3spInterpreterPath", value, true);
    let interpreterPath = config.get("gh3spInterpreterPath");
    vscode.window.showInformationMessage("Path Salvato: ${interpreterPath}");
}
const currentWorkSpace = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
function activate(context) {
    const keywords = ["let", "const", "fn", "if", "else", "for", "while", "foreach", "in", "choose", "chooseall", "not", "case", "default", "import", "export", "break", "pass", "continue", "reactive"];
    console.log(currentWorkSpace);
    const provider = vscode.languages.registerCompletionItemProvider("gh3sp", {
        provideCompletionItems(document, position) {
            return keywords.map((keyword) => {
                const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
                item.insertText = keyword;
                return item;
            });
        },
    });
    let runCode = vscode.commands.registerCommand("gh3sp.runCode", () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("Nessun file aperto.");
            return;
        }
        const document = editor.document;
        const filePath = document.uri.fsPath;
        const code = document.getText();
        const terminal = vscode.window.createTerminal("Gh3sp Terminal");
        // Avvia l’interprete dentro un terminale
        terminal.show();
        terminal.sendText(`gh3sp "${filePath}"`);
    });
    let selectInterpreter = vscode.commands.registerCommand("gh3sp.selectInterpreter", async () => {
        const defaultPath = "C:/Program Files/Gh3sp";
        // Controlla se la cartella esiste
        fs.readdir(defaultPath, { withFileTypes: true }, (err, files) => {
            if (err || files.length === 0) {
                // Se non esiste o non ci sono versioni, chiedi all'utente di selezionare il file gh3sp.exe
                vscode.window.showErrorMessage("Non sono state trovate versioni in C:/ProgramFiles/Gh3sp. Seleziona direttamente il file gh3sp.exe.");
                askForFilePath();
            }
            else {
                // Filtra le sottocartelle che rappresentano versioni (es. "2.0.1", "2.2.2")
                const versionFolders = files.filter((file) => file.isDirectory() && /^\d+\.\d+\.\d+$/.test(file.name));
                if (versionFolders.length === 0) {
                    vscode.window.showErrorMessage("Nessuna versione valida trovata in C:/ProgramFiles/Gh3sp.");
                    askForFilePath();
                    return;
                }
                // Mostra una lista delle versioni trovate nella cartella di default
                const versionChoices = versionFolders.map((folder) => ({
                    label: folder.name,
                    description: path.join(defaultPath, folder.name, "gh3sp.exe"),
                    iconPath: undefined,
                }));
                // Aggiungi un separatore
                const separator = {
                    label: "",
                    kind: -1,
                    description: "",
                    iconPath: undefined,
                    detail: "",
                };
                versionChoices.push(separator);
                // Aggiungi l'opzione per selezionare manualmente il file
                versionChoices.push({
                    label: "Seleziona il percorso dell'interprete...",
                    description: "",
                    iconPath: vscode.ThemeIcon.Folder,
                });
                // Mostra le versioni disponibili e l'opzione per il percorso manuale
                vscode.window
                    .showQuickPick(versionChoices, {
                    placeHolder: "Seleziona un interprete Gh3sp",
                })
                    .then((selected) => {
                    if (selected) {
                        if (selected.label === "Seleziona il percorso dell'interprete...") {
                            askForFilePath(); // Chiedi il percorso manuale
                        }
                        else {
                            vscode.window.showInformationMessage(`Interprete Gh3sp selezionato: ${selected.description}`);
                            updateInterpreterPath(selected.description); // Salva il percorso selezionato
                        }
                    }
                });
            }
        });
        // Funzione per chiedere il percorso del file gh3sp.exe manualmente
        async function askForFilePath() {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                openLabel: "Seleziona gh3sp.exe",
                filters: {
                    "Esegui gh3sp": ["exe"],
                },
            });
            if (fileUri && fileUri.length > 0) {
                const selectedPath = fileUri[0].fsPath;
                updateInterpreterPath(selectedPath);
                vscode.window.showInformationMessage(`Interprete Gh3sp selezionato: ${selectedPath}`);
            }
            else {
                vscode.window.showErrorMessage("Nessun file selezionato.");
            }
        }
    });
    addLaunchConfig();
    context.subscriptions.push(provider, runCode, selectInterpreter);
}
exports.activate = activate;
