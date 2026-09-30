class GrowlitheCharacter {
  constructor(element, states) {
    if (!element) throw new Error('GrowlitheCharacter requires a character element');
    this.element = element;
    this.states = states;
    this.facing = 1;
    this.sprite = element.querySelector('.growlithe-sprite');
    if (!this.sprite) throw new Error('GrowlitheCharacter requires the sprite image element');
    this.baseSrc = 'assets/characters/growlithe-hgss.png';
    this.sleepSrc = 'assets/characters/growlithe-sleep.png';
    this.walkSrc = 'assets/characters/growlithe-walk.apng';
    this.reactSrc = 'assets/characters/growlithe-react.apng';
    this.setState(states.IDLE);
  }

  setState(next) {
    const stateClass = next === this.states.WALK ? 'walk' : next;
    this.element.className = `growlithe ${stateClass}`;

    if (next === this.states.WALK) {
      this.setSprite(this.walkSrc);
      return;
    }

    if (next === this.states.SLEEP) {
      this.setSprite(this.sleepSrc);
      return;
    }

    if (next === this.states.REACT) {
      // Force a fresh APNG load so every click starts the bark animation from frame 1.
      this.setSprite(`${this.reactSrc}?play=${Date.now()}`);
      return;
    }

    this.setSprite(this.baseSrc);
  }

  setSprite(src) {
    if (this.sprite.getAttribute('src') === src) return;
    this.sprite.setAttribute('src', src);
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

  render() {
    this.element.style.transform = `scaleX(${-this.facing})`;
  }
}

globalThis.GrowlitheCharacter = GrowlitheCharacter;
if (typeof module !== 'undefined') module.exports = GrowlitheCharacter;
