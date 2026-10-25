const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const geometry = require('../src/window-bounds');
const root = path.resolve(__dirname, '..');
const display = (id, x, y, width, height, scaleFactor = 1) => ({ id, bounds: {x,y,width,height},
  workArea: {x,y,width,height:height-40}, scaleFactor });

function harness(source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8')) {
  const screen = new EventEmitter();
  screen.displays = [display(1,0,0,1920,1080), display(2,-1920,-200,1920,1080,1.5)];
  screen.getAllDisplays = () => screen.displays;
  screen.getPrimaryDisplay = () => screen.displays[0];
  screen.getDisplayNearestPoint = point => screen.displays.find(d=>point.x>=d.bounds.x&&point.x<d.bounds.x+d.bounds.width) || screen.displays[0];
  screen.cursor = {x:0,y:0};
  screen.getCursorScreenPoint = () => screen.cursor;
  const handlers = {};
  const ipcMain = { on:(name,fn)=>handlers[name]=fn, handle:(name,fn)=>handlers[name]=fn };
  let ready;
  const app = { whenReady:()=>({then:fn=>{ready=fn;}}), on(){}, getPath:()=>'/tmp', quit(){} };
  const windows=[];
  class BrowserWindow extends EventEmitter {
    constructor(options) { super();this.options=options;this.position=[200,200];
      this.webContents=new EventEmitter();this.messages=[];
      this.webContents.send=(...args)=>this.messages.push(args);windows.push(this); }
    getPosition(){return this.position;}
    getSize(){return [this.options.width,this.options.height];}
    setPosition(x,y){assert.ok(Number.isInteger(x)&&Number.isInteger(y));this.position=[x,y];}
    setAlwaysOnTop(){} setIgnoreMouseEvents(){} loadFile(){}
  }
  const context = vm.createContext({ require:name=>name==='electron'?{app,screen,ipcMain,BrowserWindow,dialog:{}}
    :name==='./window-bounds'?geometry:name==='./input-diagnostics'?()=>({start(){},record(){},sample(){},rendererEvent(){},observeWindow(){}}):require(name),
    __dirname:path.join(root,'src'),process:{argv:[],env:{}},console,
    setInterval:()=>1,clearInterval(){},setTimeout,clearTimeout });
  vm.runInContext(source,context);
  ready();
  return {screen,handlers,context,create(character){
    vm.runInContext(`createPetWindow('${character}')`,context);
    return windows.at(-1);
  }};
}

function contained(window, character, area) {
  const shape=geometry.visualBounds(character);
  assert.ok(window.position[0]+shape.left>=area.x);
  assert.ok(window.position[0]+shape.right<=area.x+area.width);
  assert.ok(window.position[1]+shape.top>=area.y);
  assert.ok(window.position[1]+shape.bottom<=area.y+area.height);
}

test('recovers immediately from monitor removal and resolution shrink for every character',()=>{
  for(const character of Object.keys(geometry.BODY_ENVELOPES)) {
    const h=harness(),w=h.create(character);w.position=[-1600,100];
    h.screen.displays=[display(1,0,0,1280,720)];h.screen.emit('display-removed',{}, {id:2});
    contained(w,character,h.screen.displays[0].workArea);
    w.position=[1800,900];h.screen.emit('display-metrics-changed',{},h.screen.displays[0],['workArea','scaleFactor']);
    contained(w,character,h.screen.displays[0].workArea);
    assert.equal(w.messages.at(-1)[0],'pet:window-updated');
  }
});

test('all envelopes handle screen corners, negative origins, mixed-DPI metadata, gaps and tiny areas',()=>{
  const displays=[display(1,0,0,1920,1080,1),display(2,-1600,-900,1600,900,1.25),display(3,2300,200,2560,1440,2)];
  for(const character of Object.keys(geometry.BODY_ENVELOPES)) {
    const shape=geometry.visualBounds(character);
    for(const d of displays) {
      const limits=geometry.movementBounds(d.workArea,shape);
      for(const x of [limits.minX,limits.maxX]) for(const y of [limits.minY,limits.maxY]) {
        const next=geometry.constrainPosition({x,y},shape,[d]);
        assert.equal(next.x,x);assert.equal(next.y,y);
        contained({position:[x,y]},character,d.workArea);
      }
      const same=geometry.constrainPosition({x:999999,y:-999999},shape,[{...d,scaleFactor:9}]);
      const normal=geometry.constrainPosition({x:999999,y:-999999},shape,[d]);
      assert.deepEqual([same.x,same.y],[normal.x,normal.y]);
    }
    const tiny=geometry.movementBounds({x:-20,y:0,width:10,height:10},shape);
    assert.equal(tiny.minX,tiny.maxX);assert.equal(tiny.minY,tiny.maxY);
    const gap=geometry.constrainPosition({x:2100,y:0},shape,displays);
    contained({position:[gap.x,gap.y]},character,gap.display.workArea);
  }
});

test('Main clamps initial placement and motion, acknowledges corrections, and drag can cross monitors',()=>{
  for(const character of Object.keys(geometry.BODY_ENVELOPES)) {
    const h=harness(),w=h.create(character);
    w.position=[-50000,9000];w.webContents.emit('did-finish-load');
    contained(w,character,h.handlers['pet:get-window']().area);
    h.handlers['pet:set-position']({}, {x:NaN,y:Infinity});
    assert.ok(w.position.every(Number.isFinite));
    h.handlers['pet:set-position']({}, {x:10000,y:10000});
    contained(w,character,h.screen.displays[0].workArea);
    assert.equal(w.messages.at(-1)[1].x,w.position[0]);
    w.position=[200,200];h.handlers['pet:drag-start']({}, {mouseX:220,mouseY:220});
    h.handlers['pet:drag-move']({}, {mouseX:-1300,mouseY:200});
    assert.ok(w.position[0]<0);contained(w,character,h.screen.displays[1].workArea);
    h.screen.cursor={x:20,y:20};h.screen.displays=[display(1,0,0,1024,768)];
    h.screen.emit('display-removed',{}, {id:2});
    const corrected=[...w.position];
    h.handlers['pet:drag-move']({}, {mouseX:20,mouseY:20});
    assert.deepEqual(w.position,corrected,'topology change must rebase the active drag anchor');
    h.handlers['pet:drag-end']();contained(w,character,h.screen.displays[0].workArea);
  }
});
