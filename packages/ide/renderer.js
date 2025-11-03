let editor;

require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: [
            'fn hello() {',
            '\tprint("Hello, world!")',
            '}',
            '',
            'hello()'
        ].join('\n'),
        language: 'gh3sp',
        theme: 'gh3spTheme',
        automaticLayout: true,
        inherit: true
    });
    // Definizione del linguaggio Gh3sp
    monaco.languages.register({ id: 'gh3sp' });

    // Definisci i token
    monaco.languages.setMonarchTokensProvider('gh3sp', {
        defaultToken: '',
        keywords: [
            'let', 'const', 'fn', 'if', 'else', 'for', 'while', 'foreach', 'in', 'not',
            'choose', 'chooseall', 'case', 'default', 'break', 'continue', 'pass',
            'import', 'export', 'reactive'
        ],
        builtins: ['str', 'int', 'length', 'type', 'print', 'input', 'assert'],
        booleans: ['true', 'false', 'null'],
        operators: [
            '+', '-', '*', '/', '%', '=', '+=', '-=', '*=', '/=', '%=',
            '==', '!=', '<=', '>=', '<', '>', '!', '&&', '||', '?', ':', '=>'
        ],
        symbols: /[=><!&|+\-*\/%?:]+/,
        tokenizer: {
            root: [
                [/#.*$/, 'comment.line.hashtag.gh3sp'],
                [/\/\*/, 'comment.block.gh3sp', '@comment'],
                [/"/, { token: 'string.quoted.double.gh3sp', next: '@string_double' }],
                [/'/, { token: 'string.quoted.single.gh3sp', next: '@string_single' }],
                [/\b0x[0-9a-fA-F]+\b/, 'constant.numeric.hex.gh3sp'],
                [/\b\d+\.\d+\b/, 'constant.numeric.float.gh3sp'],
                [/\b\d+\b/, 'constant.numeric.integer.gh3sp'],
                [/\bchoose\b/, 'keyword.control.choose.gh3sp', '@chooseBlock'],
                [/\b(let|const|fn|if|else|for|while|foreach|in|not|chooseall|break|continue|pass|import|export|reactive)\b/, 'keyword.control.gh3sp'],
                [/\b(case|default)\b/, 'keyword.control.case.gh3sp'],
                [/\b(str|int|length|type|print|input|assert)\b/, 'support.function.builtin.gh3sp'],
                [/\b(true|false|null)\b/, 'constant.language.boolean.gh3sp'],
                [/\bfn\s+([a-zA-Z_][\w]*)/, ['keyword.control.gh3sp','entity.name.function.gh3sp']],
                [/\.[a-zA-Z_][\w]*/, 'variable.other.property.gh3sp'],
                [/\b[a-zA-Z_][\w]*\b/, 'variable.other.gh3sp'],
                [/@symbols/, {
                    cases: {
                        '@operators': 'keyword.operator.gh3sp',
                        '@default': ''
                    }
                }],
                [/[{}\[\]]/, 'punctuation.section.block.begin.gh3sp'],
                [/[,:]/, 'punctuation.separator.case.gh3sp'],
            ],
            comment: [
                [/[^\/*]+/, 'comment.block.gh3sp'],
                [/\*\//, 'comment.block.gh3sp', '@pop'],
                [/[\/*]/, 'comment.block.gh3sp']
            ],
            string_double: [
                [/[^\\"]+/, 'string.quoted.double.gh3sp'],
                [/\\./, 'constant.character.escape.gh3sp'],
                [/"/, { token: 'string.quoted.double.gh3sp', next: '@pop' }]
            ],
            string_single: [
                [/[^\\']+/, 'string.quoted.single.gh3sp'],
                [/\\./, 'constant.character.escape.gh3sp'],
                [/'/, { token: 'string.quoted.single.gh3sp', next: '@pop' }]
            ],
            chooseBlock: [
                [/\s*[a-zA-Z_][\w]*(\.[a-zA-Z_][\w]*)*/, 'variable.parameter.choose.gh3sp'],
                [/\s*=>\s*[a-zA-Z_][\w]*/, 'keyword.operator.arrow.gh3sp'],
                [/\{/, 'punctuation.section.block.begin.gh3sp', '@chooseBody']
            ],
            chooseBody: [
                [/\}/, { token: 'punctuation.section.block.end.gh3sp', next: '@pop' }],
                { include: 'root' }
            ]
        }
    });

    // Tema personalizzato
    monaco.editor.defineTheme('gh3spTheme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment.line.hashtag.gh3sp', foreground: '6A9955', fontStyle: 'italic' },
            { token: 'comment.block.gh3sp', foreground: '6A9955', fontStyle: 'italic' },
            { token: 'keyword.control.gh3sp', foreground: 'C586C0', fontStyle: 'bold' },
            { token: 'keyword.control.choose.gh3sp', foreground: 'C586C0', fontStyle: 'bold' },
            { token: 'keyword.control.case.gh3sp', foreground: 'C586C0', fontStyle: 'bold' },
            { token: 'variable.parameter.choose.gh3sp', foreground: '4EC9B0' },
            { token: 'string.quoted.double.gh3sp', foreground: 'CE9178' },
            { token: 'string.quoted.single.gh3sp', foreground: 'CE9178' },
            { token: 'constant.numeric.float.gh3sp', foreground: 'B5CEA8' },
            { token: 'constant.numeric.integer.gh3sp', foreground: 'B5CEA8' },
            { token: 'constant.numeric.hex.gh3sp', foreground: 'B5CEA8' },
            { token: 'constant.language.boolean.gh3sp', foreground: '569CD6', fontStyle: 'bold' },
            { token: 'variable.other.gh3sp', foreground: '9CDCFE' },
            { token: 'support.function.builtin.gh3sp', foreground: 'DCDCAA' },
            { token: 'entity.name.function.gh3sp', foreground: 'DCDCAA', fontStyle: 'bold' },
            { token: 'variable.other.property.gh3sp', foreground: '4EC9B0' },
            { token: 'keyword.operator.gh3sp', foreground: 'D4D4D4' },
            { token: 'punctuation.separator.case.gh3sp', foreground: '808080' },
            { token: 'punctuation.section.block.begin.gh3sp', foreground: '808080' },
            { token: 'punctuation.section.block.end.gh3sp', foreground: '808080' }
        ],
        colors: {
            "activityBar.background": "#333842",
            "activityBar.foreground": "#D7DAE0",
            "editorInlayHint.background": "#2C313A",
            "editorInlayHint.foreground": "#636e83",
            "notebook.cellEditorBackground": "#2C313A",
            "activityBarBadge.background": "#528BFF",
            "activityBarBadge.foreground": "#D7DAE0",
            "button.background": "#4D78CC",
            "button.foreground": "#FFFFFF",
            "button.hoverBackground": "#6087CF",
            "diffEditor.insertedTextBackground": "#00809B33",
            "dropdown.background": "#353b45",
            "dropdown.border": "#181A1F",
            "editorIndentGuide.activeBackground": "#626772",
            "editor.background": "#282C34",
            "editor.foreground": "#ABB2BF",
            "editor.lineHighlightBackground": "#99BBFF0A",
            "editor.selectionBackground": "#3E4451",
            "editorCursor.foreground": "#528BFF",
            "editor.findMatchHighlightBackground": "#528BFF3D",
            "editorGroup.background": "#21252B",
            "editorGroup.border": "#181A1F",
            "editorGroupHeader.tabsBackground": "#21252B",
            "editorIndentGuide.background": "#ABB2BF26",
            "editorLineNumber.foreground": "#636D83",
            "editorLineNumber.activeForeground": "#ABB2BF",
            "editorWhitespace.foreground": "#ABB2BF26",
            "editorRuler.foreground": "#ABB2BF26",
            "editorHoverWidget.background": "#21252B",
            "editorHoverWidget.border": "#181A1F",
            "editorSuggestWidget.background": "#21252B",
            "editorSuggestWidget.border": "#181A1F",
            "editorSuggestWidget.selectedBackground": "#2C313A",
            "editorWidget.background": "#21252B",
            "editorWidget.border": "#3A3F4B",
            "input.background": "#1B1D23",
            "input.border": "#181A1F",
            "focusBorder": "#528BFF",
            "list.activeSelectionBackground": "#2C313A",
            "list.activeSelectionForeground": "#D7DAE0",
            "list.focusBackground": "#2C313A",
            "list.hoverBackground": "#2C313A66",
            "list.highlightForeground": "#D7DAE0",
            "list.inactiveSelectionBackground": "#2C313A",
            "list.inactiveSelectionForeground": "#D7DAE0",
            "notification.background": "#21252B",
            "pickerGroup.border": "#528BFF",
            "scrollbarSlider.background": "#4E566680",
            "scrollbarSlider.activeBackground": "#747D9180",
            "scrollbarSlider.hoverBackground": "#5A637580",
            "sideBar.background": "#21252B",
            "sideBarSectionHeader.background": "#333842",
            "statusBar.background": "#21252B",
            "statusBar.foreground": "#9DA5B4",
            "statusBarItem.hoverBackground": "#2C313A",
            "statusBar.noFolderBackground": "#21252B",
            "tab.activeBackground": "#282C34",
            "tab.activeForeground": "#D7DAE0",
            "tab.border": "#181A1F",
            "tab.inactiveBackground": "#21252B",
            "titleBar.activeBackground": "#21252B",
            "titleBar.activeForeground": "#9DA5B4",
            "titleBar.inactiveBackground": "#21252B",
            "titleBar.inactiveForeground": "#9DA5B4",
            "statusBar.debuggingForeground": "#FFFFFF",
            "extensionButton.prominentBackground": "#2BA143",
            "extensionButton.prominentHoverBackground": "#37AF4E",
            "badge.background": "#528BFF",
            "badge.foreground": "#D7DAE0",
            "peekView.border": "#528BFF",
            "peekViewResult.background": "#21252B",
            "peekViewResult.selectionBackground": "#2C313A",
            "peekViewTitle.background": "#1B1D23",
            "peekViewEditor.background": "#1B1D23"
        }
    });

    // Imposta il tema
    monaco.editor.setTheme('gh3spTheme');
});

document.getElementById('runBtn').addEventListener('click', () => {
    const code = editor.getValue();
    console.log(code)
    window.electron.sendCode(code);
});

window.electron.onCodeResponse((result, type) => {
    console.log(result, type);
    logToConsole(result, type);
});

function logToConsole(text, type = "info") {
    const line = document.createElement("div");
    line.className = `log ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    line.innerHTML = `[${timestamp}] ${text}`;
    document.getElementById("output").appendChild(line);
    document.getElementById("console").scrollTop = document.getElementById("console").scrollHeight;
}
  
function clearConsole() {
    document.getElementById("output").innerHTML = '';
}

const inputDialog = document.getElementById('input-dialog');
const userInput = document.getElementById('user-input');
const submitInputButton = document.getElementById('submit-input');

let inputValue = null; // Valore da restituire all'input.

// Mostra la finestra di input.
function showInputDialog(prompt) {
    inputDialog.querySelector('label').innerText = prompt
    inputValue = null;
    userInput.value = ''; // Resetta il campo input.
    inputDialog.style.display = 'flex'; // Mostra il dialogo.
}

// Nascondi la finestra e salva il valore.
submitInputButton.addEventListener('click', () => {
    inputValue = userInput.value; // Ottieni il valore inserito.
    inputDialog.style.display = 'none'; // Nascondi il dialogo.
});

// Funzione sincrona per l'input.
function requestInputSync(prompt) {
    showInputDialog(prompt); // Mostra il dialogo di input.
    while (!inputValue) {
        require('deasync').runLoopOnce();
    }
    console.log("ciao")
    return inputValue;
}

//requestInputSync("Input Dio Boia:")

document.getElementById('openBtn').addEventListener('click', async () => {
    const path = await window.electron.openFile();
    if (path) {
        const code = await fetch(path).then(response => response.text());
        editor.setValue(code);
        logToConsole(`Caricato codice da ${path}`, 'info');
    }
});

document.getElementById('saveBtn').addEventListener('click', async () => {
    const code = editor.getValue();
    console.log(typeof code)
    const path = await window.electron.saveFile(code);
    if (path) logToConsole(`File salvato: ${path}`, 'success');
});

document.getElementById('clearConsoleBtn').addEventListener('click', async () => {
    clearConsole()
});
  