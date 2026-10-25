const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const create = require('../src/input-diagnostics');
function harness(blocked = false) {
  const entries = [], created = [];
  const fakeFs = {
    mkdirSync: () => { if (blocked) throw Error('permission denied'); },
    writeFileSync: (file, contents, opts) => created.push({ file, contents, opts }),
    statSync: () => ({ size: 64 }),
    appendFileSync: (_file, line) => entries.push(line)
  };
  const app = { getPath: () => '/tmp' };
  const screen = { getDisplayNearestPoint: () => ({ scaleFactor: 1.5 }) };
  return { entries, created, diag: create({ app, fs: fakeFs, path, screen }) };
}
test('starts local file and only logs allowed pointer fields', () => {
  const h = harness();
  assert.match(h.diag.start(), /DesktopPet-input-diagnostic-/);
  assert.equal(h.created[0].opts.flag, 'wx');
  h.diag.rendererEvent('pointerdown', { target: 'pet', trusted: true,
    clientX: 12, screenY: 60, typedText: 'secret-should-not-appear' });
  h.diag.rendererEvent('keydown', { typedText: 'hidden' });
  const log = h.entries.join('');
  assert.match(log, /renderer-pointerdown/);
  assert.doesNotMatch(log, /keydown|secret-should-not-appear|hidden/);
});
test('samples OS-relative cursor coords and click-through state', () => {
  const h = harness();h.diag.start();
  h.diag.sample({ win: { getPosition: () => [100, 150], getSize: () => [180, 150],
    isFocused: () => true }, cursor: { x: 130, y: 178 },
    overPet: true, ignored: false, dragging: false, character: 'growlithe' });
  const item = h.entries.map(line => JSON.parse(line)).find(x => x.kind === 'sample');
  assert.equal(item.relX, 30);assert.equal(item.relY, 28);
  assert.equal(item.ignored, false);assert.equal(item.scale, 1.5);
});
test('disk write failure never blocks pet startup', () => {
  const h = harness(true);assert.doesNotThrow(() => h.diag.start());
  assert.equal(h.diag.start(), null);
});
test('main only samples existing hit testing and renderer capture remains passive', () => {
  const main = fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8');
  const renderer = fs.readFileSync(path.join(__dirname, '../src/renderer.js'), 'utf8');
  assert.match(main, /inputDiagnostics\.sample\(/);
  assert.match(main, /inputDiagnostics\.rendererEvent\(/);
  assert.match(renderer, /passive: true/);
  assert.doesNotMatch(renderer.slice(renderer.indexOf('Passive diagnostic-only'),renderer.indexOf('let easterEggEligibleUntil')), /preventDefault\(|stopPropagation\(|keydown/);
});
