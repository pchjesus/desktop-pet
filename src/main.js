const { app, BrowserWindow, dialog, ipcMain, screen } = require('electron');
const PET_DEBUG = process.env.PET_DEBUG === '1';
const debugLog = (...args) => { if (PET_DEBUG) console.log('[PET]', ...args); };
const path = require('path');
const fs = require('fs');
const windowBounds = require('./window-bounds');

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
let returningHome = false;
let petDialogOpen = false;
let activeCharacter = 'neukgu';
let lastDisplayId = null;
let windowRevision = 0;

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
  const [width, height] = win ? win.getSize() : [180, 150];
  return windowBounds.constrainPosition({ x, y },
    windowBounds.visualBounds(activeCharacter, width, height), screen.getAllDisplays()).display;
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
  publishWindowInfo();
}

function movementBounds(area, width, height) {
  return windowBounds.movementBounds(area, windowBounds.visualBounds(activeCharacter, width, height));
}

function clampWindow(x, y) {
  if (!win) return { x: 0, y: 0 };

  const [w, h] = win.getSize();
  const [currentX, currentY] = win.getPosition();
  const safeX = sanitizeCoordinate(x, currentX);
  const safeY = sanitizeCoordinate(y, currentY);
  const next = windowBounds.constrainPosition({ x: safeX, y: safeY },
    windowBounds.visualBounds(activeCharacter, w, h), screen.getAllDisplays());
  return { x: sanitizeCoordinate(next.x, currentX), y: sanitizeCoordinate(next.y, currentY) };
}

function getWindowInfo() {
  if (!win) return null;
  const [x, y] = win.getPosition(), [width, height] = win.getSize();
  const display = displayForWindowPosition(x, y), area = display.workArea;
  return { x, y, width, height, area, displayId: display.id, revision: ++windowRevision,
    movementBounds: movementBounds(area, width, height) };
}

function publishWindowInfo() {
  const info = getWindowInfo();
  if (!info) return;
  lastDisplayId = info.displayId;
  win.webContents.send('pet:window-updated', info);
}

function reconcileWindow() {
  if (!win) return;
  const [x, y] = win.getPosition(), next = clampWindow(x, y);
  safeSetPosition(next.x, next.y);
  if (dragging && dragStart) {
    const cursor = screen.getCursorScreenPoint(), [px, py] = win.getPosition();
    dragStart = { x: px, y: py, mouseX: cursor.x, mouseY: cursor.y };
  }
  publishWindowInfo();
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
  if (win) return;
  const selectedCharacter = ['growlithe', 'royce', 'spheal', 'pachirisu'].includes(characterId) ? characterId : 'neukgu';
  activeCharacter = selectedCharacter;
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

  const petWindow = win;
  win.setAlwaysOnTop(true, 'floating');
  win.webContents.once('did-finish-load', () => {
    if (win === petWindow) { reconcileWindow(); markSmokeReady(); }
  });
  win.loadFile(path.join(__dirname, 'index.html'), { query: { character: selectedCharacter } });

  win.on('closed', () => {
    if (win !== petWindow) return;
    win = null;
    clearPetActivity();
  });
}


// One app-lifetime registration; handlers read the current window/character.
function isCurrentPet(event) {
  return Boolean(win && !returningHome && (!event?.sender || event.sender === win.webContents));
}

function clearPetActivity() {
  dragging = false;
  dragStart = null;
  stopDragTimer();
  stopMouseHitTesting();
  lastDisplayId = null;
  clearSmokeMarker();
}

async function returnHome(petWindow) {
  if (returningHome || win !== petWindow) return false;
  returningHome = true;
  try {
    clearPetActivity();
    const closing = [royceMessageWin, fanProjectWin, petWindow].filter(child => child && !child.isDestroyed());
    // Wait for real closed events: Electron close() may finish asynchronously.
    await Promise.all(closing.map(child => new Promise(resolve => {
      child.once('closed', resolve);
      child.close();
    })));
    // Destroying the old renderer clears its behavior/input/special timers.
    createStartWindow();
    return true;
  } finally { returningHome = false; }
}

function registerPetIPC() {
  ipcMain.handle('pet:get-window', (event) => isCurrentPet(event) ? getWindowInfo() : null);

  ipcMain.on('pet:set-position', (_event, { x, y }) => {
    if (!isCurrentPet(_event) || dragging) return;
    const next = clampWindow(x, y);
    safeSetPosition(next.x, next.y);
    const [actualX, actualY] = win.getPosition();
    if (actualX !== Math.round(x) || actualY !== Math.round(y)
        || displayForWindowPosition(actualX, actualY).id !== lastDisplayId) publishWindowInfo();
  });

  ipcMain.handle('pet:quit', async (event) => {
    if (!isCurrentPet(event) || petDialogOpen || returningHome) return false;
    const dialogWindow = win;
    petDialogOpen = true;
    try {
      const result = await dialog.showMessageBox(win, {
        type: 'question',
        buttons: ['홈으로', '종료', '취소'],
        defaultId: 2,
        cancelId: 2,
        noLink: true,
        message: '홈으로 돌아가거나 종료할까요?'
      });
      // Ignore replies belonging to a pet that has already been closed.
      if (win !== dialogWindow) return false;
      if (result.response === 0) return await returnHome(dialogWindow);
      if (result.response === 1) { app.quit(); return true; }
      return false;
    } finally { petDialogOpen = false; }
  });

  ipcMain.on('pet:open-fan-project', (event) => { if (isCurrentPet(event)) createFanProjectWindow(); });

  ipcMain.handle('pet:show-royce-message', (event) => {
    const selectedCharacter = activeCharacter;
    if (!isCurrentPet(event) || selectedCharacter !== 'royce') return false;
    createRoyceMessageWindow();
    return true;
  });

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
  if (startWin && !startWin.isDestroyed()) { startWin.focus(); return; }
  startWin = new BrowserWindow({
    width: 680,
    height: 560,
    useContentSize: true,
    resizable: false,
    title: 'Desktop Pet',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'start-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  const launcherWindow = startWin;
  startWin.loadFile(path.join(__dirname, 'start.html'));
  startWin.on('closed', () => {
    if (startWin !== launcherWindow) return;
    startWin = null;
    if (!launchingPet && !returningHome && !win) app.quit();
  });
}

ipcMain.on('start:launch-pet', (_event, characterId) => {
  if (_event?.sender && _event.sender !== startWin?.webContents) return;
  if (win || launchingPet || returningHome) return;
  launchingPet = true;
  const launcherWindow = startWin;
  startWin = null;
  if (launcherWindow && !launcherWindow.isDestroyed()) launcherWindow.close();
  createPetWindow(characterId);
  startMouseHitTesting();
  launchingPet = false;
});

ipcMain.on('start:open-manual', () => {
  createManualWindow();
});

app.whenReady().then(() => {
  registerPetIPC();
  for (const event of ['display-added', 'display-removed', 'display-metrics-changed']) {
    screen.on(event, reconcileWindow);
  }
  if (smokeTest) {
    createPetWindow();
    startMouseHitTesting();
  } else {
    createStartWindow();
  }

  ipcMain.on('pet:set-ignore-mouse', (_event, ignore) => {
    if (isCurrentPet(_event) && !dragging) win.setIgnoreMouseEvents(Boolean(ignore), { forward: true });
  });

  ipcMain.on('pet:drag-start', (_event, { mouseX, mouseY }) => {
    if (!isCurrentPet(_event)) return;
    dragging = true;
    win.setIgnoreMouseEvents(false);
    const [x, y] = win.getPosition();
    dragStart = { x, y, mouseX, mouseY };
    stopDragTimer();
    dragTimer = setInterval(updateDraggedWindow, 16);
  });

  ipcMain.on('pet:drag-move', (_event, { mouseX, mouseY }) => {
    if (!isCurrentPet(_event) || !dragging || !dragStart) return;
    const next = clampWindow(
      dragStart.x + mouseX - dragStart.mouseX,
      dragStart.y + mouseY - dragStart.mouseY
    );
    win.setPosition(next.x, next.y, false);
    publishWindowInfo();
  });

  ipcMain.on('pet:drag-end', (event) => {
    if (!isCurrentPet(event)) return;
    dragging = false;
    dragStart = null;
    stopDragTimer();
    reconcileWindow();
  });
});

// Electron emits no event argument here. A listener keeps the app alive while
// Home waits for the old windows to close; explicit Exit still uses app.quit().
app.on('window-all-closed', () => {});
app.on('before-quit', () => {
  dragging = false;
  dragStart = null;
  stopDragTimer();
  stopMouseHitTesting();
  clearSmokeMarker();
});
