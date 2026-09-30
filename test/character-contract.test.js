const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const NeukguCharacter = require('../src/characters/neukgu');
const GrowlitheCharacter = require('../src/characters/growlithe');
const RoyceCharacter = require('../src/characters/royce');

const STATES = Object.freeze({
  IDLE: 'idle', WALK: 'walk', SIT: 'sit', SLEEP: 'sleep', DRAG: 'drag', REACT: 'react'
});

function makeNeukguElement() {
  return {
    className: 'neukgu idle',
    style: {},
    classList: { add() {} },
    animate() { return { cancel() {}, onfinish: null }; }
  };
}

function makeRoyceElement() {
  return {
    className: 'royce idle',
    style: {},
    classList: { add() {} },
    animate() { return { cancel() {}, onfinish: null }; }
  };
}

function makeGrowlitheElement() {
  const sprite = {
    src: '',
    getAttribute(name) { return name === 'src' ? this.src : null; },
    setAttribute(name, value) { if (name === 'src') this.src = value; }
  };
  return {
    className: 'growlithe idle',
    style: {},
    querySelector(selector) { return selector === '.growlithe-sprite' ? sprite : null; },
    sprite
  };
}

const SHARED_CHARACTER_METHODS = ['setState', 'setFacing', 'render'];

for (const [name, Character, makeElement] of [
  ['neukgu', NeukguCharacter, makeNeukguElement],
  ['growlithe', GrowlitheCharacter, makeGrowlitheElement],
  ['royce', RoyceCharacter, makeRoyceElement]
]) {
  test(`${name} implements the shared character contract`, () => {
    const character = new Character(makeElement(), STATES);
    for (const method of SHARED_CHARACTER_METHODS) {
      assert.equal(typeof character[method], 'function', `${name}.${method} must exist`);
    }
  });
}

test('character modules keep character-specific responsibilities out of Pet Engine', () => {
  const renderer = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');
  const engine = fs.readFileSync(path.join(__dirname, '..', 'src', 'pet-engine.js'), 'utf8');
  assert.match(renderer, /new globalThis\.NeukguCharacter/);
  assert.match(renderer, /new globalThis\.GrowlitheCharacter/);
  assert.match(renderer, /new globalThis\.RoyceCharacter/);
  assert.doesNotMatch(engine, /NeukguCharacter|GrowlitheCharacter|growlithe/i);
});

test('character-specific movement direction is optional and does not expand the shared contract', () => {
  const renderer = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');
  assert.match(renderer, /typeof character\.setMovementDirection === 'function'/);
});

test('character instances do not share mutable character state', () => {
  const neukgu = new NeukguCharacter(makeNeukguElement(), STATES);
  const growlithe = new GrowlitheCharacter(makeGrowlitheElement(), STATES);
  const royce = new RoyceCharacter(makeRoyceElement(), STATES);

  neukgu.setFacing(-1);
  growlithe.setFacing(1);
  royce.setFacing(-1);

  assert.equal(neukgu.facing, -1);
  assert.equal(growlithe.facing, 1);
  assert.equal(royce.facing, -1);
});
