const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const SphealCharacter = require('../src/characters/spheal');

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
    className: 'spheal idle',
    style: {},
    querySelector(selector) { return selector === '.spheal-sprite' ? sprite : null; },
    sprite
  };
}

test('spheal implements the shared character contract', () => {
  const character = new SphealCharacter(makeElement(), STATES);
  assert.equal(typeof character.setState, 'function');
  assert.equal(typeof character.setFacing, 'function');
  assert.equal(typeof character.render, 'function');
});

test('spheal exposes roll, react, and water-gun assets', () => {
  const character = new SphealCharacter(makeElement(), STATES);
  assert.equal(character.rollFrames.length, 12);
  assert.equal(character.reactFrames.length, 8);
  assert.equal(character.waterGunFrames.length, 12);
  assert.match(character.reactFrames[0], /animations[\\/]clap[\\/]clap-01\.png$/);
  assert.match(character.waterGunFrames[0], /animations[\\/]watergun[\\/]watergun-01\.png$/);
  const assetRoot = path.join(__dirname, '..', 'src', 'assets', 'characters', 'spheal');
  assert.equal(fs.existsSync(path.join(assetRoot, 'spheal-base.png')), true);
  assert.equal(fs.existsSync(path.join(assetRoot, 'animations', 'clap', 'clap-01.png')), true);
  assert.equal(fs.existsSync(path.join(assetRoot, 'animations', 'watergun', 'watergun-01.png')), true);
  assert.equal(fs.existsSync(path.join(assetRoot, 'animations', 'watergun', 'watergun-12.png')), true);
  for (const frame of [...character.rollFrames, ...character.reactFrames, ...character.waterGunFrames]) {
    assert.equal(fs.existsSync(path.join(__dirname, '..', 'src', frame)), true);
  }
});

test('spheal changes facing from horizontal movement', () => {
  const character = new SphealCharacter(makeElement(), STATES);
  character.setMovementDirection({ x: -2, y: 0 });
  assert.equal(character.facing, -1);
  character.setMovementDirection({ x: 2, y: 0 });
  assert.equal(character.facing, 1);
});

test('renderer and start screen register spheal without changing Pet Engine ownership', () => {
  const renderer = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');
  const start = fs.readFileSync(path.join(__dirname, '..', 'src', 'start.html'), 'utf8');
  const engine = fs.readFileSync(path.join(__dirname, '..', 'src', 'pet-engine.js'), 'utf8');
  assert.match(renderer, /new globalThis\.SphealCharacter/);
  assert.match(renderer, /spheal.*pocketmon|pocketmon.*spheal/s);
  assert.match(start, /data-character="spheal"/);
  assert.doesNotMatch(engine, /SphealCharacter|spheal/i);
});


test('spheal water gun can interrupt an active clap without changing the clap asset flow', () => {
  const element = makeElement();
  const character = new SphealCharacter(element, STATES);
  character.startSpecialAction('clap');
  assert.equal(character.startSpecialAction('watergun'), true);
  assert.equal(character.isSpecialActionActive(), true);
  character.render();
  assert.match(element.sprite.src, /animations[\\/]watergun[\\/]watergun-01\.png$/);
});

test('spheal uses the new fixed-position flipper animation and supports water gun special action', () => {
  const element = makeElement();
  const character = new SphealCharacter(element, STATES);
  character.setState(STATES.REACT);
  assert.equal(character.isSpecialActionActive(), true);
  character.render();
  assert.match(element.sprite.src, /animations[\\/]clap[\\/]clap-01\.png$/);

  character.finishSpecialAction();
  assert.equal(character.startSpecialAction('watergun'), true);
  assert.equal(character.isSpecialActionActive(), true);
  character.render();
  assert.match(element.sprite.src, /animations[\\/]watergun[\\/]watergun-01\.png$/);
});


test('spheal uses the original base artwork for its base and startup card', () => {
  const characterSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'characters', 'spheal.js'), 'utf8');
  const index = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
  const start = fs.readFileSync(path.join(__dirname, '..', 'src', 'start.html'), 'utf8');
  assert.match(characterSource, /this\.baseSrc = `\$\{root\}spheal-base\.png`/);
  assert.match(index, /spheal-base\.png/);
  assert.match(start, /spheal-base\.png/);
  assert.doesNotMatch(characterSource, /this\.baseSrc = `\$\{root\}spheal-idle\.png`/);
  assert.doesNotMatch(index, /spheal-happy-face|spheal-watergun-effect|spheal-clap-impact/);
});

test('spheal base sprite uses the patch12 eye-hole-fixed asset', () => {
  const base = fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'characters', 'spheal', 'spheal-base.png'));
  const roll01 = fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'characters', 'spheal', 'roll-01.png'));
  const crypto = require('node:crypto');
  assert.equal(crypto.createHash('sha256').update(base).digest('hex'), 'e0aaa87996727a6b4a8ee7cac72c9dfea86d2d137694f212fa2825304bac2997');
  assert.equal(crypto.createHash('sha256').update(roll01).digest('hex'), '363f91e9aba03656e974f61955f133a6a0d4aad2afe7b5ce892e6bd42917f08c');
});

test('spheal special playback uses full-body frame timing', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'characters', 'spheal.js'), 'utf8');
  assert.match(source, /frameMs: type === 'watergun' \? 175 : 180/);
});

test('spheal special playback is finite and does not use a frame-loop modulo', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'characters', 'spheal.js'), 'utf8');
  assert.doesNotMatch(source, /frameIndex.*%.*frames\.length/);
  assert.match(source, /if \(frameIndex >= frames\.length\) \{\s*this\.finishSpecialAction\(\);/);
});

test('renderer supports Spheal watergun input after the existing click-armed command flow', () => {
  const renderer = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');
  assert.match(renderer, /watergun/);
  assert.match(renderer, /startSpecialAction\('watergun'\)/);
  assert.match(renderer, /selectedCharacter === 'spheal'/);
  assert.match(renderer, /if \(!didDrag\) \{[\s\S]*?setState\(PET_STATES\.REACT\)/);
});
