const test = require('node:test');
const assert = require('node:assert/strict');
const { STATES, clamp, chooseNextState, chooseTarget, stepToward } = require('../src/pet-engine');

test('clamp keeps a coordinate inside bounds', () => {
  assert.equal(clamp(-2, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(5, 0, 10), 5);
});

test('behavior selection covers deterministic thresholds', () => {
  assert.equal(chooseNextState(() => 0.1), STATES.WALK);
  assert.equal(chooseNextState(() => 0.6), STATES.IDLE);
  assert.equal(chooseNextState(() => 0.8), STATES.SIT);
  assert.equal(chooseNextState(() => 0.99), STATES.SLEEP);
});

test('target stays within horizontal safe margins', () => {
  const t = chooseTarget(1000, 800, () => 0.5);
  assert.ok(t.x >= 70 && t.x <= 930);
  assert.ok(t.y >= 200 && t.y <= 720);
});

test('stepToward moves toward target and reports arrival', () => {
  const r = stepToward({x:0,y:0},{x:10,y:0},1,5);
  assert.equal(r.position.x, 5);
  assert.equal(r.direction, 1);
  assert.equal(r.arrived, false);
  const r2 = stepToward({x:9,y:0},{x:10,y:0},1,5);
  assert.equal(r2.arrived, true);
  assert.equal(r2.position.x, 10);
});
