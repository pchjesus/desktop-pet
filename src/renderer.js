const {
  STATES: PET_STATES,
  chooseNextState: petChooseNextState,
  chooseTarget: petChooseTarget,
  stepToward: petStepToward
} = window.PetEngine;
const pet = document.getElementById('pet');
const character = new globalThis.DogCharacter(document.getElementById('wolf'), PET_STATES);
const bubble = document.getElementById('bubble');

let state = PET_STATES.IDLE;
const PET_DEBUG = new URLSearchParams(location.search).has('pet-debug');
const debugLog = (...args) => { if (PET_DEBUG) console.log('[PET]', ...args); };
let target = { x: 90, y: 75 };
let position = { x: 0, y: 0 };
let windowInfo = null;
let last = performance.now();
let nextDecision = last + 1200;
let dragging = false;
let pointerStart = null;
let didDrag = false;

function setState(next) {
  state = next;
  character.setState(next);
}

function showBubble(text) {
  bubble.textContent = text;
  bubble.style.display = 'block';
  clearTimeout(showBubble.timer);
  showBubble.timer = setTimeout(() => bubble.style.display = 'none', 900);
}

function chooseAction() {
  setState(petChooseNextState());
  nextDecision = performance.now() + 1000 + Math.random() * 3500;
  if (state === PET_STATES.WALK) target = desktopTarget();
}

function render() {
  pet.style.transform = 'translate(-50%,-50%)';
  character.render();
}

function updateFacing(nextFacing) {
  character.setFacing(nextFacing);
}

async function initPosition() {
  windowInfo = await window.petAPI.getWindow();
  if (windowInfo) { position = { x: windowInfo.x, y: windowInfo.y }; }
}

function desktopTarget() {
  if (!windowInfo || !windowInfo.movementBounds) {
    return { x: position.x, y: position.y };
  }

  const bounds = windowInfo.movementBounds;
  return {
    x: bounds.minX + Math.random() * Math.max(1, bounds.maxX - bounds.minX),
    y: bounds.minY + Math.random() * Math.max(1, bounds.maxY - bounds.minY)
  };
}

window.addEventListener('mousemove', (event) => {
  if (!dragging) return;
  const distance = Math.hypot(event.screenX - pointerStart.x, event.screenY - pointerStart.y);
  if (distance >= 6) didDrag = true;
  window.petAPI.dragMove(event.screenX, event.screenY);
});

pet.addEventListener('contextmenu', async (event) => {
  event.preventDefault();
  await window.petAPI.quit();
});

pet.addEventListener('mousedown', (event) => {
  if (event.button !== 0) return;
  dragging = true; didDrag = false; pointerStart = { x:event.screenX, y:event.screenY };
  pet.classList.add('dragging'); setState(PET_STATES.DRAG);
  window.petAPI.dragStart(event.screenX, event.screenY);
});

window.addEventListener('mouseup', (event) => {
  if (!dragging) return;
  dragging = false; pet.classList.remove('dragging'); window.petAPI.dragEnd();

  // Main owns the real OS window position during drag. Re-sync the
  // renderer's local position before autonomous movement resumes.
  window.petAPI.getWindow().then((info) => {
    if (!info) return;
    windowInfo = info;
    position = { x: info.x, y: info.y };
  });

  if (!didDrag) {
    setState(PET_STATES.REACT); showBubble(['멍!','쓰담?','좋아!'][Math.floor(Math.random()*3)]);
    setTimeout(() => setState(PET_STATES.IDLE), 800);
  } else setState(PET_STATES.IDLE);
  nextDecision = performance.now() + 1200;
});

function tick(now) {
  const dt = Math.min(50, now-last); last = now;
  if (!dragging) {
    if (now >= nextDecision) chooseAction();
    if (state === PET_STATES.WALK) {
      const result = petStepToward(position, target, 0.18, dt);
      position = result.position;
      window.petAPI.setPosition(position.x, position.y);
      if (PET_DEBUG && Math.random() < 0.02) debugLog('walk', position);
      if (result.direction) updateFacing(result.direction);
      if (result.arrived) chooseAction();
    }
  }
  render();
}

// Desktop overlays should not depend on requestAnimationFrame being scheduled.
// Use a fixed renderer timer and disable Chromium background throttling in main.js.
let behaviorTimer = null;
function startBehaviorLoop() {
  if (behaviorTimer) clearInterval(behaviorTimer);
  behaviorTimer = setInterval(() => tick(performance.now()), 16);
  debugLog('behavior loop started');
  tick(performance.now());
}

// The renderer itself is a tiny behavior loop; OS window position remains main-process-owned.
window.petAPI.setIgnoreMouse(true);
initPosition().then(startBehaviorLoop);
