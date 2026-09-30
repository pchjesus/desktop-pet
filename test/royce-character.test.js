const test = require('node:test');
const assert = require('node:assert/strict');
const RoyceCharacter = require('../src/characters/royce');

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
    className: 'royce idle',
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

test('Royce maps shared states to the Neukgu-style visual classes', () => {
  const element = makeElement();
  const royce = new RoyceCharacter(element, STATES);

  royce.setState(STATES.IDLE);
  assert.equal(element.className, 'royce idle');
  royce.setState(STATES.WALK);
  assert.equal(element.className, 'royce walk');
  royce.setState(STATES.SLEEP);
  assert.equal(element.className, 'royce sleep');
  royce.setState(STATES.DRAG);
  assert.equal(element.className, 'royce drag');
  assert.equal(element.classList.added, 'react');
});

test('Royce preserves the existing Neukgu-style facing behavior', () => {
  const element = makeElement();
  const royce = new RoyceCharacter(element, STATES);

  royce.render();
  assert.equal(element.style.transform, 'scaleX(1)');

  royce.setFacing(-1);
  assert.equal(royce.facing, -1);
  assert.ok(royce.turnAnimation);

  royce.turnAnimation.onfinish();
  assert.equal(element.style.transform, 'scaleX(-1)');
});
