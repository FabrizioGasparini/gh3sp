const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src'); // Modifica il percorso se necessario

const addTsExtensions = (dir) => {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      addTsExtensions(filePath); // Ricorsione nelle sottodirectory
    } else if (file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      // Aggiungi l'estensione .ts agli import, escludendo quelli che iniziano con "node:"
      content = content.replace(/(import .*? from ['"])(?!node:)(.*?)(['"])/g, (match, p1, p2, p3) => {
        if (!p2.endsWith('.ts')) {
          return `${p1}${p2}.ts${p3}`;
        }
        return match;
      });
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
};

addTsExtensions(directoryPath);
