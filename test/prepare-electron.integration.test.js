const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const sourceScript = path.join(projectRoot, 'scripts', 'prepare-electron.js');

function makeFakeElectronProject({ precreateRuntime = false, installerShouldRun = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-pet-electron-'));
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'node_modules', 'electron'), { recursive: true });
  fs.writeFileSync(path.join(root, 'scripts', 'prepare-electron.js'), fs.readFileSync(sourceScript));
  fs.writeFileSync(path.join(root, 'node_modules', 'electron', 'package.json'), JSON.stringify({ version: '44.5.0' }));
  const executableName = process.platform === 'win32' ? 'electron.exe' : 'electron';

  fs.writeFileSync(path.join(root, 'node_modules', 'electron', 'install.js'), `
    const fs = require('node:fs');
    const path = require('node:path');
    const executableName = process.platform === 'win32' ? 'electron.exe' : 'electron';
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, 'dist', executableName), 'fake electron');
  `);
  if (!installerShouldRun) {
    fs.writeFileSync(path.join(root, 'node_modules', 'electron', 'install.js'), 'process.exit(9);');
  }
  if (precreateRuntime) {
    fs.mkdirSync(path.join(root, 'node_modules', 'electron', 'dist'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'node_modules', 'electron', 'dist', executableName),
      'existing'
    );
  }
  return root;
}

test('prepare-electron executes the package install.js and verifies the resulting runtime', () => {
  const root = makeFakeElectronProject();
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'prepare-electron.js')], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    fs.existsSync(
      path.join(
        root,
        'node_modules',
        'electron',
        'dist',
        process.platform === 'win32' ? 'electron.exe' : 'electron'
      )
    ),
    true
  );
  fs.rmSync(root, { recursive: true, force: true });
});

test('prepare-electron does not rerun the installer when a runtime already exists', () => {
  const root = makeFakeElectronProject({ precreateRuntime: true, installerShouldRun: false });
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'prepare-electron.js')], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Electron runtime already exists/);
  fs.rmSync(root, { recursive: true, force: true });
});
