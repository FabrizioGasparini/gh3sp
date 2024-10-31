const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const { execFile } = require('child_process');
const fs = require('fs');

let win;
function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Se necessario
            nodeIntegration: true,  // Abilita l'integrazione di Node.js
            contextIsolation: true // Disabilita l'isolamento del contesto
        }
    });

    win.loadFile('index.html');
}

ipcMain.on('run-code', (event, code) => {
    const tempFilePath = path.join(__dirname, '../temp.gh3'); // Percorso del file temporaneo

    fs.writeFileSync(tempFilePath, code); // Scrivi il codice nel file

    execFile(path.join(__dirname, 'gh3sp.exe'), [tempFilePath], (error, stdout, stderr) => {
        if (error) {
            event.reply('run-code-response', 'Errore: ' + error.message);
            return;
        }
        if (stderr) {
            event.reply('run-code-response', 'Errore: ' + stderr);
            return;
      }
      
        // Restituisci l'output dell'interprete
        event.reply('run-code-response', stdout);
    });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
