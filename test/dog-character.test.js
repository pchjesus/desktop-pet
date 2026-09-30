const test = require('node:test');
const assert = require('node:assert/strict');
const DogCharacter = require('../src/characters/dog');

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
    className: 'wolf idle',
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

test('dog character maps shared states to the existing visual classes', () => {
  const element = makeElement();
  const dog = new DogCharacter(element, STATES);

  dog.setState(STATES.WALK);
  assert.equal(element.className, 'wolf walk');

  dog.setState(STATES.SLEEP);
  assert.equal(element.className, 'wolf sleep');

  dog.setState(STATES.DRAG);
  assert.equal(element.className, 'wolf drag');
  assert.equal(element.classList.added, 'react');
});

test('dog character preserves facing state without changing the shared renderer contract', () => {
  const element = makeElement();
  const dog = new DogCharacter(element, STATES);

  dog.render();
  assert.equal(element.style.transform, 'scaleX(1)');

  dog.setFacing(-1);
  assert.equal(dog.facing, -1);
  assert.ok(dog.turnAnimation);

  dog.turnAnimation.onfinish();
  assert.equal(element.style.transform, 'scaleX(-1)');
});

test('renderer delegates dog-specific visual behavior to the character module', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const renderer = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');
  assert.match(renderer, /new globalThis\.DogCharacter/);
  assert.doesNotMatch(renderer, /wolf\.className|wolf\.style\.transform|wolf\.animate/);
});
