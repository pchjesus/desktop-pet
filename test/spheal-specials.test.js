const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SphealCharacter = require('../src/characters/spheal');

const STATES = { IDLE: 'idle', WALK: 'walk', SIT: 'sit', SLEEP: 'sleep', DRAG: 'drag', REACT: 'react' };
function element() {
  const sprite = { src: '', getAttribute() { return this.src; }, setAttribute(_name, value) { this.src = value; } };
  return { sprite, style: {}, className: '', querySelector: () => sprite,
    classList: { add() {}, remove() {} }, addEventListener() {} };
}

test('icebeam traverses all timing boundaries, holds one frozen image for 1000ms, and cleans up', t => {
  let now = 100;
  t.mock.method(performance, 'now', () => now);
  const node = element();
  const character = new SphealCharacter(node, STATES);
  assert.equal(character.startSpecialAction('icebeam'), true);
  let elapsed = 0;
  const durations = [175, 175, ...Array(6).fill(150), 1000, ...Array(4).fill(125), 200];
  for (let i = 0; i < durations.length; i++) {
    const expected = `icebeam-${String(i + 1).padStart(2, '0')}.png`;
    for (const instant of [elapsed, elapsed + durations[i] - 1]) {
      now = 100 + instant;
      character.render();
      assert.ok(node.sprite.src.endsWith(expected), `${instant}: ${node.sprite.src}`);
      assert.equal(character.isSpecialActionActive(), true);
    }
    elapsed += durations[i];
  }
  assert.equal(elapsed, 2950);
  now = 3050;
  character.render();
  assert.equal(character.isSpecialActionActive(), false);
  assert.equal(node.sprite.src, character.baseSrc);
  assert.equal(node.className, 'spheal idle');
});

test('attacks replace clap only; duplicates, idle/walk/react and facing cannot replace attack art', t => {
  let now = 0;
  t.mock.method(performance, 'now', () => now);
  for (const attack of ['icebeam', 'watergun']) {
    const node = element();
    const character = new SphealCharacter(node, STATES);
    character.setState(STATES.REACT);
    assert.equal(character.startSpecialAction(attack), true);
    const startedAt = character.special.startedAt;
    for (const next of ['clap', 'watergun', 'icebeam', 'invalid']) {
      assert.equal(character.startSpecialAction(next), false);
      assert.equal(character.special.startedAt, startedAt);
    }
    for (const state of [STATES.IDLE, STATES.WALK, STATES.REACT, STATES.DRAG]) {
      character.setState(state);
      character.setFacing(-1);
      now = startedAt + 1300;
      character.render();
      assert.equal(node.className, `spheal special-${attack}`);
      assert.equal(character.facing, 1);
    }
    character.setState(STATES.WALK);
    now = startedAt + (attack === 'icebeam' ? 2950 : 2100);
    character.render();
    assert.equal(character.isSpecialActionActive(), false);
    assert.ok(node.sprite.src.endsWith('roll-01.png'));
    character.setFacing(-1);
    assert.equal(character.facing, -1);
  }
});

test('unchanged clap/watergun frame counts, frame timing and finite completion', t => {
  let now = 0;
  t.mock.method(performance, 'now', () => now);
  for (const [name, count, duration] of [['clap', 8, 180], ['watergun', 12, 175]]) {
    const node = element();
    const character = new SphealCharacter(node, STATES);
    const start = now;
    character.startSpecialAction(name);
    for (let frame = 0; frame < count; frame++) {
      now = start + frame * duration;
      character.render();
      assert.ok(node.sprite.src.endsWith(`${name}-${String(frame + 1).padStart(2, '0')}.png`));
    }
    now = start + count * duration;
    character.render();
    assert.equal(character.special, null);
    assert.equal(node.sprite.src, character.baseSrc);
  }
});

async function rendererHarness() {
  let now = 0;
  const listeners = {};
  const pet = element();
  pet.addEventListener = (name, handler) => { listeners[name] = handler; };
  const nodes = { pet, bubble: { style: {} }, spheal: element() };
  const calls = [];
  const context = vm.createContext({
    console, URLSearchParams, performance: { now: () => now },
    Date: { now: () => now }, setTimeout: () => 1, clearTimeout() {},
    setInterval: () => 1, clearInterval() {},
    location: { search: '?character=spheal' },
    document: { body: { dataset: {} }, getElementById: name => nodes[name] },
    window: {
      PetEngine: { STATES, chooseNextState: () => STATES.WALK,
        chooseTarget: () => ({}), stepToward: () => { throw new Error('movement while locked'); } },
      addEventListener: (name, handler) => { listeners[name] = handler; },
      petAPI: { getWindow: async () => ({ x: 40, y: 50 }), setIgnoreMouse() {},
        setPosition: () => calls.push('move'), dragStart: () => calls.push('drag-start'),
        dragMove: () => calls.push('drag-move'), dragEnd: () => calls.push('drag-end'),
        openFanProject: () => calls.push('pocketmon'), quit: () => calls.push('quit') }
    }
  });
  for (const file of ['src/characters/spheal.js', 'src/renderer.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  await new Promise(resolve => setImmediate(resolve));
  return { listeners, nodes, calls, run: source => vm.runInContext(source, context),
    time: value => { now = value; },
    click() {
      listeners.pointerdown({ button: 0, screenX: 0, screenY: 0 });
      listeners.pointerup({});
    },
    type(code) { for (const key of [...code, 'Enter']) listeners.keydown({ key }); }
  };
}

test('renderer requires a recent click, preserves commands, locks autonomous motion and permits drag/quit', async () => {
  const h = await rendererHarness();
  h.time(10);
  h.type('icebeam');
  assert.equal(h.run('character.special'), null);
  h.click();
  h.type('icebeam');
  assert.equal(h.run('character.special.type'), 'icebeam');
  assert.equal(h.nodes.bubble.textContent, '냉동빔!');
  h.time(1300);
  h.run('setState(PET_STATES.WALK); tick(1300)');
  assert.equal(h.calls.includes('move'), false);
  assert.ok(h.nodes.spheal.sprite.src.endsWith('icebeam-09.png'));
  h.click();
  h.type('watergun');
  assert.equal(h.run('character.special.type'), 'icebeam');
  h.listeners.pointerdown({ button: 0, screenX: 0, screenY: 0 });
  h.listeners.pointermove({ screenX: 10, screenY: 0 });
  h.listeners.pointerup({});
  assert.ok(h.calls.includes('drag-move'));
  h.time(2000);
  h.run('tick(2000)');
  assert.ok(h.nodes.spheal.sprite.src.endsWith('icebeam-09.png'));
  await h.listeners.contextmenu({ preventDefault() {} });
  assert.ok(h.calls.includes('quit'));
  h.time(2960);
  h.run('tick(2960)');
  assert.equal(h.run('character.special'), null);
  assert.equal(h.nodes.spheal.className, 'spheal idle');
  assert.ok(h.nodes.spheal.sprite.src.endsWith('spheal-base.png'));
  h.click();
  h.type('watergun');
  assert.equal(h.run('character.special.type'), 'watergun');
  h.click();
  h.type('pocketmon');
  assert.ok(h.calls.includes('pocketmon'));
});

test('expired click authorization does not launch icebeam', async () => {
  const h = await rendererHarness();
  h.click();
  h.time(5001);
  h.type('icebeam');
  assert.equal(h.run('character.special.type'), 'clap');
});
