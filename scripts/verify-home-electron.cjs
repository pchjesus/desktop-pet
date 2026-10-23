// Native Electron lifecycle check. On CI Windows a real desktop is available;
// Linux requires DISPLAY. Only dialog responses are scripted, not BrowserWindows.
const {app,dialog}=require('electron');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const assert=require('node:assert/strict');
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
main._compile(fs.readFileSync(filename,'utf8')+'\nmodule.exports={pet:()=>win,home:()=>startWin,timers:()=>[dragTimer,hitTestTimer],fan:()=>fanProjectWin,royce:()=>royceMessageWin,manual:()=>manualWin};',filename);
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
  assert.equal(refs.pet(),null);assert.deepEqual(refs.timers(),[null,null]);
  if(fan)assert.equal(fan.isDestroyed(),true);if(royce)assert.equal(royce.isDestroyed(),true);
 }
 console.log('PASS: native Home -> Growlithe -> Pachirisu -> Neukgu -> Royce -> Spheal -> Growlithe, fresh renderers/IPC, cancel, special/drag cleanup');
 await home.webContents.executeJavaScript(`document.querySelector('[data-character="growlithe"]').click();document.getElementById('start').click();undefined;`).catch(()=>{});
 const pet=await loaded(refs.pet);response=1;exitArmed=true;
 app.once('before-quit',()=>console.log('PASS: native Exit requests app shutdown (dialog responses scripted)'));
 await pet.webContents.executeJavaScript('void window.petAPI.quit();').catch(()=>{});
})().catch(error=>{console.error(error.stack);exitArmed=false;app.exit(1);});
setTimeout(()=>{console.error('Home check timeout');app.exit(1);},60000).unref();
