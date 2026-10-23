// Electron screen/workArea/window positions are all DIP, including mixed-DPI
// desktops. Never multiply these coordinates by display.scaleFactor.
const BODY_ENVELOPES = Object.freeze({
  neukgu: Object.freeze({ left: 51, top: 40, right: 139, bottom: 120 }),
  royce: Object.freeze({ left: 51, top: 40, right: 139, bottom: 120 }),
  growlithe: Object.freeze({ left: 55, top: 29, right: 135, bottom: 114 }),
  spheal: Object.freeze({ left: 41, top: 22, right: 139, bottom: 110 }),
  pachirisu: Object.freeze({ left: 43, top: 28, right: 137, bottom: 124 })
});

function visualBounds(character, width = 180, height = 150) {
  const shape = BODY_ENVELOPES[character] || BODY_ENVELOPES.neukgu;
  const dx = (width - 180) / 2, dy = (height - 150) / 2;
  return { left: shape.left + dx, right: shape.right + dx,
    top: shape.top + dy, bottom: shape.bottom + dy };
}

function movementBounds(area, visual) {
  const axis = (start, length, near, far) => {
    const min = Math.ceil(start - near), max = Math.floor(start + length - far);
    // An unusually small work area cannot contain the whole body. Keep it
    // centered and visible rather than returning an inverted target interval.
    return min <= max ? [min, max] : [Math.round(start + length / 2 - (near + far) / 2),
      Math.round(start + length / 2 - (near + far) / 2)];
  };
  const [minX, maxX] = axis(area.x, area.width, visual.left, visual.right);
  const [minY, maxY] = axis(area.y, area.height, visual.top, visual.bottom);
  return { minX, maxX, minY, maxY };
}

function constrainPosition(position, visual, displays) {
  const center = { x: position.x + (visual.left + visual.right) / 2,
    y: position.y + (visual.top + visual.bottom) / 2 };
  const distance = display => {
    const r = display.bounds || display.workArea;
    return Math.max(r.x - center.x, 0, center.x - r.x - r.width) ** 2
      + Math.max(r.y - center.y, 0, center.y - r.y - r.height) ** 2;
  };
  const display = displays.reduce((best, item) => distance(item) < distance(best) ? item : best);
  const bounds = movementBounds(display.workArea, visual);
  return { x: Math.max(bounds.minX, Math.min(position.x, bounds.maxX)),
    y: Math.max(bounds.minY, Math.min(position.y, bounds.maxY)),
    display, movementBounds: bounds };
}

module.exports = { BODY_ENVELOPES, visualBounds, movementBounds, constrainPosition };
