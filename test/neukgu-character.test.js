const test = require('node:test');
const assert = require('node:assert/strict');
const NeukguCharacter = require('../src/characters/neukgu');

const STATES = Object.freeze({
  IDLE: 'idle',
  WALK: 'walk',
  SIT: 'sit',
  SLEEP: 'sleep',
  DRAG: 'drag',
  REACT: 'react'
});

function makeElement() {
  return {
    className: 'neukgu idle',
    classList: {
      add(name) { this.added = name; }
    },
    style: {},
    animate() {
      return {
        cancel() {},
        onfinish: null
      };
    }
  };
}

test('neukgu character maps shared states to the existing visual classes', () => {
  const element = makeElement();
  const neukgu = new NeukguCharacter(element, STATES);

  neukgu.setState(STATES.WALK);
  assert.equal(element.className, 'neukgu walk');

  neukgu.setState(STATES.SLEEP);
  assert.equal(element.className, 'neukgu sleep');

  neukgu.setState(STATES.DRAG);
  assert.equal(element.className, 'neukgu drag');
  assert.equal(element.classList.added, 'react');
});

test('neukgu character preserves facing state without changing the shared renderer contract', () => {
  const element = makeElement();
  const neukgu = new NeukguCharacter(element, STATES);

  neukgu.render();
  assert.equal(element.style.transform, 'scaleX(1)');

  neukgu.setFacing(-1);
  assert.equal(neukgu.facing, -1);
  assert.ok(neukgu.turnAnimation);

  neukgu.turnAnimation.onfinish();
  assert.equal(element.style.transform, 'scaleX(-1)');
});

test('renderer delegates neukgu-specific visual behavior to the character module', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const renderer = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');
  assert.match(renderer, /new globalThis\.NeukguCharacter/);
  assert.doesNotMatch(renderer, /neukgu\.className|neukgu\.style\.transform|neukgu\.animate/);
});
