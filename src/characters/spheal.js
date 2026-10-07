class SphealCharacter {
  constructor(element, states) {
    if (!element) throw new Error('SphealCharacter requires a character element');
    this.element = element;
    this.states = states;
    this.facing = 1;
    this.sprite = element.querySelector('.spheal-sprite');
    if (!this.sprite) throw new Error('SphealCharacter requires the sprite image element');

    const root = 'assets/characters/spheal/';
    this.baseSrc = `${root}spheal-base.png`;
    this.rollFrames = Array.from({ length: 12 }, (_, index) =>
      `${root}roll-${String(index + 1).padStart(2, '0')}.png`
    );
    this.reactFrames = Array.from({ length: 8 }, (_, index) =>
      `${root}animations/clap/clap-${String(index + 1).padStart(2, '0')}.png`
    );
    this.waterGunFrames = Array.from({ length: 12 }, (_, index) =>
      `${root}animations/watergun/watergun-${String(index + 1).padStart(2, '0')}.png`
    );

    this.state = states.IDLE;
    this.rollStartedAt = 0;
    this.rollEndingAt = 0;
    this.special = null;
    this.movementSpeed = 0.06;
    this.setSprite(this.baseSrc);
  }

  setState(next) {
    const previous = this.state;
    this.state = next;
    if (next === this.states.REACT) {
      this.element.className = 'spheal react';
      this.startSpecialAction('clap');
      return;
    }
    if (next === this.states.WALK) {
      if (previous !== this.states.WALK) {
        this.rollStartedAt = performance.now();
        this.movementSpeed = 0.06;
      }
      this.rollEndingAt = 0;
      this.element.className = 'spheal walk';
      return;
    }
    if (previous === this.states.WALK && next !== this.states.WALK) {
      this.rollEndingAt = performance.now();
      this.movementSpeed = 0.06;
      this.element.className = `spheal ${next}`;
      return;
    }
    this.element.className = `spheal ${next}`;
    if (!this.special) this.setSprite(this.baseSrc);
  }

  getMovementSpeed() {
    if (this.state !== this.states.WALK) return 0.06;
    this.movementSpeed = Math.min(0.30, this.movementSpeed + 0.004);
    return this.movementSpeed;
  }

  setMovementDirection(vector) {
    const dx = Number(vector?.x) || 0;
    if (Math.abs(dx) < 0.01) return;
    this.setFacing(dx < 0 ? -1 : 1);
  }

  setFacing(nextFacing) {
    if (nextFacing !== -1 && nextFacing !== 1) return;
    this.facing = nextFacing;
    this.element.style.transform = `scaleX(${-nextFacing})`;
  }

  startSpecialAction(type) {
    if (type !== 'watergun' && type !== 'clap') return false;
    if (this.special) {
      if (type !== 'watergun' || this.special.type === 'watergun') return false;
      this.special = null;
    }
    this.special = {
      type,
      startedAt: performance.now(),
      frameMs: type === 'watergun' ? 175 : 180,
      oneShot: true
    };
    this.element.className = `spheal special-${type}`;
    return true;
  }

  isSpecialActionActive() {
    return Boolean(this.special);
  }

  startAutonomousSpecial() {
    if (this.state !== this.states.IDLE || this.special) return false;
    return this.startSpecialAction('clap');
  }

  finishSpecialAction() {
    this.special = null;
    this.element.className = `spheal ${this.state}`;
    this.setSprite(this.baseSrc);
  }

  renderSpecial(now) {
    if (!this.special) return false;
    const frames = this.special.type === 'watergun' ? this.waterGunFrames : this.reactFrames;
    const elapsed = now - this.special.startedAt;
    const frameIndex = Math.floor(elapsed / this.special.frameMs);
    if (frameIndex >= frames.length) {
      this.finishSpecialAction();
      return false;
    }
    this.setSprite(frames[frameIndex]);
    return true;
  }

  render() {
    const now = performance.now();
    if (this.renderSpecial(now)) return;

    if (this.state === this.states.WALK) {
      const elapsed = now - this.rollStartedAt;
      const startFrames = 2;
      const frameMs = 105;
      let frameIndex;
      if (elapsed < startFrames * frameMs) {
        frameIndex = Math.min(1, Math.floor(elapsed / frameMs));
      } else {
        const loopIndex = Math.floor((elapsed - startFrames * frameMs) / 90) % 6;
        frameIndex = 2 + loopIndex;
      }
      this.setSprite(this.rollFrames[frameIndex]);
      return;
    }

    if (this.rollEndingAt) {
      const elapsed = now - this.rollEndingAt;
      const frameMs = 105;
      if (elapsed < 4 * frameMs) {
        const frameIndex = 8 + Math.min(3, Math.floor(elapsed / frameMs));
        this.setSprite(this.rollFrames[frameIndex]);
        return;
      }
      this.rollEndingAt = 0;
    }
    this.setSprite(this.baseSrc);
  }

  setSprite(src) {
    if (this.sprite.getAttribute('src') === src) return;
    this.sprite.setAttribute('src', src);
  }
}

globalThis.SphealCharacter = SphealCharacter;
if (typeof module !== 'undefined') module.exports = SphealCharacter;
