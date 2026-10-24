// Native Electron lifecycle check. On CI Windows a real desktop is available;
// Linux requires DISPLAY. Only dialog responses are scripted, not BrowserWindows.
const {app,dialog,screen}=require('electron');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const assert=require('node:assert/strict');
function fail(error) {
 const detail=error.stack||String(error);console.error(detail);
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n## Native input check failure\n```text\n'+detail+'\n```\n');
 app.exit(1);
}
process.once('uncaughtException',fail);
if(process.platform==='linux'&&!process.env.DISPLAY){console.error('Native home check requires DISPLAY on Linux');app.exit(1);}
const filename=path.resolve(__dirname,'../src/main.js');
const main=new Module(filename,module);main.filename=filename;main.paths=Module._nodeModulePaths(path.dirname(filename));
let response=2,exitArmed=false;
dialog.showMessageBox=async(_win,options)=>{
 assert.deepEqual(options.buttons,['홈으로','종료','취소']);assert.equal(options.cancelId,2);
 return {response};
};
// Compile the exact production Main with private, test-only read access to its
// references; production code gains no globals, test hooks or extra IPC.
main._compile(fs.readFileSync(filename,'utf8')+'\nmodule.exports={pet:()=>win,home:()=>startWin,timers:()=>[dragTimer,hitTestTimer],fan:()=>fanProjectWin,royce:()=>royceMessageWin,manual:()=>manualWin,hitTest:updateMouseHitTesting};',filename);
const refs=main.exports;
const wait=async(fn)=>{const end=Date.now()+15000;while(Date.now()<end){const value=await fn();if(value)return value;await new Promise(r=>setTimeout(r,30));}throw new Error('Native window readiness timeout');};
const loaded=async(get)=>wait(async()=>{const win=get();if(!win||win.isDestroyed()||win.webContents.isLoading())return false;try{return await win.webContents.executeJavaScript("document.readyState==='complete'")?win:false;}catch{return false;}});
(async()=>{
 await app.whenReady();
 let home=await loaded(refs.home);
 await home.webContents.executeJavaScript("document.getElementById('manual').click();undefined;");
 const manual=await loaded(refs.manual);assert.match(await manual.webContents.executeJavaScript('document.title'),/사용 설명서/);manual.close();
 for(const character of ['growlithe','pachirisu','neukgu','royce','spheal','growlithe']){
  await home.webContents.executeJavaScript(`document.querySelector('[data-character="${character}"]').click(); document.getElementById('start').click(); undefined;`).catch(()=>{});
  const pet=await loaded(refs.pet);
  assert.equal(await pet.webContents.executeJavaScript('document.body.dataset.character'),character);
  // Script only the cursor coordinates, then exercise the real Windows native
  // setter and renderer IPC. This is not physical OS mouse injection.
  await pet.webContents.executeJavaScript('clearInterval(behaviorTimer);undefined;');
  const originalCursor=screen.getCursorScreenPoint;
  let cursor={x:pet.getPosition()[0]+55,y:pet.getPosition()[1]+55};
  screen.getCursorScreenPoint=()=>cursor;
  const nativeIgnore=pet.setIgnoreMouseEvents.bind(pet);const mouseCalls=[];
  pet.setIgnoreMouseEvents=(...args)=>{mouseCalls.push(args);return nativeIgnore(...args);};
  refs.hitTest();
  for(let repeat=0;repeat<3;repeat++){
    const stable=mouseCalls.length;for(let i=0;i<100;i++)refs.hitTest();assert.equal(mouseCalls.length,stable);
    await pet.webContents.executeJavaScript('window.petAPI.setIgnoreMouse(true);window.petAPI.getWindow();');
    assert.equal(mouseCalls.length,stable,'legacy hint cannot disable a pet under the cursor');
    await pet.webContents.executeJavaScript(`pet.dispatchEvent(new PointerEvent('pointerdown',{button:0,screenX:${cursor.x},screenY:${cursor.y},pointerId:1}));pet.dispatchEvent(new PointerEvent('pointerup',{button:0,screenX:${cursor.x},screenY:${cursor.y},pointerId:1}));window.petAPI.getWindow();`);
    assert.equal(mouseCalls.length,stable,'repeat click must not churn native state');
    cursor={x:pet.getPosition()[0],y:pet.getPosition()[1]};refs.hitTest();assert.equal(mouseCalls.at(-1)[0],true);
    cursor={x:pet.getPosition()[0]+55,y:pet.getPosition()[1]+55};refs.hitTest();assert.equal(mouseCalls.at(-1)[0],false);
  }
  assert.ok(mouseCalls.every(args=>args.length===1),'native mouse forwarding must remain disabled');
  await pet.webContents.executeJavaScript(`window.petAPI.getWindow().then(i=>{if(!i)throw new Error('get-window')});`);
  if(character==='royce')assert.equal(await pet.webContents.executeJavaScript('window.petAPI.showRoyceMessage()'),true);
  if(character==='growlithe'||character==='spheal'){
   await pet.webContents.executeJavaScript('window.petAPI.openFanProject();undefined;');await loaded(refs.fan);
  }
  const fan=refs.fan(),royce=refs.royce();
  if(character==='growlithe'||character==='pachirisu'){
   await pet.webContents.executeJavaScript(`character.startSpecialAction('${character==='growlithe'?'flamethrower':'followme'}');character.render(performance.now());window.petAPI.dragStart(100,100);undefined;`);
  }
  response=2;assert.equal(await pet.webContents.executeJavaScript('window.petAPI.quit()'),false);
  assert.equal(refs.pet(),pet);assert.equal(pet.isDestroyed(),false);
  response=0;
  await pet.webContents.executeJavaScript('void window.petAPI.quit();').catch(error=>{if(!pet.isDestroyed())throw error;});
  home=await loaded(refs.home);await wait(()=>pet.isDestroyed());
  screen.getCursorScreenPoint=originalCursor;
  assert.equal(refs.pet(),null);assert.deepEqual(refs.timers(),[null,null]);
  if(fan)assert.equal(fan.isDestroyed(),true);if(royce)assert.equal(royce.isDestroyed(),true);
 }
 console.log('PASS: real native ignore calls coalesced, no forwarding, scripted cursor/re-click/IPC across all five pets (physical mouse NOT VERIFIED)');
 console.log('PASS: native Home -> Growlithe -> Pachirisu -> Neukgu -> Royce -> Spheal -> Growlithe, fresh renderers/IPC, cancel, special/drag cleanup');
 await home.webContents.executeJavaScript(`document.querySelector('[data-character="growlithe"]').click();document.getElementById('start').click();undefined;`).catch(()=>{});
 const pet=await loaded(refs.pet);response=1;exitArmed=true;
 app.once('before-quit',()=>console.log('PASS: native Exit requests app shutdown (dialog responses scripted)'));
 await pet.webContents.executeJavaScript('void window.petAPI.quit();').catch(()=>{});
})().catch(fail);
setTimeout(()=>{console.error('Home check timeout');app.exit(1);},60000).unref();
