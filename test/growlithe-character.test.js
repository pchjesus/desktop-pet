const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const GrowlitheCharacter = require('../src/characters/growlithe');

const STATES = Object.freeze({
  IDLE: 'idle', WALK: 'walk', SIT: 'sit', SLEEP: 'sleep', DRAG: 'drag', REACT: 'react'
});

function makeElement() {
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

test('growlithe maps shared states to character state classes and exact source assets', () => {
  const element = makeElement();
  const growlithe = new GrowlitheCharacter(element, STATES);
  growlithe.setState(STATES.IDLE);
  assert.equal(element.className, 'growlithe idle');
  assert.equal(element.sprite.src, 'assets/characters/growlithe-hgss.png');
  growlithe.setState(STATES.WALK);
  assert.equal(element.className, 'growlithe walk');
  assert.equal(element.sprite.src, 'assets/characters/growlithe-walk.apng');
  growlithe.setState(STATES.SIT);
  assert.equal(element.className, 'growlithe sit');
  assert.equal(element.sprite.src, 'assets/characters/growlithe-motion/sit-0.png');
  growlithe.setState(STATES.SLEEP);
  assert.equal(element.className, 'growlithe sleep');
  assert.equal(element.sprite.src, 'assets/characters/growlithe-motion/sleep-0.png');
});

test('growlithe base sprite is byte-identical to the selected HG/SS source', () => {
  const file = fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'characters', 'growlithe-hgss.png'));
  assert.equal(crypto.createHash('sha256').update(file).digest('hex'), 'ed58999248f69a686aed6048a57900a751ec8a8b9df9c161ecabfa592d135c96');
});

test('growlithe uses the native APNG only for click reaction', () => {
  const element = makeElement();
  const growlithe = new GrowlitheCharacter(element, STATES);
  growlithe.setState(STATES.REACT);
  assert.equal(element.className, 'growlithe react');
  assert.match(element.sprite.src, /^assets\/characters\/growlithe-react\.apng\?play=\d+$/);
});

test('growlithe follows the Neukgu-style left/right facing model', () => {
  const element = makeElement();
  const growlithe = new GrowlitheCharacter(element, STATES);
  growlithe.setMovementDirection({ x: -4, y: 1 });
  assert.equal(growlithe.facing, -1);
  assert.equal(element.style.transform, 'scaleX(1)');
  growlithe.setMovementDirection({ x: 0, y: 5 });
  assert.equal(growlithe.facing, -1);
  growlithe.setMovementDirection({ x: 5, y: -5 });
  assert.equal(growlithe.facing, 1);
  assert.equal(element.style.transform, 'scaleX(-1)');
});

test('growlithe has no sprite-sheet or SVG animation architecture', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
  assert.match(html, /class="growlithe-sprite"/);
  assert.match(html, /assets\/characters\/growlithe-hgss\.png/);
  assert.doesNotMatch(html, /growlithe-(walk|react|idle)-sheet\.png/);
  assert.doesNotMatch(html, /growlithe\.svg/);
  assert.doesNotMatch(html, /background-position/);
  // Other characters own independent animation architectures. Inspect the
  // Growlithe declarations and its markup for this character's contract.
  const growlitheMarkup = html.match(/<div class="growlithe idle"[\s\S]*?<\/div>/)?.[0] || '';
  const growlitheCss = [...html.matchAll(/[^{}]*\.growlithe[^{}]*\{[^{}]*\}/g)].map(match => match[0]).join('\n');
  assert.doesNotMatch(growlitheMarkup + growlitheCss, /steps\(/);

  for (const asset of ['growlithe-hgss.png','growlithe-walk.apng','growlithe-react.apng','growlithe-sleep.png']) {
    assert.equal(fs.existsSync(path.join(__dirname, '..', 'src', 'assets', 'characters', asset)), true, asset);
  }
});
