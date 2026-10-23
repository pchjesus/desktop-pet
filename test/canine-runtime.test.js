const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const NeukguCharacter = require('../src/characters/neukgu');
const RoyceCharacter = require('../src/characters/royce');

const STATES = Object.freeze({
  IDLE:'idle',WALK:'walk',SIT:'sit',SLEEP:'sleep',REACT:'react',DRAG:'drag'
});
const root = path.resolve(__dirname,'..');
const html = fs.readFileSync(path.join(root,'src/index.html'),'utf8');
const startHtml = fs.readFileSync(path.join(root,'src/start.html'),'utf8');

function makeElement(id) {
  const attrs = {};
  const model = {setAttribute:(key,val)=>attrs[key]=val};
  return {
    attrs,model,className:id+' idle',style:{},classList:{add(name){this.added=name}},
    querySelector:(selector)=>selector==='svg'?model:null,
    animate:()=>({cancel(){},onfinish:null})
  };
}

for (const [id,Character] of [['neukgu',NeukguCharacter],['royce',RoyceCharacter]]) {
  test(id+' keeps all six states mapped to its SVG without shared-engine changes',()=>{
    const el=makeElement(id),pet=new Character(el,STATES);
    for(const state of Object.values(STATES)) {
      pet.setState(state);
      assert.equal(el.attrs['data-motion'],state);
      assert.equal(el.className,id+' '+state);
    }
    assert.equal(el.classList.added,'react');
    pet.setFacing(-1);
    pet.turnAnimation.onfinish();
    assert.equal(el.style.transform,'scaleX(-1)');
    pet.setState(STATES.SIT);
    assert.equal(el.attrs['data-motion'],'sit');
  });

  test(id+' runtime markup includes its approved rounded body, poses and face',()=>{
    assert.match(html,new RegExp('class="neukgu-svg '+id+'-concept" data-motion="idle"'));
    for(const key of ['idle','walk','sit','sleep','react','drag']){
      assert.ok(html.includes(id+'-concept[data-motion="'+key+'"]'),
        id+' must have an explicit '+key+' pose');
    }
    assert.match(html,new RegExp('id="'+(id==='neukgu'?'n':'r')+'-head"'));
    assert.match(startHtml,new RegExp('assets/characters/'+id+'\\.svg'));
    const portrait=fs.readFileSync(path.join(root,'src/assets/characters',id+'.svg'),'utf8');
    assert.ok(portrait.includes('viewBox="0 0 96 88"'));
  });
}

test('Spheal and Growlithe keep the same renderer assets and behaviors',()=>{
  assert.match(html,/class="growlithe-sprite"/);
  assert.match(html,/id="spheal"/);
  assert.match(html,/characters\/spheal\.js/);
  assert.match(html,/characters\/growlithe\.js/);
});
