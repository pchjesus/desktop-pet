const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const PachirisuCharacter = require('../src/characters/pachirisu');
const STATES = {IDLE:'idle', WALK:'walk', SIT:'sit', SLEEP:'sleep', REACT:'react', DRAG:'drag'};
const root=path.resolve(__dirname,'..');
function node(){
  const sprite={src:'', getAttribute(n){return this.src}, setAttribute(n,v){this.src=v}};
  return {sprite,className:'',style:{},querySelector:(q)=>q==='.pachirisu-sprite'?sprite:null};
}
test('registered in launcher, IPC and per-character window bounds, without changing others',()=>{
  const main=fs.readFileSync(path.join(root,'src/main.js'),'utf8');
  const renderer=fs.readFileSync(path.join(root,'src/renderer.js'),'utf8');
  const start=fs.readFileSync(path.join(root,'src/start.html'),'utf8');
  const engine=fs.readFileSync(path.join(root,'src/pet-engine.js'),'utf8');
  const {BODY_ENVELOPES}=require('../src/window-bounds');
  assert.match(main,/'pachirisu'\]\.includes\(characterId\)/);
  assert.match(renderer,/new globalThis\.PachirisuCharacter/);
  assert.match(start,/data-character="pachirisu"/);
  assert.match(start,/FollowMe/);
  assert.ok(BODY_ENVELOPES.pachirisu);
  assert.equal(Object.keys(BODY_ENVELOPES).length,5);
  assert.doesNotMatch(engine,/PachirisuCharacter/);
});
test('authentic sprite is a local asset, with GIF animation and Berry references',()=>{
  const folder=path.join(root,'src/assets/characters/pachirisu');
  const f=fs.readFileSync(path.join(folder,'pachirisu-bw.gif'));
  assert.equal(f.toString('ascii',0,6),'GIF89a');
  assert.ok(fs.statSync(path.join(folder,'sitrus-berry.webp')).size>0);
  const html=fs.readFileSync(path.join(root,'src/index.html'),'utf8');
  for (const part of ['pachirisu-meteors','pachirisu-berry','pachirisu-spark','z-index:1','z-index:3'])
    assert.ok(html.includes(part),part);
});
test('all shared states map to authentic sprite or static poses',()=>{
  const el=node(),pet=new PachirisuCharacter(el,STATES);
  for (const state of Object.values(STATES)) {
    pet.setState(state);
    assert.equal(el.className,'pachirisu '+state);
  }
  pet.setFacing(-1); assert.equal(el.style.transform,'scaleX(1)');
  pet.setMovementDirection({x:3}); assert.equal(pet.facing,1);
  pet.setMovementDirection({x:-2}); assert.equal(pet.facing,-1);
  assert.equal(typeof pet.getMovementSpeed(),'number');
});
test('FollowMe is finite, duplicates are rejected, and native dragging cancels safely',t=>{
  let now=100;
  t.mock.method(performance,'now',()=>now);
  const el=node(),pet=new PachirisuCharacter(el,STATES);
  assert.equal(pet.startSpecialAction('invalid'),false);
  assert.equal(pet.startSpecialAction('followme'),true);
  assert.equal(pet.startSpecialAction('followme'),false);
  assert.equal(pet.isSpecialActionActive(),true);
  assert.equal(el.className,'pachirisu special-followme');
  pet.setState(STATES.WALK);
  assert.equal(el.className,'pachirisu special-followme');
  now=4499;pet.render();assert.equal(pet.isSpecialActionActive(),true);
  now=4500;pet.render();assert.equal(pet.isSpecialActionActive(),false);
  assert.equal(el.className,'pachirisu idle');
  pet.startSpecialAction('followme');pet.setState(STATES.DRAG);
  assert.equal(pet.isSpecialActionActive(),false);
  assert.equal(el.className,'pachirisu drag');
});
test('FollowMe is click-armed and case-insensitive with backspace support',()=>{
  const src=fs.readFileSync(path.join(root,'src/renderer.js'),'utf8');
  assert.match(src,/return 'followme'/);
  assert.match(src,/character\.startSpecialAction\('followme'\)/);
  assert.match(src,/easterEggBuffer = easterEggBuffer\.slice\(0, -1\)/);
  assert.match(src,/event\.key\.toLowerCase\(\)/);
  assert.match(src,/easterEggEligibleUntil = Date\.now\(\) \+ 5000/);
});

test('renderer integration: FollowMe requires prior click and restores native input flow', async()=>{
  const vm=require('node:vm');
  let now=1000;
  const listeners={};
  const body={dataset:{}};
  const petElement={style:{},classList:{add(){},remove(){}},addEventListener:(name,cb)=>listeners[name]=cb};
  const image={src:'',getAttribute(n){return this.src},setAttribute(n,v){this.src=v}};
  const model={style:{},className:'pachirisu idle',querySelector:()=>image};
  const controls={pet:petElement,pachirisu:model,bubble:{style:{}}};
  const ctx=vm.createContext({
    performance:{now:()=>now},Date:{now:()=>now},console,
    URLSearchParams,setInterval:()=>1,clearInterval:()=>{},setTimeout:()=>1,clearTimeout:()=>{},
    location:{search:'?character=pachirisu'},
    document:{body,getElementById:id=>controls[id]},
    window:{PetEngine:require('../src/pet-engine'),petAPI:{getWindow:async()=>({x:100,y:100,
      movementBounds:{minX:0,maxX:150,minY:0,maxY:150}}),onWindowChanged:()=>{},setIgnoreMouse:()=>{},
      dragStart:()=>{},dragMove:()=>{},dragEnd:()=>{},setPosition:()=>{},quit:async()=>false},
      addEventListener:(name,cb)=>listeners[name]=cb}
  });
  vm.runInContext(fs.readFileSync(path.join(root,'src/characters/pachirisu.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'src/renderer.js'),'utf8'),ctx);
  await new Promise(resolve=>setImmediate(resolve));
  function type(s){for(const char of s)listeners.keydown({key:char});listeners.keydown({key:'Enter'});}
  type('FollowMe');assert.equal(vm.runInContext('character.activeSpecial',ctx),null);
  listeners.pointerdown({button:0,screenX:5,screenY:5});listeners.pointerup({});
  type('fOlLoWmE');assert.equal(vm.runInContext('character.activeSpecial.type',ctx),'followme');
  type('FollowMe');assert.equal(vm.runInContext('character.activeSpecial.type',ctx),'followme');
  now=5400;vm.runInContext('character.render()',ctx);
  assert.equal(vm.runInContext('character.activeSpecial',ctx),null);
  assert.equal(model.className,'pachirisu idle');
});

test('FollowMe keeps its 4400ms timeline, bite silhouettes, icon overlap and complete cleanup', t => {
  let now=0;t.mock.method(performance,'now',()=>now);
  const el=node(), icon={hidden:true};
  const query=el.querySelector;el.querySelector=q=>q==='.pachirisu-follow-icon'?icon:query(q);
  const pet=new PachirisuCharacter(el,STATES);
  pet.startSpecialAction('followme');assert.equal(icon.hidden,false);
  const originalFacing=pet.facing;pet.setFacing(-originalFacing);assert.equal(pet.facing,originalFacing);
  for(const [time,index,visible] of [[400,'04',true],[800,'08',true],[1500,'15',true],[2200,'22',true],[2900,'29',true],[3500,'35',false],[4300,'43',false]]) {
    now=time;pet.render();assert.match(el.sprite.src,new RegExp(`followme-${index}\\.png$`));assert.equal(!icon.hidden,visible);
    pet.setState(STATES.IDLE);assert.equal(pet.isSpecialActionActive(),true);
  }
  now=4400;pet.render();assert.equal(pet.state,STATES.IDLE);assert.equal(icon.hidden,true);
  assert.match(el.sprite.src,/pachirisu-bw.gif$/);
  pet.startSpecialAction('followme');pet.setState(STATES.DRAG);
  assert.equal(icon.hidden,true);assert.equal(pet.isSpecialActionActive(),false);
  assert.equal(el.className,'pachirisu drag');
  assert.equal(pet.startSpecialAction('followme'),false,'drag owns input priority');
  for(let i=0;i<44;i++)assert.ok(fs.existsSync(path.join(root,'src/assets/characters/pachirisu/followme',`followme-${String(i).padStart(2,'0')}.png`)));
});
