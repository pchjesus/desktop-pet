const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const electronPackage = path.join(root, 'node_modules', 'electron', 'package.json');
const electronDist = path.resolve(root, pkg.build.electronDist);

function fail(message) {
  console.error(`ELECTRON PREFLIGHT FAILED: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(electronPackage)) {
  fail('node_modules/electron is missing. Run npm.cmd install first.');
}

const electron = JSON.parse(fs.readFileSync(electronPackage, 'utf8'));
console.log(`Electron package: ${electron.version}`);
console.log(`Electron distribution: ${electronDist}`);

if (!fs.existsSync(electronDist)) {
  fail('Electron distribution folder is missing. The Electron postinstall/download did not complete.');
}

if (process.platform === 'win32') {
  const exe = path.join(electronDist, 'electron.exe');
  if (!fs.existsSync(exe)) {
    fail('electron.exe is missing. The Windows Electron binary has not been downloaded yet.');
  }
  try {
    const output = execFileSync(exe, ['--version'], { encoding: 'utf8', timeout: 15000, windowsHide: true }).trim();
    console.log(`Windows Electron binary: OK (${output})`);
    if (!output.includes(`v${electron.version}`)) {
      fail(`Electron binary version mismatch. Expected v${electron.version}, got ${output || '<empty>'}.`);
    }
  } catch (error) {
    fail(`Electron binary exists but could not execute: ${error.message}`);
  }
} else {
  console.log(`Non-Windows host (${process.platform}): platform-specific electron.exe check skipped.`);
}

console.log('Electron preflight: PASS');
