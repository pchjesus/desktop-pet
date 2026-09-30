const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

test('Windows build uses the locally installed Electron distribution', () => {
  assert.equal(packageJson.version, '0.1.8');
  assert.equal(packageJson.devDependencies.electron, '44.5.0');
  assert.equal(packageJson.devDependencies['electron-builder'], '26.0.12');
  assert.equal(packageJson.build.electronDist, 'node_modules/electron/dist');
  assert.equal(packageJson.scripts.dist, 'electron-builder --win --x64');
  assert.deepEqual(packageJson.build.win.target, ['portable']);
  assert.equal(packageJson.build.win.signAndEditExecutable, false);
  assert.equal(packageJson.scripts['dist:installer'], 'electron-builder --win --x64 --config.win.target=nsis');
  assert.equal(packageJson.scripts.start, 'node node_modules/electron/cli.js .');
});

test('Windows helper scripts use npm.cmd for dependency/test commands', () => {
  for (const file of ['BUILD-WINDOWS.bat', 'INSTALL-WINDOWS.bat']) {
    const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');
    assert.match(content, /CALL\s+npm\.cmd/);
  }
});

test('Windows run scripts use the verified Electron CLI entry point', () => {
  for (const file of ['INSTALL-WINDOWS.bat', 'RUN-WINDOWS.bat']) {
    const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');
    assert.match(content, /node node_modules\\electron\\cli\.js \./);
    assert.doesNotMatch(content, /npm\.cmd\s+start/);
  }
});

test('Windows build prepares Electron through an explicit script', () => {
  const build = fs.readFileSync(path.join(projectRoot, 'BUILD-WINDOWS.bat'), 'utf8');
  assert.match(build, /CALL\s+npm\.cmd\s+run\s+prepare:electron/);
  assert.doesNotMatch(build, /npm\.cmd\s+rebuild\s+electron/);
  assert.match(build, /DesktopPet-0\.1\.8-portable\.exe/);
});

test('Electron preparation script executes the Electron package install.js directly', () => {
  const script = fs.readFileSync(path.join(projectRoot, 'scripts', 'prepare-electron.js'), 'utf8');
  assert.match(script, /electronInstallScript/);
  assert.match(script, /spawnSync\(process\.execPath, \[electronInstallScript\]/);
  assert.match(script, /electronPackageDir.*install\.js/);
  assert.doesNotMatch(script, /install-electron\.cmd/);
  assert.doesNotMatch(script, /install-electron/);
  assert.match(script, /electronExecutable/);
  assert.match(script, /process\.execPath/);
  assert.match(script, /install\.js/);
});
