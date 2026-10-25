const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const {EventEmitter}=require('node:events');
function setup(){
 const appHandlers={},handlers={}, registrations={}, timers=new Map(),windows=[];let ready,id=0,quit=0;
 const ipcMain={handle(name,fn){assert.equal(handlers[name],undefined,'duplicate handle '+name);handlers[name]=fn;registrations[name]=1;},on(name,fn){assert.equal(handlers[name],undefined,'duplicate listener '+name);handlers[name]=fn;registrations[name]=1;}};
 const app={whenReady:()=>({then:fn=>ready=fn}),on(name,callback){appHandlers[name]=callback},quit(){quit++},getPath:()=>'/tmp'};
 const screen=new EventEmitter();const display={id:1,bounds:{x:0,y:0,width:1920,height:1080},workArea:{x:0,y:0,width:1920,height:1040}};
 screen.getAllDisplays=()=>[display];screen.getCursorScreenPoint=()=>({x:100,y:100});
 class Window extends EventEmitter{
  constructor(options){super();this.options=options;this.position=[100,100];this.webContents=new EventEmitter();this.webContents.send=()=>{};this.destroyed=false;windows.push(this);}
  loadFile(file,options){this.file=path.basename(file);this.query=options?.query;}
  getPosition(){return this.position;}getSize(){return[this.options.width,this.options.height];}setPosition(x,y){this.position=[x,y];}
  setAlwaysOnTop(){}setIgnoreMouseEvents(){}focus(){this.focused=true;}isDestroyed(){return this.destroyed;}
  close(){assert.equal(this.destroyed,false);this.destroyed=true;this.emit('closed');}
 }
 let response=2,resolveDialog;
 const dialog={options:null,showMessageBox(_win,options){this.options=options;return response==='pending'?new Promise(r=>resolveDialog=r):Promise.resolve({response});}};
 const context=vm.createContext({require:n=>n==='electron'?{app,BrowserWindow:Window,dialog,ipcMain,screen}:n==='./window-bounds'?require('../src/window-bounds'):n==='./input-diagnostics'?()=>({start(){},record(){},sample(){},rendererEvent(){},observeWindow(){}}):require(n),__dirname:path.resolve(__dirname,'../src'),process:{env:{},argv:[]},console,setInterval:fn=>{timers.set(++id,fn);return id},clearInterval:n=>timers.delete(n)});
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../src/main.js'),'utf8'),context);ready();
 return{appHandlers,handlers,windows,timers,dialog,context,registrations,response:n=>response=n,resolveDialog:r=>resolveDialog({response:r}),quit:()=>quit,current:()=>windows.findLast(w=>!w.destroyed&&w.file==='index.html'),launcher:()=>windows.findLast(w=>!w.destroyed&&w.file==='start.html')};
}
test('home → Growlithe → home → Pachirisu → home → Neukgu and both other pets reuse one IPC registration',async()=>{
 const h=setup();let previous;
 for(const character of ['growlithe','pachirisu','neukgu','royce','spheal','growlithe']){
  const launcher=h.launcher();assert.ok(launcher);
  h.handlers['start:launch-pet']({sender:launcher.webContents},character);
  const pet=h.current();assert.equal(pet.query.character,character);assert.equal(launcher.destroyed,true);assert.equal(h.quit(),0);
  const event={sender:pet.webContents};assert.ok(h.handlers['pet:get-window'](event));
  assert.equal(h.handlers['pet:show-royce-message'](event),character==='royce');
  h.handlers['pet:open-fan-project'](event);assert.ok(h.windows.findLast(w=>!w.destroyed&&w.file==='fan-project.html'));
  h.handlers['pet:drag-start'](event,{mouseX:100,mouseY:100});assert.equal(h.timers.size,2);
  h.response(0);assert.equal(await h.handlers['pet:quit'](event),true);
  assert.deepEqual(Array.from(h.dialog.options.buttons),['홈으로','종료','취소']);assert.equal(h.dialog.options.cancelId,2);
  assert.equal(pet.destroyed,true);assert.equal(h.timers.size,0);assert.equal(h.quit(),0);assert.ok(h.launcher());
  assert.equal(h.windows.filter(w=>!w.destroyed&&w.file==='start.html').length,1);
  assert.equal(h.windows.filter(w=>!w.destroyed&&['fan-project.html','royce-message.html'].includes(w.file)).length,0);
  if(previous)assert.equal(h.handlers['pet:get-window']({sender:previous.webContents}),null);
  previous=pet;
 }
 assert.ok(Object.values(h.registrations).every(n=>n===1));
});
test('cancel keeps the pet; repeated dialogs and stale replies cannot create duplicate homes',async()=>{
 const h=setup();h.handlers['start:launch-pet']({},'growlithe');const pet=h.current(),event={sender:pet.webContents};
 h.response(2);assert.equal(await h.handlers['pet:quit'](event),false);assert.equal(h.current(),pet);assert.equal(h.quit(),0);
 h.response('pending');const first=h.handlers['pet:quit'](event);assert.equal(await h.handlers['pet:quit'](event),false);
 h.resolveDialog(0);assert.equal(await first,true);assert.ok(h.launcher());
 h.handlers['start:launch-pet']({},'pachirisu');const current=h.current(),before=current.position;
 assert.equal(await h.handlers['pet:quit'](event),false);
 h.handlers['pet:set-position'](event,{x:500,y:500});h.handlers['pet:drag-start'](event,{mouseX:0,mouseY:0});
 assert.deepEqual(current.position,before);assert.equal(h.timers.size,1);
 h.response(1);assert.equal(await h.handlers['pet:quit']({sender:current.webContents}),true);assert.equal(h.quit(),1);
});
test('closing the actual home screen still quits normally',()=>{
 const h=setup();h.launcher().close();assert.equal(h.quit(),1);
});

test('delayed old launcher close cannot quit or erase a newly returned home',async()=>{
 const h=setup(),old=h.launcher();
 const oldClose=old.close.bind(old);old.close=()=>{};
 h.handlers['start:launch-pet']({sender:old.webContents},'growlithe');const pet=h.current();
 h.response(0);assert.equal(await h.handlers['pet:quit']({sender:pet.webContents}),true);
 const home=h.launcher();assert.notEqual(home,old);
 oldClose();
 assert.equal(vm.runInContext('startWin',h.context),home);
 assert.equal(h.quit(),0);
});

test('home waits for the pet to close and rejects new dialogs until then',async()=>{
 const h=setup();h.handlers['start:launch-pet']({},'pachirisu');const pet=h.current(),event={sender:pet.webContents};
 const close=pet.close.bind(pet);pet.close=()=>{};
 h.response(0);const pending=h.handlers['pet:quit'](event);await Promise.resolve();
 assert.equal(h.launcher(),undefined);assert.equal(await h.handlers['pet:quit'](event),false);
 h.handlers['pet:set-position'](event,{x:500,y:500});assert.deepEqual(pet.position,[100,100]);
 close();assert.equal(await pending,true);assert.ok(h.launcher());assert.equal(h.timers.size,0);
});

test('window-all-closed has no event argument and keeps the app alive for home recreation',()=>{
 const h=setup();assert.doesNotThrow(()=>h.appHandlers['window-all-closed']());assert.equal(h.quit(),0);
});
