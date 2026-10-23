const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'src', 'renderer.js'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const startHtml = fs.readFileSync(path.join(root, 'src', 'start.html'), 'utf8');
const startPreload = fs.readFileSync(path.join(root, 'src', 'start-preload.js'), 'utf8');
const roycePopup = fs.readFileSync(path.join(root, 'src', 'royce-message.html'), 'utf8');

function includesAll(source, fragments) {
  return fragments.every((fragment) => source.includes(fragment));
}

test('desktop shell keeps the required transparent always-on-top window contract', () => {
  assert.equal(includesAll(main, [
    'frame: false',
    'transparent: true',
    'alwaysOnTop: true',
    'skipTaskbar: true',
    "win.setAlwaysOnTop(true, 'floating')",
    'win.setIgnoreMouseEvents(Boolean(ignore), { forward: true })'
  ]), true);
});

test('renderer preserves click-vs-drag classification and autonomous movement', () => {
  assert.equal(includesAll(renderer, [
    'if (!didDrag)',
    'window.petAPI.dragStart',
    'window.petAPI.dragMove',
    'window.petAPI.dragEnd',
    
    'stepToward',
    'setInterval(() => tick(performance.now()), 16)'
  ]), true);
  assert.match(main, /backgroundThrottling:\s*false/);
});

test('IPC bridge keeps the existing interaction surface', () => {
  assert.equal(includesAll(preload, [
    "'pet:set-ignore-mouse'",
    "'pet:drag-start'",
    "'pet:drag-move'",
    "'pet:drag-end'",
    "'pet:get-window'",
    "'pet:set-position'",
    "'pet:quit'"
  ]), true);
});

test('UI keeps all MVP behavior states', () => {
  assert.equal(includesAll(html, ['id="pet"', 'id="neukgu"', 'id="bubble"']), true);
});


test('main process performs OS-level hit testing for the pet interaction area', () => {
  assert.match(main, /function updateMouseHitTesting\(\)/);
  assert.match(main, /screen\.getCursorScreenPoint\(\)/);
  assert.match(main, /win\.setIgnoreMouseEvents\(!overPet, \{ forward: true \}\);/);
  assert.match(main, /setInterval\(updateMouseHitTesting, 30\)/);
});

test('renderer keeps pointer capture and pointer cancellation for drag continuity', () => {
  assert.match(renderer, /window\.addEventListener\('pointermove'/);
  assert.match(renderer, /pet\.setPointerCapture/);
  assert.match(renderer, /pet\.addEventListener\('pointerup'/);
  assert.match(renderer, /pet\.addEventListener\('pointercancel'/);
  assert.match(renderer, /window\.addEventListener\('blur'/);
  assert.match(renderer, /if \(!didDrag\)/);
});

test('main process keeps drag movement owned by the OS window layer', () => {
  assert.match(main, /screen\.getCursorScreenPoint\(\)/);
  assert.match(main, /win\.setPosition\(next\.x, next\.y, false\)/);
});


test('packaged smoke mode reports renderer readiness and drag has a main-process safety timer', () => {
  assert.match(main, /process\.argv\.includes\('--smoke-test'\)/);
  assert.match(main, /did-finish-load/);
  assert.match(main, /desktop-pet-smoke-\$\{process\.pid\}\.ready/);
  assert.match(main, /setInterval\(updateDraggedWindow, 16\)/);
  assert.match(main, /screen\.getCursorScreenPoint\(\)/);
});


test('right-click asks for quit confirmation without affecting left-click drag behavior', () => {
  assert.match(renderer, /pet\.addEventListener\('contextmenu'/);
  assert.match(renderer, /event\.preventDefault\(\)/);
  assert.match(renderer, /window\.petAPI\.quit\(\)/);
  assert.match(preload, /ipcRenderer\.invoke\('pet:quit'\)/);
  assert.match(main, /ipcMain\.handle\('pet:quit'/);
  assert.match(main, /dialog\.showMessageBox\(win/);
  assert.match(main, /message: '종료할까요\?'/);
  assert.match(main, /buttons: \['확인', '취소'\]/);
  assert.match(main, /cancelId: 1/);
  assert.match(main, /if \(result\.response === 0\)/);
  assert.match(main, /app\.quit\(\)/);
});

test('startup flow opens a start screen and can launch the existing pet window', () => {
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  const manualHtml = fs.readFileSync(path.join(root, 'src', 'manual.html'), 'utf8');
  assert.match(main, /function createStartWindow\(\)/);
  assert.match(main, /function createManualWindow\(\)/);
  assert.match(main, /ipcMain\.on\('start:launch-pet'/);
  assert.match(main, /ipcMain\.on\('start:open-manual'/);
  assert.match(main, /createStartWindow\(\)/);
  assert.match(main, /createPetWindow\(characterId = 'neukgu'\)/);
  assert.match(startHtml, /id="start"/);
  assert.match(startHtml, /id="manual"/);
  assert.match(startHtml, /window\.startAPI\.start\(selectedCharacter\)/);
  assert.match(startHtml, /window\.startAPI\.openManual\(\)/);
  assert.match(startPreload, /'start:launch-pet'/);
  assert.match(startPreload, /'start:open-manual'/);
  assert.match(manualHtml, /Desktop Pet 사용 설명서/);
  assert.match(manualHtml, /pchjesus@naver\.com/);
});

test('smoke mode bypasses the start screen so packaged renderer readiness remains testable', () => {
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  assert.match(main, /if \(smokeTest\) \{\s*createPetWindow\(\);/);
});


test('character selection passes only the supported character ids into the pet window', () => {
  assert.match(main, /\['growlithe', 'royce', 'spheal', 'pachirisu'\]\.includes\(characterId\)/);
  assert.match(main, /loadFile\(path\.join\(__dirname, 'index\.html'\), \{ query: \{ character: selectedCharacter \} \}\)/);
  assert.match(startHtml, /data-character="neukgu"/);
  assert.match(startHtml, /data-character="growlithe"/);
  assert.match(startHtml, /data-character="royce"/);
  assert.match(startHtml, /data-character="spheal"/);
  assert.match(startPreload, /start: \(characterId\) => ipcRenderer\.send\('start:launch-pet', characterId\)/);
  assert.match(startHtml, /id="tip"/);
  assert.match(startHtml, /pocketmon/);
  assert.match(startHtml, /royce/);
  assert.match(startHtml, /assets\/characters\/royce\.svg/);
});

test('growlithe uses the original pixel sprite without replacing the Neukgu DOM', () => {
  assert.match(html, /class="growlithe-sprite"/);
  assert.match(html, /assets\/characters\/growlithe-hgss\.png/);
  assert.match(html, /characters\/growlithe\.js/);
  assert.match(html, /characters\/royce\.js/);
  assert.match(html, /id="royce"/);
  assert.match(html, /id="neukgu"/);
  assert.doesNotMatch(html, /growlithe-(idle|walk|react)-sheet\.png/);
  assert.doesNotMatch(html, /class="growlithe-svg"/);
});

test('growlithe Easter egg input is armed only after a growlithe click', () => {
  assert.match(renderer, /selectedCharacter !== 'growlithe'/);
  assert.match(renderer, /if \(selectedCharacter === 'growlithe'\) return 'pocketmon'/);
  assert.match(renderer, /window\.petAPI\.openFanProject\(\)/);
  assert.match(preload, /pet:open-fan-project/);
  assert.match(main, /createFanProjectWindow\(\)/);
  assert.match(renderer, /selectedCharacter === 'royce'/);
  assert.match(renderer, /easterEggBuffer === easterEggCode\(\)/);
  assert.match(renderer, /return 'royce'/);
  assert.match(renderer, /royce: \['멍!', '쓰담\?', '좋아!', '화이팅!', '보고 싶어!'\]/);
  assert.match(preload, /pet:show-royce-message/);
  assert.match(main, /ipcMain\.handle\('pet:show-royce-message'/);
  assert.match(main, /selectedCharacter !== 'royce'/);
  assert.match(main, /createRoyceMessageWindow\(\)/);
  assert.match(main, /royce-message\.html/);
  assert.match(roycePopup, /우재민 화이팅!/);
  assert.match(roycePopup, /id="close"/);
});


test('main accepts spheal as a selectable pet character', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');
  assert.match(main, /\['growlithe', 'royce', 'spheal', 'pachirisu'\]\.includes\(characterId\)/);
});
