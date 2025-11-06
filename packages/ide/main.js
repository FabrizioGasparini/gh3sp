const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const { execFile } = require('node:child_process');
const fs = require('node:fs');

let win;
function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Se necessario
            nodeIntegration: true,  // Abilita l'integrazione di Node.js
            contextIsolation: true // Disabilita l'isolamento del contesto
        },
        icon: path.join(__dirname, 'gh3sp.png'), // Icona della finestra
        autoHideMenuBar: true, // Nasconde la barra del menu
    });

    win.loadFile('index.html');
}

ipcMain.on('run-code', (event, code) => {
    const tempFilePath = path.join(__dirname, '../temp.gh3'); // Percorso del file temporaneo

    fs.writeFileSync(tempFilePath, code); // Scrivi il codice nel file

    execFile(path.join(__dirname, 'gh3sp.exe'), [tempFilePath], (error, stdout, stderr) => {
        if (error) {
            const errorMessage = error.message.split('\n')[1] || 'Errore sconosciuto durante l\'esecuzione del codice.';
            
            event.reply('run-code-response', errorMessage, 'error');
            return;
        }
        if (stderr) {
            event.reply('run-code-response', stderr, 'error');
            return;
      }
      
        // Restituisci l'output dell'interprete
        event.reply('run-code-response', stdout, 'info');
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


ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Gh3sp Files', extensions: ['gh3'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (canceled) return null;
    return filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (_, code) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Salva File',
        defaultPath: path.join(app.getPath('documents'), 'nuovo_file.gh3'),
        filters: [
            { name: 'Gh3sp Files', extensions: ['gh3'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    if (canceled) return null;
    
    fs.writeFileSync(filePath, code);
    return filePath;
});