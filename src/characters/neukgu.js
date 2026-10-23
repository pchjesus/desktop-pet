class NeukguCharacter {
  constructor(element, states) {
    if (!element) throw new Error('NeukguCharacter requires a character element');
    this.element = element;
    this.states = states;
    this.facing = 1;
    this.turnAnimation = null;
    this.model = element.querySelector?.('svg') || null;
  }

  setState(next) {
    this.element.className = `neukgu ${next === this.states.WALK ? 'walk' : next}`;
    this.model?.setAttribute('data-motion', next);
    if (next === this.states.DRAG) this.element.classList.add('react');
  }

  setFacing(nextFacing) {
    if (nextFacing === this.facing) return;

    const previousFacing = this.facing;
    this.facing = nextFacing;

    if (this.turnAnimation) {
      this.turnAnimation.cancel();
      this.turnAnimation = null;
    }

    this.turnAnimation = this.element.animate(
      [
        { transform: `scaleX(${previousFacing})` },
        { transform: `scaleX(${previousFacing * 0.72})`, offset: 0.42 },
        { transform: `scaleX(${nextFacing * 0.72})`, offset: 0.58 },
        { transform: `scaleX(${nextFacing})` }
      ],
      { duration: 180, easing: 'ease-in-out' }
    );

    this.turnAnimation.onfinish = () => {
      this.turnAnimation = null;
      this.element.style.transform = `scaleX(${this.facing})`;
    };
  }

  render() {
    if (!this.turnAnimation) this.element.style.transform = `scaleX(${this.facing})`;
  }
}

globalThis.NeukguCharacter = NeukguCharacter;
if (typeof module !== 'undefined') module.exports = NeukguCharacter;
