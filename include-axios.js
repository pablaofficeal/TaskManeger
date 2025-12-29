const zipfile = require('yauzl');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const vsixFile = 'taskmanager-vscode-1.2.0.vsix';
const tempDir = 'temp_vsix_extract';
const extractDir = path.join(tempDir, 'extension');

// Распаковываем VSIX
execSync(`unzip -q ${vsixFile} -d ${tempDir}`);

// Копируем axios
if (fs.existsSync('node_modules/axios')) {
  const destAxios = path.join(extractDir, 'node_modules', 'axios');
  fs.mkdirSync(path.dirname(destAxios), { recursive: true });
  execSync(`cp -r node_modules/axios ${destAxios}`);
  console.log('Copied axios to package');
}

// Переупаковываем
execSync(`cd ${tempDir} && zip -r -q ../${vsixFile} .`);
execSync(`rm -rf ${tempDir}`);
console.log('VSIX repackaged with axios');

