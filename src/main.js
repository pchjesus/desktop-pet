const { app, BrowserWindow, dialog, ipcMain, screen } = require('electron');
const PET_DEBUG = process.env.PET_DEBUG === '1';
const debugLog = (...args) => { if (PET_DEBUG) console.log('[PET]', ...args); };
const path = require('path');
const fs = require('fs');

let win;
let startWin;
let manualWin;
let fanProjectWin;
let royceMessageWin;
let tray;
let dragging = false;
let dragStart = null;
let dragTimer = null;
let hitTestTimer = null;
let launchingPet = false;

const smokeTest = process.argv.includes('--smoke-test');
let smokeMarker = null;

function markSmokeReady() {
  if (!smokeTest) return;
  smokeMarker = path.join(app.getPath('temp'), `desktop-pet-smoke-${process.pid}.ready`);
  fs.writeFileSync(smokeMarker, JSON.stringify({ pid: process.pid, ready: true, timestamp: Date.now() }));
}

function clearSmokeMarker() {
  if (!smokeMarker) return;
  try { fs.unlinkSync(smokeMarker); } catch {}
  smokeMarker = null;
}

function stopDragTimer() {
  if (dragTimer) clearInterval(dragTimer);
  dragTimer = null;
}

const MIN_NATIVE_COORDINATE = -2147483648;
const MAX_NATIVE_COORDINATE = 2147483647;

function sanitizeCoordinate(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;

  const rounded = Math.round(numeric);
  if (!Number.isSafeInteger(rounded)) return fallback;
  if (rounded < MIN_NATIVE_COORDINATE || rounded > MAX_NATIVE_COORDINATE) return fallback;
  return rounded;
}

function displayForWindowPosition(x, y) {
  if (!win) return screen.getPrimaryDisplay();
  const [width, height] = win.getSize();
  const center = {
    x: Math.round(x + width / 2),
    y: Math.round(y + height / 2)
  };
  return screen.getDisplayNearestPoint(center);
}

function workAreaForWindowPosition(x, y) {
  return displayForWindowPosition(x, y).workArea;
}

function safeSetPosition(x, y) {
  if (!win) return;
  const [currentX, currentY] = win.getPosition();
  const safeX = sanitizeCoordinate(x, currentX);
  const safeY = sanitizeCoordinate(y, currentY);
  if (safeX === currentX && safeY === currentY) return;

  try {
    win.setPosition(safeX, safeY, false);
  } catch (error) {
    debugLog('setPosition rejected coordinates', {
      requested: { x, y },
      safe: { x: safeX, y: safeY },
      current: { x: currentX, y: currentY },
      error: error?.message || String(error)
    });
  }
}

function updateDraggedWindow() {
  if (!win || !dragging || !dragStart) return;
  const cursor = screen.getCursorScreenPoint();
  const next = clampWindow(
    dragStart.x + cursor.x - dragStart.mouseX,
    dragStart.y + cursor.y - dragStart.mouseY
  );
  win.setPosition(next.x, next.y, false);
}

// Current Neukgu visual bounds inside the transparent 180x150 window.
// The window may extend beyond the screen so Neukgu itself can reach the edge.
const PET_VISUAL_BOUNDS = Object.freeze({
  left: 60,
  top: 50,
  right: 122,
  bottom: 112
});

function movementBounds(area, width, height) {
  return {
    minX: area.x - PET_VISUAL_BOUNDS.left,
    maxX: area.x + area.width - PET_VISUAL_BOUNDS.right,
    minY: area.y - PET_VISUAL_BOUNDS.top,
    maxY: area.y + area.height - PET_VISUAL_BOUNDS.bottom
  };
}

function clampWindow(x, y) {
  if (!win) return { x: 0, y: 0 };

  const [w, h] = win.getSize();
  const [currentX, currentY] = win.getPosition();
  const safeX = sanitizeCoordinate(x, currentX);
  const safeY = sanitizeCoordinate(y, currentY);
  const area = workAreaForWindowPosition(safeX, safeY);
  const bounds = movementBounds(area, w, h);

  return {
    x: sanitizeCoordinate(Math.max(bounds.minX, Math.min(safeX, bounds.maxX)), currentX),
    y: sanitizeCoordinate(Math.max(bounds.minY, Math.min(safeY, bounds.maxY)), currentY)
  };
}

function updateMouseHitTesting() {
  if (!win || dragging) return;
  const [x, y] = win.getPosition();
  const cursor = screen.getCursorScreenPoint();

  // The pet occupies the central 110x110 area of the 180x150 transparent window.
  const overPet =
    cursor.x >= x + 35 &&
    cursor.x <= x + 145 &&
    cursor.y >= y + 20 &&
    cursor.y <= y + 130;

  win.setIgnoreMouseEvents(!overPet, { forward: true });
}

function startMouseHitTesting() {
  if (hitTestTimer) clearInterval(hitTestTimer);
  hitTestTimer = setInterval(updateMouseHitTesting, 30);
  updateMouseHitTesting();
}

function stopMouseHitTesting() {
  if (hitTestTimer) clearInterval(hitTestTimer);
  hitTestTimer = null;
}

function createPetWindow(characterId = 'neukgu') {
  const selectedCharacter = characterId === 'growlithe' || characterId === 'royce' ? characterId : 'neukgu';
  win = new BrowserWindow({
    width: 180,
    height: 150,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  win.setAlwaysOnTop(true, 'floating');
  win.webContents.once('did-finish-load', markSmokeReady);
  win.loadFile(path.join(__dirname, 'index.html'), { query: { character: selectedCharacter } });

  ipcMain.handle('pet:get-window', () => {
    if (!win) return null;
    const [x, y] = win.getPosition();
    const [width, height] = win.getSize();
    const area = workAreaForWindowPosition(x, y);
    const bounds = movementBounds(area, width, height);
    return { x, y, width, height, area, movementBounds: bounds };
  });

  ipcMain.on('pet:set-position', (_event, { x, y }) => {
    if (!win || dragging) return;
    const next = clampWindow(x, y);
    safeSetPosition(next.x, next.y);
  });

  ipcMain.handle('pet:quit', async () => {
    if (!win) return false;
    const result = await dialog.showMessageBox(win, {
      type: 'question',
      buttons: ['확인', '취소'],
      defaultId: 1,
      cancelId: 1,
      noLink: true,
      message: '종료할까요?'
    });
    if (result.response === 0) {
      app.quit();
      return true;
    }
    return false;
  });

  ipcMain.on('pet:open-fan-project', () => createFanProjectWindow());

  ipcMain.handle('pet:show-royce-message', () => {
    if (!win || selectedCharacter !== 'royce') return false;
    createRoyceMessageWindow();
    return true;
  });

  win.on('closed', () => { win = null; });
}


function createRoyceMessageWindow() {
  if (royceMessageWin && !royceMessageWin.isDestroyed()) {
    royceMessageWin.focus();
    return;
  }

  royceMessageWin = new BrowserWindow({
    width: 380,
    height: 240,
    minWidth: 380,
    minHeight: 240,
    maxWidth: 380,
    maxHeight: 240,
    title: 'Desktop Pet',
    resizable: false,
    autoHideMenuBar: true,
    center: true,
    alwaysOnTop: true,
    parent: win || undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  royceMessageWin.loadFile(path.join(__dirname, 'royce-message.html'));
  royceMessageWin.on('closed', () => { royceMessageWin = null; });
}


function createFanProjectWindow() {
  if (fanProjectWin && !fanProjectWin.isDestroyed()) {
    fanProjectWin.focus();
    return;
  }

  fanProjectWin = new BrowserWindow({
    width: 620,
    height: 500,
    minWidth: 560,
    minHeight: 440,
    title: 'Pokémon Fan Project',
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  fanProjectWin.loadFile(path.join(__dirname, 'fan-project.html'));
  fanProjectWin.on('closed', () => { fanProjectWin = null; });
}

function createManualWindow() {
  if (manualWin && !manualWin.isDestroyed()) {
    manualWin.focus();
    return;
  }

  manualWin = new BrowserWindow({
    width: 680,
    height: 760,
    minWidth: 560,
    minHeight: 600,
    title: 'Desktop Pet 사용 설명서',
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  manualWin.loadFile(path.join(__dirname, 'manual.html'));
  manualWin.on('closed', () => { manualWin = null; });
}

function createStartWindow() {
  startWin = new BrowserWindow({
    width: 500,
    height: 500,
    resizable: false,
    title: 'Desktop Pet',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'start-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  startWin.loadFile(path.join(__dirname, 'start.html'));
  startWin.on('closed', () => {
    startWin = null;
    if (!launchingPet && !win) app.quit();
  });
}

ipcMain.on('start:launch-pet', (_event, characterId) => {
  if (win || launchingPet) return;
  launchingPet = true;
  if (startWin && !startWin.isDestroyed()) startWin.close();
  createPetWindow(characterId);
  startMouseHitTesting();
  launchingPet = false;
});

ipcMain.on('start:open-manual', () => {
  createManualWindow();
});

app.whenReady().then(() => {
  if (smokeTest) {
    createPetWindow();
    startMouseHitTesting();
  } else {
    createStartWindow();
  }

  ipcMain.on('pet:set-ignore-mouse', (_event, ignore) => {
    if (win && !dragging) win.setIgnoreMouseEvents(Boolean(ignore), { forward: true });
  });

  ipcMain.on('pet:drag-start', (_event, { mouseX, mouseY }) => {
    if (!win) return;
    dragging = true;
    win.setIgnoreMouseEvents(false);
    const [x, y] = win.getPosition();
    dragStart = { x, y, mouseX, mouseY };
    stopDragTimer();
    dragTimer = setInterval(updateDraggedWindow, 16);
  });

  ipcMain.on('pet:drag-move', (_event, { mouseX, mouseY }) => {
    if (!win || !dragging || !dragStart) return;
    const next = clampWindow(
      dragStart.x + mouseX - dragStart.mouseX,
      dragStart.y + mouseY - dragStart.mouseY
    );
    win.setPosition(next.x, next.y, false);
  });

  ipcMain.on('pet:drag-end', () => {
    dragging = false;
    dragStart = null;
    stopDragTimer();
  });
});

app.on('window-all-closed', (event) => event.preventDefault());
app.on('before-quit', () => {
  dragging = false;
  dragStart = null;
  stopDragTimer();
  stopMouseHitTesting();
  clearSmokeMarker();
});
