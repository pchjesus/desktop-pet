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
    'win.setIgnoreMouseEvents(ignore)'
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
  assert.match(main, /setMouseEventsIgnored\(!overPet\);/);
  assert.doesNotMatch(main, /forward:\s*true/);
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
  assert.match(main, /message: '홈으로 돌아가거나 종료할까요\?'/);
  assert.match(main, /buttons: \['홈으로', '종료', '취소'\]/);
  assert.match(main, /cancelId: 2/);
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

// Main/native call trace only: this cannot prove physical Windows input delivery.
function mouseHarness() {
  const vm = require('node:vm');
  const { EventEmitter } = require('node:events');
  const handlers = {}, timers = new Map(), windows = [];
  let ready, timerId = 0;
  const area = { x:0, y:0, width:1920, height:1040 };
  const screen = new EventEmitter();
  screen.cursor = { x:160, y:160 };
  screen.getCursorScreenPoint = () => screen.cursor;
  screen.getAllDisplays = () => [{ id:1, bounds:area, workArea:area }];
  class Window extends EventEmitter {
    constructor(options) {
      super(); this.options=options;this.position=[100,100];this.mouseCalls=[];
      this.webContents=new EventEmitter();this.webContents.send=()=>{};windows.push(this);
    }
    getPosition(){return this.position;}getSize(){return[this.options.width,this.options.height];}
    setPosition(x,y){this.position=[x,y];}setAlwaysOnTop(){}focus(){}
    setIgnoreMouseEvents(...args){this.mouseCalls.push(args);this.ignores=args[0];}
    loadFile(file,options){this.file=path.basename(file);this.character=options?.query?.character;}
    isDestroyed(){return Boolean(this.destroyed);}
    close(){this.destroyed=true;this.emit('closed');}
  }
  const app={whenReady:()=>({then:fn=>ready=fn}),on(){},quit(){},getPath:()=>'/tmp'};
  const ipcMain={on:(name,fn)=>handlers[name]=fn,handle:(name,fn)=>{assert.equal(handlers[name],undefined);handlers[name]=fn;}};
  const context=vm.createContext({require:n=>n==='electron'?{app,BrowserWindow:Window,screen,ipcMain,dialog:{showMessageBox:async()=>({response:0})}}:n==='./window-bounds'?require('../src/window-bounds'):require(n),
    __dirname:path.join(root,'src'),console,process:{argv:[],env:{}},
    setInterval:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearInterval:id=>timers.delete(id)});
  vm.runInContext(main,context);ready();
  const current=()=>windows.findLast(w=>!w.destroyed&&w.file==='index.html');
  return {screen,handlers,timers,current,
    launch(character='neukgu'){handlers['start:launch-pet']({},character);return current();},
    tick(){for(const t of timers.values())if(t.ms===30)t.fn();},
    event:pet=>({sender:pet.webContents})};
}

test('stable hit testing makes one native call and never enables mouse forwarding',()=>{
  const h=mouseHarness(),pet=h.launch();
  for(let i=0;i<100;i++)h.tick();
  assert.equal(pet.mouseCalls.length,1,'stable cursor must not repeatedly rewrite native window styles');
  assert.deepEqual(pet.mouseCalls[0],[false]);
  h.screen.cursor={x:100,y:100};h.tick();
  for(let i=0;i<100;i++)h.tick();
  assert.equal(pet.ignores,true);assert.equal(pet.mouseCalls.length,2);
  assert.ok(pet.mouseCalls.every(args=>args.length===1),'no low-level forwarding hook needed by OS polling');
});

test('legacy renderer hints cannot override the native cursor decision',()=>{
  const h=mouseHarness(),pet=h.launch(),event=h.event(pet);
  h.handlers['pet:set-ignore-mouse'](event,true);
  assert.equal(pet.ignores,false,'late renderer initialization must not disable an interactive pet');
  h.screen.cursor={x:100,y:100};h.tick();
  h.handlers['pet:set-ignore-mouse'](event,false);
  assert.equal(pet.ignores,true,'transparent area must still pass through');
  assert.doesNotMatch(renderer,/window\.petAPI\.setIgnoreMouse\(true\)/);
});

test('repeated drag keeps native input enabled and synchronizes immediately at each release',()=>{
  const h=mouseHarness(),pet=h.launch(),event=h.event(pet);
  for(let repeat=0;repeat<4;repeat++){
    h.screen.cursor={x:160,y:160};h.tick();
    h.handlers['pet:drag-start'](event,{mouseX:160,mouseY:160});
    h.screen.cursor={x:10,y:10};
    for(let i=0;i<10;i++)h.tick();
    h.handlers['pet:set-ignore-mouse'](event,true);assert.equal(pet.ignores,false);
    h.handlers['pet:drag-end'](event);
    assert.equal(pet.ignores,true,'release outside must pass through without waiting another 30ms');
    const calls=pet.mouseCalls.length;h.handlers['pet:drag-end'](event);assert.equal(pet.mouseCalls.length,calls);
    h.screen.cursor={x:160,y:160};h.tick();assert.equal(pet.ignores,false,'next click/drag is enabled again');
  }
});

test('autonomous window movement changes hit testing without forwarded DOM mouse events',()=>{
  const h=mouseHarness(),pet=h.launch(),event=h.event(pet);
  h.handlers['pet:set-position'](event,{x:500,y:500});h.tick();assert.equal(pet.ignores,true);
  h.screen.cursor={x:560,y:560};h.tick();assert.equal(pet.ignores,false);
  h.handlers['pet:drag-start'](event,{mouseX:560,mouseY:560});
  h.handlers['pet:drag-end'](event);assert.equal(pet.ignores,false);
});

test('home re-entry resets cached native state and discards the old renderer mouse hints',async()=>{
  const h=mouseHarness();let previous;
  for(const character of ['growlithe','pachirisu','neukgu','royce','spheal','growlithe']){
    h.screen.cursor={x:100,y:100};const pet=h.launch(character),event=h.event(pet);
    assert.deepEqual(pet.mouseCalls[0],[true],'each new native window needs its own initial pass-through call');
    if(previous){h.handlers['pet:set-ignore-mouse'](h.event(previous),false);assert.equal(pet.ignores,true);}
    h.screen.cursor={x:160,y:160};h.tick();assert.equal(pet.ignores,false);
    h.handlers['pet:drag-start'](event,{mouseX:160,mouseY:160});
    await h.handlers['pet:quit'](event);assert.equal(h.timers.size,0);
    previous=pet;
  }
});
