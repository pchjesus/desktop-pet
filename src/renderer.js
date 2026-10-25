const {
  STATES: PET_STATES,
  chooseNextState: petChooseNextState,
  chooseTarget: petChooseTarget,
  stepToward: petStepToward
} = window.PetEngine;
const pet = document.getElementById('pet');
const requestedCharacter = new URLSearchParams(location.search).get('character');
const selectedCharacter = ['growlithe', 'royce', 'spheal', 'pachirisu'].includes(requestedCharacter) ? requestedCharacter : 'neukgu';
document.body.dataset.character = selectedCharacter;
const character = selectedCharacter === 'growlithe'
  ? new globalThis.GrowlitheCharacter(document.getElementById('growlithe'), PET_STATES)
  : selectedCharacter === 'royce'
    ? new globalThis.RoyceCharacter(document.getElementById('royce'), PET_STATES)
    : selectedCharacter === 'spheal'
      ? new globalThis.SphealCharacter(document.getElementById('spheal'), PET_STATES)
      : selectedCharacter === 'pachirisu'
        ? new globalThis.PachirisuCharacter(document.getElementById('pachirisu'), PET_STATES)
        : new globalThis.NeukguCharacter(document.getElementById('neukgu'), PET_STATES);
const bubble = document.getElementById('bubble');

// Passive diagnostic-only listeners: no preventDefault, stopPropagation or key logging.
let lastDiagMove = -Infinity;
function diagnosticCapture(type, event) {
  if (type === 'pointermove') {
    const now = performance.now();
    if (now - lastDiagMove < 900) return;
    lastDiagMove = now;
  }
  window.petAPI.diagnosticEvent?.(type, {
    target: event?.target?.closest?.('#pet') ? 'pet' : 'other',
    button: event?.button,
    clientX: event?.clientX, clientY: event?.clientY,
    screenX: event?.screenX, screenY: event?.screenY,
    trusted: event?.isTrusted === true,
    visibility: document.visibilityState
  });
}
for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'pointermove', 'click', 'contextmenu']) {
  window.addEventListener(type, (event) => diagnosticCapture(type, event), { capture: true, passive: true });
}
for (const type of ['focus', 'blur'])
  window.addEventListener(type, (event) => diagnosticCapture(type, event));
document.addEventListener?.('visibilitychange', (event) => diagnosticCapture('visibilitychange', event));
diagnosticCapture('renderer-ready', null);


let easterEggEligibleUntil = 0;
let easterEggBuffer = '';

function armEasterEgg() {
  if (selectedCharacter !== 'growlithe' && selectedCharacter !== 'royce' && selectedCharacter !== 'spheal' && selectedCharacter !== 'pachirisu') return;
  easterEggEligibleUntil = Date.now() + 5000;
  easterEggBuffer = '';
}

function showEasterEgg() {
  if (selectedCharacter === 'growlithe' || selectedCharacter === 'spheal') {
    window.petAPI.openFanProject();
  } else if (selectedCharacter === 'royce') {
    window.petAPI.showRoyceMessage();
  }
  if (selectedCharacter === 'pachirisu' && character.startSpecialAction('followme')) {
    nextDecision = performance.now() + 4400;
    clearTimeout(showBubble.timer);
    bubble.style.display = 'none'; // Dedicated head icon remains unobscured.
  }
  easterEggEligibleUntil = 0;
  easterEggBuffer = '';
}

function easterEggCode() {
  if (selectedCharacter === 'growlithe') return 'pocketmon';
  if (selectedCharacter === 'royce') return 'royce';
  if (selectedCharacter === 'spheal') return 'pocketmon';
  if (selectedCharacter === 'pachirisu') return 'followme';
  return '';
}

function handleGrowlitheSpecialCode() {
  if (selectedCharacter !== 'growlithe' || easterEggBuffer !== 'flamethrower') return false;
  if (character.startSpecialAction?.('flamethrower')) {
    nextDecision = performance.now() + 2900;
    showBubble('화염방사!');
  }
  easterEggEligibleUntil = 0;
  easterEggBuffer = '';
  return true;
}

function handleSphealSpecialCode() {
  if (selectedCharacter !== 'spheal' || !character?.startSpecialAction) return false;
  if (easterEggBuffer !== 'watergun' && easterEggBuffer !== 'icebeam') return false;
  const iceBeam = easterEggBuffer === 'icebeam';
  if (iceBeam ? character.startSpecialAction('icebeam') : character.startSpecialAction('watergun')) {
    nextDecision = performance.now() + (iceBeam ? 2950 : 2100);
    easterEggEligibleUntil = 0;
    easterEggBuffer = '';
    showBubble(iceBeam ? '냉동빔!' : '물대포!');
    return true;
  }
  return false;
}

window.addEventListener('keydown', (event) => {
  if ((selectedCharacter !== 'growlithe' && selectedCharacter !== 'royce' && selectedCharacter !== 'spheal' && selectedCharacter !== 'pachirisu') || Date.now() > easterEggEligibleUntil) return;

  if (event.key === 'Enter') {
    if (handleSphealSpecialCode() || handleGrowlitheSpecialCode()) return;
    if (easterEggBuffer === easterEggCode()) showEasterEgg();
    else easterEggBuffer = '';
    return;
  }

  if (event.key === 'Backspace') {
    easterEggBuffer = easterEggBuffer.slice(0, -1);
    return;
  }

  if (/^[a-zA-Z]$/.test(event.key)) {
    easterEggBuffer = (easterEggBuffer + event.key.toLowerCase()).slice(-20);
  }
});


let state = PET_STATES.IDLE;
const PET_DEBUG = new URLSearchParams(location.search).has('pet-debug');
const debugLog = (...args) => { if (PET_DEBUG) console.log('[PET]', ...args); };
let target = { x: 90, y: 75 };
let position = { x: 0, y: 0 };
let windowInfo = null;
let last = performance.now();
let nextDecision = last + 1200;
let nextSphealClap = last + 30000 + Math.random() * 30000;
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


async function initPosition() {
  synchronizeWindow(await window.petAPI.getWindow());
}

function synchronizeWindow(info) {
  if (!info) return;
  if (Number.isFinite(info.revision) && Number.isFinite(windowInfo?.revision)
      && info.revision < windowInfo.revision) return;
  const previousDisplay = windowInfo?.displayId;
  windowInfo = info;
  position = { x: info.x, y: info.y };
  const bounds = info.movementBounds;
  if (bounds) {
    if (previousDisplay !== info.displayId) target = desktopTarget();
    else target = { x: Math.max(bounds.minX, Math.min(target.x, bounds.maxX)),
      y: Math.max(bounds.minY, Math.min(target.y, bounds.maxY)) };
  }
}

window.petAPI.onWindowChanged?.(synchronizeWindow);

function desktopTarget() {
  if (!windowInfo || !windowInfo.movementBounds) {
    return { x: position.x, y: position.y };
  }

  const bounds = windowInfo.movementBounds;
  return {
    x: bounds.minX + Math.random() * Math.max(0, bounds.maxX - bounds.minX),
    y: bounds.minY + Math.random() * Math.max(0, bounds.maxY - bounds.minY)
  };
}

function handleDragMove(event) {
  if (!dragging) return;
  const distance = Math.hypot(event.screenX - pointerStart.x, event.screenY - pointerStart.y);
  if (distance >= 6 && !didDrag) {
    didDrag = true;
    if (character?.isSpecialActionActive?.()) setState(PET_STATES.DRAG);
  }
  window.petAPI.dragMove(event.screenX, event.screenY);
}

window.addEventListener('pointermove', handleDragMove);

pet.addEventListener('contextmenu', async (event) => {
  event.preventDefault();
  await window.petAPI.quit();
});

function finishPointerInteraction(event) {
  if (!dragging) return;
  dragging = false;
  pet.classList.remove('dragging');
  if (event?.pointerId != null && pet.hasPointerCapture?.(event.pointerId)) {
    try { pet.releasePointerCapture(event.pointerId); } catch {}
  }
  window.petAPI.dragEnd();

  // Main owns the real OS window position during drag. Re-sync the
  // renderer's local position before autonomous movement resumes.
  window.petAPI.getWindow().then((info) => {
    if (!info) return;
    synchronizeWindow(info);
  });

  if (!didDrag) {
    setState(PET_STATES.REACT);
    armEasterEgg();
    const clickMessages = {
      neukgu: ['멍!', '쓰담?', '좋아!'],
      growlithe: ['왈!', '쓰담?', '좋아!'],
      royce: ['멍!', '쓰담?', '좋아!', '화이팅!', '보고 싶어!'],
      spheal: ['뿌우!', '짝짝!', '좋아!'],
      pachirisu: ['찌릿!', '파치!', '좋아!']
    };
    const messages = clickMessages[selectedCharacter] || clickMessages.neukgu;
    showBubble(messages[Math.floor(Math.random() * messages.length)]);
    if (selectedCharacter === 'spheal') {
      const finishSphealReaction = () => {
        if (character?.isSpecialActionActive?.()) {
          setTimeout(finishSphealReaction, 50);
          return;
        }
        if (state === PET_STATES.REACT) setState(PET_STATES.IDLE);
      };
      setTimeout(finishSphealReaction, 50);
    } else {
      setTimeout(() => {
        if (!dragging && state === PET_STATES.REACT && !character?.isSpecialActionActive?.()) setState(PET_STATES.IDLE);
      }, 800);
    }
  } else setState(PET_STATES.IDLE);
  nextDecision = performance.now() + 1200;
}

pet.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  dragging = true; didDrag = false; pointerStart = { x:event.screenX, y:event.screenY };
  pet.classList.add('dragging');
  // A click must not cancel a locked special; a real drag still has priority.
  if (!character?.isSpecialActionActive?.()) setState(PET_STATES.DRAG);
  try { pet.setPointerCapture(event.pointerId); } catch {}
  window.petAPI.dragStart(event.screenX, event.screenY);
});

pet.addEventListener('pointerup', finishPointerInteraction);
pet.addEventListener('pointercancel', finishPointerInteraction);
window.addEventListener('blur', () => { if (dragging) finishPointerInteraction(); });

function tick(now) {
  const dt = Math.min(50, now-last); last = now;
  if (!dragging) {
    if (character?.isSpecialActionActive?.()) {
      render();
      if (!character.isSpecialActionActive() && (selectedCharacter === 'pachirisu' || selectedCharacter === 'growlithe')) {
        setState(PET_STATES.IDLE);
        nextDecision = now + 1200;
      }
      return;
    }
    let autonomousSpecialStarted = false;
    if (selectedCharacter === 'spheal' && state === PET_STATES.IDLE && now >= nextSphealClap) {
      if (character.startAutonomousSpecial?.(now)) {
        nextSphealClap = now + 30000 + Math.random() * 30000;
        nextDecision = now + 1000;
        autonomousSpecialStarted = true;
      }
    }
    if (!autonomousSpecialStarted && now >= nextDecision) chooseAction();
    if (state === PET_STATES.WALK) {
      const previousPosition = position;
      const movementSpeed = typeof character.getMovementSpeed === 'function' ? character.getMovementSpeed() : 0.18;
      const result = petStepToward(position, target, movementSpeed, dt);
      position = result.position;
      window.petAPI.setPosition(position.x, position.y);
      if (PET_DEBUG && Math.random() < 0.02) debugLog('walk', position);
      if (typeof character.setMovementDirection === 'function') {
        character.setMovementDirection({ x: position.x - previousPosition.x, y: position.y - previousPosition.y });
      }
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
initPosition().then(startBehaviorLoop);
