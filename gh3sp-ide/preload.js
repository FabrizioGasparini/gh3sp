const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    sendCode: (code) => ipcRenderer.send('run-code', code),
    onCodeResponse: (callback) => ipcRenderer.on('run-code-response', (event, result) => {
        callback(parseResult(result))
    }),
});

function parseResult(text) {
    const ansiRegex = /\x1b\[(\d+)(;(\d+))?m/g;
    const colorMap = {
        '31': 'red',  // Rosso
        '32': 'green', // Verde
        '33': 'yellow', // Giallo
        '34': 'blue',  // Blu
        '35': 'magenta', // Magenta
        '36': 'cyan',  // Ciano
        '37': 'white', // Bianco
    };

    return text.replace(ansiRegex, (match, code, offset) => `${code != 0 ? '<span style="color: ' + colorMap[code] + ';">': "</span>"}`)
}