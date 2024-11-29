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
        theme: 'vs-dark',
        automaticLayout: true,
        inherit: true
    });
    // Definizione del linguaggio Gh3sp
    monaco.languages.register({ id: 'gh3sp' });

    // Definisci i token
    monaco.languages.setMonarchTokensProvider('gh3sp', {
        tokenizer: {
            root: [
                // Parole chiave
                [/let|const|fn|if|else|for|while|foreach|in|import|true|false|null/, { token: 'keyword' }],
                // Identificatori
                [/[_a-zA-Z][\w]*/, { token: 'identifier' }],
                // Numeri
                [/\d+/, { token: 'number' }],
                // Stringhe
                [/["'][^"']*["']/, { token: 'string' }],
                // Operatori
                [/[+\-*\/=<>^?%\!]/, { token: 'operator' }],
                // Simboli di raggruppamento
                [/[.,:;?(){}\[\]=+\-*/%^!<>]/, { token: 'delimiter' }],
                // Commenti
                [/#.*$/, { token: 'comment' }],
                [/\/\*.*\*\//, { token: 'comment.block' }],
            ]
        }
    });

    monaco.editor.defineTheme('gh3spTheme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: 'ce63eb', fontStyle: 'bold' }, // Colore per le parole chiave
            { token: 'delimiter', foreground: 'A6ACCE' }, // Colore per i delimitatori
            { token: 'operator', foreground: 'D19A66' }, // Colore per gli operatori
            { token: 'comment', foreground: 'aaaaaa', fontStyle: 'italic' }, // Colore per i commenti
            { token: 'string', foreground: 'CE9178' }, // Colore per le stringhe
            { token: 'number', foreground: 'B5CEA8' }, // Colore per i numeri
            { token: 'identifier', foreground: 'D19A66' }, // Colore per i numeri
        ],
        colors: {
            'editor.foreground': '#FFFFFF',
            'editor.background': '#1E1E1E',
            'editorCursor.foreground': '#FFFFFF',
            'editor.lineHighlightBackground': '#2A2A2A',
            // Altri colori di configurazione
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

window.electron.onCodeResponse((result) => {
    document.getElementById('output').innerHTML = result; // Mostra l'output
});

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

requestInputSync("Input Dio Boia:")