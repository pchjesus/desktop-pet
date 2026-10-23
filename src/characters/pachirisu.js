class PachirisuCharacter {
  constructor(element, states) {
    if (!element) throw new Error('PachirisuCharacter requires its element');
    this.element = element;
    this.states = states;
    this.facing = 1;
    this.state = states.IDLE;
    this.sprite = element.querySelector('.pachirisu-sprite');
    if (!this.sprite) throw new Error('PachirisuCharacter requires its sprite');
    this.root = 'assets/characters/pachirisu/';
    this.activeSpecial = null;
    this.followIcon = element.querySelector('.pachirisu-follow-icon');
    this.motionSpeed = 0.16;
    this.setState(states.IDLE);
  }

  getMovementSpeed() { return this.motionSpeed; }

  setSprite(src) {
    if (this.sprite.getAttribute('src') !== src) this.sprite.setAttribute('src', src);
  }

  setState(next) {
    this.state = next;
    if (next === this.states.DRAG && this.activeSpecial) this.finishSpecialAction(false);
    if (this.activeSpecial) return; // one-shot artwork takes precedence over generic state changes.
    this.element.className = `pachirisu ${next}`;
    // Official B/W animated sprite preserves authentic moving tail and ears.
    if (next === this.states.IDLE || next === this.states.WALK || next === this.states.REACT)
      this.setSprite(this.root + 'pachirisu-bw.gif');
    else this.setSprite(this.root + 'pachirisu-still.png');
  }

  setFacing(next) {
    if (this.activeSpecial || (next !== 1 && next !== -1)) return;
    this.facing = next;
    this.element.style.transform = `scaleX(${-next})`;
  }

  setMovementDirection(vector) {
    if (Math.abs(Number(vector?.x) || 0) < 0.01) return;
    this.setFacing(vector.x < 0 ? -1 : 1);
  }

  startSpecialAction(type = 'followme') {
    if (type !== 'followme' || this.activeSpecial || this.state === this.states.DRAG) return false;
    this.activeSpecial = {type, start: performance.now(), duration: 4400};
    if (this.followIcon) this.followIcon.hidden = false;
    this.element.className = 'pachirisu special-followme';
    this.setSprite(this.root + 'followme/followme-00.png');
    return true;
  }

  isSpecialActionActive() { return Boolean(this.activeSpecial); }

  finishSpecialAction(restore = true) {
    if (!this.activeSpecial) return;
    this.activeSpecial = null;
    if (this.followIcon) this.followIcon.hidden = true;
    this.element.className = 'pachirisu idle';
    this.setSprite(this.root + 'pachirisu-bw.gif');
    if (!restore) return;
    this.state = this.states.IDLE;
  }

  render() {
    if (this.activeSpecial) {
      const elapsed = Math.max(0, performance.now() - this.activeSpecial.start);
      if (elapsed >= this.activeSpecial.duration) this.finishSpecialAction();
      else {
        const frame = Math.min(43, Math.floor(elapsed / 100));
        this.setSprite(this.root + `followme/followme-${String(frame).padStart(2, '0')}.png`);
        if (this.followIcon) this.followIcon.hidden = elapsed >= 3500;
      }
    }
    this.element.style.transform = `scaleX(${-this.facing})`;
  }
}

globalThis.PachirisuCharacter = PachirisuCharacter;
if (typeof module !== 'undefined') module.exports = PachirisuCharacter;
