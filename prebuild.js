const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, "src"); // Modifica il percorso se necessario

const removeTsExtensions = (dir) => {
    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            removeTsExtensions(filePath); // Ricorsione nelle sottodirectory
        } else if (file.endsWith(".ts")) {
            let content = fs.readFileSync(filePath, "utf8");
            content = content.replace(/\.ts/g, ""); // Rimuove le estensioni .ts
            fs.writeFileSync(filePath, content, "utf8");
        }
    });
};

removeTsExtensions(directoryPath);
