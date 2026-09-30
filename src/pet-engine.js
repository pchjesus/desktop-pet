const STATES = Object.freeze({ IDLE: 'idle', WALK: 'walk', SIT: 'sit', SLEEP: 'sleep', DRAG: 'drag', REACT: 'react' });

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function chooseNextState(random = Math.random) {
  const r = random();
  if (r < 0.50) return STATES.WALK;
  if (r < 0.72) return STATES.IDLE;
  if (r < 0.92) return STATES.SIT;
  return STATES.SLEEP;
}

function chooseTarget(width, height, random = Math.random) {
  const margin = 70;
  const minY = Math.min(height - 80, Math.max(120, height * 0.25));
  const maxY = Math.max(minY, height - 80);
  return {
    x: margin + random() * Math.max(1, width - margin * 2),
    y: minY + random() * Math.max(1, maxY - minY)
  };
}

function stepToward(position, target, speed, dt) {
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.5) return { position: { ...target }, arrived: true, direction: 0 };
  const amount = Math.min(distance, speed * dt);
  return {
    position: {
      x: position.x + dx / distance * amount,
      y: position.y + dy / distance * amount
    },
    arrived: distance <= speed * dt,
    direction: dx < 0 ? -1 : 1
  };
}

globalThis.PetEngine = { STATES, clamp, chooseNextState, chooseTarget, stepToward };
if (typeof module !== 'undefined') module.exports = globalThis.PetEngine;
