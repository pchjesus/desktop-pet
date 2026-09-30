const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const electronPackageDir = path.join(root, 'node_modules', 'electron');
const electronInstallScript = path.join(electronPackageDir, 'install.js');
const electronDist = path.join(electronPackageDir, 'dist');
const electronExecutable = process.platform === 'win32'
  ? path.join(electronDist, 'electron.exe')
  : path.join(electronDist, 'electron');

function fail(message) {
  console.error(`ELECTRON PREPARE FAILED: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(electronPackageDir, 'package.json'))) {
  fail('node_modules/electron is missing. Run npm.cmd install first.');
}

if (fs.existsSync(electronExecutable)) {
  const electronPathFile = path.join(electronPackageDir, 'path.txt');
  if (process.platform === 'win32' && !fs.existsSync(electronPathFile)) {
    fs.writeFileSync(electronPathFile, 'electron.exe');
    console.log(`Electron path marker created: ${electronPathFile}`);
  }
  console.log(`Electron runtime already exists: ${electronExecutable}`);
  process.exit(0);
}

if (!fs.existsSync(electronInstallScript)) {
  fail(`Electron official install.js is missing: ${electronInstallScript}`);
}

console.log('Electron runtime is missing. Running Electron package install.js directly.');
console.log('This prepares the official Electron binary before tests and packaging.');

const result = spawnSync(process.execPath, [electronInstallScript], {
  cwd: electronPackageDir,
  stdio: 'inherit',
  windowsHide: false
});

if (result.error) {
  fail(`Could not start Electron install.js: ${result.error.message}`);
}

if (result.status !== 0) {
  fail(`Electron install.js exited with code ${result.status}.`);
}

if (!fs.existsSync(electronExecutable)) {
  fail(`Electron install.js completed but the Electron executable is still missing: ${electronExecutable}`);
}

console.log('Electron runtime preparation: PASS');
