'use strict';
// Diagnostic-only, local-file logger. Never logs keyboard, text or screenshots.
module.exports = function createInputDiagnostics({ app, fs, path, screen }) {
  const LIMIT = 2 * 1024 * 1024;
  let file = null, used = 0, lastSample = 0;
  function record(kind, data = {}) {
    if (!file || used >= LIMIT) return;
    const entry = JSON.stringify({ time: new Date().toISOString(), kind, ...data }) + '\n';
    const bytes = Buffer.byteLength(entry, 'utf8');
    if (used + bytes > LIMIT) { used = LIMIT; return; }
    try { fs.appendFileSync(file, entry, 'utf8'); used += bytes; } catch {}
  }
  function start() {
    const filename = 'DesktopPet-input-diagnostic-' +
      new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.log';
    for (const folder of ['desktop', 'documents', 'userData']) {
      try {
        const dir = app.getPath(folder);
        fs.mkdirSync(dir, { recursive: true });
        const candidate = path.join(dir, filename);
        fs.writeFileSync(candidate,
          '# Desktop Pet input diagnostic. No keyboard, text, screenshots or network transmission.\n' +
          '# May contain relative cursor positions and display scaling; share only if comfortable.\n',
          { flag: 'wx' });
        file = candidate;
        used = fs.statSync(file).size;
        record('start', { electron: process.versions.electron, platform: process.platform, folder });
        console.log('[Desktop Pet diagnostic] Log: ' + file);
        return file;
      } catch {}
    }
    console.error('[Desktop Pet diagnostic] Unable to create log in Desktop, Documents or userData');
    return null;
  }
  const num = (n) => Number.isFinite(n) ? Math.round(n) : null;
  function sample({ win, cursor, overPet, ignored, dragging, character }) {
    const now = Date.now();
    if (!file || now - lastSample < 1200) return;
    lastSample = now;
    try {
      const [x, y] = win.getPosition();
      record('sample', {
        character, relX: num(cursor.x - x), relY: num(cursor.y - y),
        width: win.getSize()[0], height: win.getSize()[1],
        overPet: Boolean(overPet), ignored, dragging: Boolean(dragging),
        scale: screen.getDisplayNearestPoint(cursor)?.scaleFactor ?? null,
        focused: win.isFocused?.() ?? null
      });
    } catch (e) { record('sample-error', { message: String(e?.message || e).slice(0, 100) }); }
  }
  const types = new Set([
    'renderer-ready', 'pointerdown', 'pointerup', 'pointercancel',
    'pointermove', 'click', 'contextmenu', 'focus', 'blur', 'visibilitychange'
  ]);
  function rendererEvent(type, data) {
    if (!types.has(type)) return;
    const p = data && typeof data === 'object' ? data : {};
    record('renderer-' + type, {
      target: p.target === 'pet' ? 'pet' : 'other', button: num(p.button),
      clientX: num(p.clientX), clientY: num(p.clientY),
      screenX: num(p.screenX), screenY: num(p.screenY),
      trusted: p.trusted === true,
      visibility: p.visibility === 'hidden' ? 'hidden' : 'visible'
    });
  }
  function observeWindow(win, character) {
    record('window-create', { character });
    for (const name of ['focus', 'blur', 'show', 'hide'])
      win.on(name, () => record('window-' + name, { character }));
    win.webContents.on('render-process-gone', (_ev, details) =>
      record('renderer-gone', { reason: String(details?.reason || 'unknown').slice(0, 100) }));
  }
  return { start, record, sample, rendererEvent, observeWindow };
};
