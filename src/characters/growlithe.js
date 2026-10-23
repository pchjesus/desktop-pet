class GrowlitheCharacter {
  constructor(element, states) {
    if (!element) throw new Error('GrowlitheCharacter requires a character element');
    this.element = element;
    this.states = states;
    this.facing = 1;
    this.sprite = element.querySelector('.growlithe-sprite');
    if (!this.sprite) throw new Error('GrowlitheCharacter requires the sprite image element');
    this.baseSrc = 'assets/characters/growlithe-hgss.png';
    this.motionRoot = 'assets/characters/growlithe-motion/';
    this.sleepSrc = `${this.motionRoot}sleep-0.png`;
    this.walkSrc = 'assets/characters/growlithe-walk.apng';
    this.reactSrc = 'assets/characters/growlithe-react.apng';
    this.special = null;
    this.lastRenderTime = null;
    this.stateStartedAt = null;
    this.waking = false;
    this.setState(states.IDLE);
  }

  setState(next) {
    // Drag is the sole shared-state interruption of a one-shot action.
    if (this.special && next !== this.states.DRAG) return;
    if (this.special) this.special = null;
    if (this.state === next && next !== this.states.REACT) return;
    this.waking = this.state === this.states.SLEEP && next === this.states.IDLE;
    this.state = next;
    this.stateStartedAt = null;
    this.sprite.className = 'growlithe-sprite';
    this.element.className = `growlithe ${next === this.states.WALK ? 'walk' : next}`;
    if (next === this.states.WALK) this.setSprite(this.walkSrc);
    else if (next === this.states.SLEEP) this.setSprite(this.sleepSrc);
    else if (next === this.states.REACT) {
      // Keep the original APNG and native timing. Every distinct reaction reloads it.
      this.setSprite(`${this.reactSrc}?play=${Date.now()}`);
    } else if (next === this.states.SIT) this.setSprite(`${this.motionRoot}sit-0.png`);
    else if (next === this.states.DRAG) this.setSprite(`${this.motionRoot}drag-0.png`);
    else this.setSprite(this.waking ? `${this.motionRoot}wake.png` : this.baseSrc);
  }

  setSprite(src) {
    if (this.sprite.getAttribute('src') !== src) this.sprite.setAttribute('src', src);
  }

  setMovementDirection(vector) {
    const dx = Number(vector?.x) || 0;
    if (!this.special && Math.abs(dx) >= 0.01) this.setFacing(dx < 0 ? -1 : 1);
  }

  setFacing(nextFacing) {
    if (this.special || (nextFacing !== -1 && nextFacing !== 1)) return;
    this.facing = nextFacing;
    this.element.style.transform = `scaleX(${-nextFacing})`;
  }

  startSpecialAction(type) {
    if (type !== 'flamethrower' || this.special || this.state === this.states.DRAG) return false;
    // Initialize against the next finite renderer clock, not Date.now(): callers may
    // supply performance.now() or a deterministic preview clock.
    this.special = { type, startedAt: null };
    this.waking = false;
    this.element.className = 'growlithe special-flamethrower';
    this.sprite.className = 'growlithe-sprite growlithe-full-frame';
    this.setSprite(`${this.motionRoot}flamethrower-00.png`);
    return true;
  }

  isSpecialActionActive() { return Boolean(this.special); }

  render(timestamp = globalThis.performance?.now?.() ?? Date.now()) {
    const now = Number.isFinite(timestamp) ? timestamp : this.lastRenderTime;
    this.element.style.transform = `scaleX(${-this.facing})`;
    if (now === null) return;
    this.lastRenderTime = now;
    if (this.special) {
      if (this.special.startedAt === null) this.special.startedAt = now;
      const elapsed = Math.max(0, now - this.special.startedAt);
      if (elapsed >= 2900) {
        this.special = null;
        // Completion always restores a clean idle pose, regardless of deferred
        // engine state requests received while the action held visual priority.
        this.state = null;
        this.setState(this.states.IDLE);
      } else {
        const frame = String(Math.floor(elapsed / 100)).padStart(2, '0');
        this.setSprite(`${this.motionRoot}flamethrower-${frame}.png`);
      }
      return;
    }
    if (this.stateStartedAt === null) this.stateStartedAt = now;
    const elapsed = Math.max(0, now - this.stateStartedAt);
    if (this.waking && elapsed < 360) {
      const frame = elapsed < 120 ? 'wake' : elapsed < 240 ? 'wake-head' : 'wake-body';
      this.setSprite(`${this.motionRoot}${frame}.png`);
      return;
    }
    this.waking = false;
    if (this.state === this.states.IDLE) {
      const cycle = elapsed % 5600;
      if (cycle >= 2100 && cycle < 2240) this.setSprite(`${this.motionRoot}idle-ear.png`);
      else if (cycle >= 2240 && cycle < 2380) this.setSprite(`${this.motionRoot}idle-tail.png`);
      else this.setSprite(Math.floor(elapsed / 700) % 2 ? `${this.motionRoot}idle-breathe.png` : this.baseSrc);
    }
    else if (this.state === this.states.SIT) this.setSprite(`${this.motionRoot}sit-${Math.floor(elapsed / 800) % 2}.png`);
    else if (this.state === this.states.SLEEP) this.setSprite(`${this.motionRoot}sleep-${Math.floor(elapsed / 1100) % 2}.png`);
    else if (this.state === this.states.DRAG) this.setSprite(`${this.motionRoot}drag-${Math.floor(elapsed / 240) % 2}.png`);
  }
}

globalThis.GrowlitheCharacter = GrowlitheCharacter;
if (typeof module !== 'undefined') module.exports = GrowlitheCharacter;
