const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const Growlithe = require('../src/characters/growlithe');
const STATES = { IDLE:'idle', WALK:'walk', SIT:'sit', SLEEP:'sleep', REACT:'react', DRAG:'drag' };
const root = path.join(__dirname,'../src/assets/characters/growlithe-motion');
function setup() {
  const sprite = { className:'growlithe-sprite', src:'', getAttribute(){return this.src;}, setAttribute(_,value){this.src=value;} };
  const element = {style:{},querySelector(){return sprite;}};
  return { pet:new Growlithe(element,STATES), element, sprite };
}
// Decode RGBA PNGs to inspect actual alpha topology and source pixel provenance.
function png(file) {
  const data=fs.readFileSync(file); let width,height,packed=[];
  for(let at=8;at<data.length;){const len=data.readUInt32BE(at); const type=data.toString('ascii',at+4,at+8); const chunk=data.subarray(at+8,at+8+len);
    if(type==='IHDR'){width=chunk.readUInt32BE(0);height=chunk.readUInt32BE(4);assert.equal(chunk[8],8);assert.equal(chunk[9],6);}
    if(type==='IDAT')packed.push(chunk);at+=len+12;
  }
  const raw=zlib.inflateSync(Buffer.concat(packed)), stride=width*4, pixels=Buffer.alloc(stride*height);
  function paeth(a,b,c){let p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
  for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];for(let x=0;x<stride;x++){
    const a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
    pixels[y*stride+x]=(raw[y*(stride+1)+x+1]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;
  }}
  return {width,height,pixels,alpha(x,y){return pixels[(y*width+x)*4+3];}};
}
test('one-shot flame holds priority and facing, ignores repeats, completes to idle',()=>{
  const {pet,element,sprite}=setup();pet.setFacing(-1);
  assert.equal(pet.startSpecialAction('flamethrower'),true);
  assert.equal(pet.startSpecialAction('flamethrower'),false);
  pet.setState(STATES.WALK);pet.setState(STATES.REACT);pet.setFacing(1);pet.setMovementDirection({x:9});
  assert.equal(element.className,'growlithe special-flamethrower');assert.equal(pet.facing,-1);
  pet.render(5000);pet.render(5600);assert.match(sprite.src,/flamethrower-06.png$/);
  pet.render(Infinity);assert.match(sprite.src,/flamethrower-06.png$/);
  pet.render(7899);assert.equal(pet.isSpecialActionActive(),true);
  pet.render(7900);assert.equal(pet.isSpecialActionActive(),false);assert.equal(element.className,'growlithe idle');assert.equal(sprite.className,'growlithe-sprite');assert.equal(sprite.src,pet.baseSrc);
  assert.equal(pet.startSpecialAction('flamethrower'),true);
});
test('drag cancels flame immediately and restores ordinary frame geometry',()=>{
  const {pet,sprite,element}=setup();pet.startSpecialAction('flamethrower');pet.render(0);pet.render(1000);pet.setState(STATES.DRAG);
  assert.equal(pet.isSpecialActionActive(),false);assert.equal(element.className,'growlithe drag');assert.equal(sprite.className,'growlithe-sprite');assert.match(sprite.src,/drag-0.png$/);assert.equal(pet.startSpecialAction('flamethrower'),false);
  pet.render(2000);assert.match(sprite.src,/drag-0.png$/);
});
test('breathing and waking use edited pixels while native walking and reaction stay native',()=>{
  const {pet,sprite}=setup();pet.setState(STATES.SLEEP);pet.render(0);const first=sprite.src;pet.render(1100);assert.notEqual(sprite.src,first);
  pet.setState(STATES.IDLE);assert.match(sprite.src,/wake.png$/);pet.render(1200);pet.render(1560);assert.equal(sprite.src,pet.baseSrc);
  pet.setState(STATES.WALK);pet.render(3000);assert.equal(sprite.src,pet.walkSrc);
  pet.setState(STATES.REACT);const reaction=sprite.src;pet.render(9000);assert.equal(sprite.src,reaction);assert.match(reaction,/growlithe-react.apng\?play=/);
});
test('every generated pixel frame is bounded; sleep preserves the original coat palette',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
  const source=png(path.join(root,'../growlithe-hgss.png')); const palette=new Set();
  for(let i=0;i<source.pixels.length;i+=4)if(source.pixels[i+3])palette.add(source.pixels.subarray(i,i+4).toString('hex'));
  for(const filename of fs.readdirSync(root).filter(file=>file.endsWith('.png'))){
    const im=png(path.join(root,filename));const size=filename.startsWith('flamethrower-')?[170,150]:[80,80];assert.deepEqual([im.width,im.height],size,filename);
    for(let x=0;x<im.width;x++){assert.equal(im.alpha(x,0),0,filename);assert.equal(im.alpha(x,im.height-1),0,filename);}
    for(let y=0;y<im.height;y++){assert.equal(im.alpha(0,y),0,filename);assert.equal(im.alpha(im.width-1,y),0,filename);}
    if(filename.startsWith('sleep-'))for(let i=0;i<im.pixels.length;i+=4)if(im.pixels[i+3])assert.ok(palette.has(im.pixels.subarray(i,i+4).toString('hex')),'sleep source palette');
  }
  assert.equal(manifest.specialFrames,29);assert.equal(manifest.specialDurationMs,2900);
});
test('flame has a continuous mouth attachment, bright core, flicker and taper',()=>{
  const hashes=[];
  for(let n=3;n<=25;n++){
    const im=png(path.join(root,`flamethrower-${String(n).padStart(2,'0')}.png`));
    let left=64;for(let x=1;x<=64;x++)if(im.alpha(x,70)){left=x;break;}
    for(let x=left;x<=64;x++)assert.equal(im.alpha(x,70),255,`connected frame ${n} x${x}`);
    const at=(70*170+64)*4;assert.ok(im.pixels[at]>240&&im.pixels[at+1]>220,'bright mouth core');
    if(n>=6&&n<10)hashes.push(im.pixels.toString('base64'));
    if(n===6)assert.ok(left<15,'extended stream');if(n===25)assert.ok(left>50,'tapered stream');
  }
  assert.equal(new Set(hashes).size,4,'four distinct flicker frames');
});

test('renderer calls without a timestamp initialize a finite animation clock',()=>{
  const {pet}=setup();pet.startSpecialAction('flamethrower');pet.render();
  assert.equal(Number.isFinite(pet.lastRenderTime),true);assert.equal(Number.isFinite(pet.special.startedAt),true);
  pet.render(pet.special.startedAt+2900);assert.equal(pet.isSpecialActionActive(),false);
});
test('sleep is a low horizontal pose with a source-dark closed eyelid',()=>{
  const im=png(path.join(root,'sleep-0.png'));let minY=80,maxY=0;
  for(let y=0;y<80;y++)for(let x=0;x<80;x++)if(im.alpha(x,y)){minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  assert.ok(minY>=33,'head and crest lowered');assert.ok(maxY-minY<=31,'curled side silhouette');
  for(const [x,y] of [[25,49],[28,50],[30,50]]){const at=(y*80+x)*4;assert.deepEqual([...im.pixels.subarray(at,at+4)],[20,20,20,255],'short closed eyelid');}
});

test('special preparation and recovery preserve the actual desktop body anchor',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
  assert.deepEqual(manifest.sourceOffset,[45,31]);assert.deepEqual(manifest.mouth,[64,70]);
  const source=png(path.join(root,'../growlithe-hgss.png'));
  for(const n of ['00','28']){const frame=png(path.join(root,`flamethrower-${n}.png`));
    for(let y=0;y<80;y++)for(let x=0;x<80;x++){
      const a=(y*80+x)*4,b=((y+31)*170+x+45)*4;
      assert.deepEqual(frame.pixels.subarray(b,b+4),source.pixels.subarray(a,a+4),`body anchor ${n} (${x},${y})`);
    }
  }
});
test('idle ear and tail twitches are brief local edits with planted paws',()=>{
  const base=png(path.join(root,'../growlithe-hgss.png'));
  for(const [name,box] of [['idle-ear',[37,26,42,34]],['idle-tail',[45,34,65,53]]]){
    const frame=png(path.join(root,`${name}.png`));let differences=0;
    for(let y=0;y<80;y++)for(let x=0;x<80;x++){const at=(y*80+x)*4;
      if(!frame.pixels.subarray(at,at+4).equals(base.pixels.subarray(at,at+4))){differences++;assert.ok(x>=box[0]&&x<box[2]&&y>=box[1]&&y<box[3],`${name} local edit`);}
    }assert.ok(differences>4,`${name} articulated pixels`);
  }
  const {pet,sprite}=setup();pet.render(0);pet.render(2100);assert.match(sprite.src,/idle-ear.png$/);
  pet.render(2240);assert.match(sprite.src,/idle-tail.png$/);pet.render(2380);assert.doesNotMatch(sprite.src,/idle-(ear|tail).png$/);
  pet.render(5600);assert.equal(sprite.src,pet.baseSrc);
});
test('wake first raises the head over a curled body, then unfolds onto planted feet',()=>{
  const names=['wake','wake-head','wake-body'];const tops=names.map(name=>{const im=png(path.join(root,`${name}.png`));for(let y=0;y<80;y++)for(let x=0;x<80;x++)if(im.alpha(x,y))return y;});
  assert.deepEqual(tops,[34,24,20]);
  const sleep=png(path.join(root,'sleep-0.png')),head=png(path.join(root,'wake-head.png')),body=png(path.join(root,'wake-body.png')),base=png(path.join(root,'../growlithe-hgss.png'));
  for(let y=0;y<80;y++)assert.deepEqual(head.pixels.subarray((y*80+44)*4,(y*80+80)*4),sleep.pixels.subarray((y*80+44)*4,(y*80+80)*4),'head rises before rump');
  assert.deepEqual(body.pixels.subarray(55*80*4),base.pixels.subarray(55*80*4),'unfolded paws grounded');
  const {pet,sprite}=setup();pet.setState(STATES.SLEEP);pet.setState(STATES.IDLE);pet.render(0);
  pet.render(120);assert.match(sprite.src,/wake-head.png$/);pet.render(240);assert.match(sprite.src,/wake-body.png$/);pet.render(360);assert.equal(sprite.src,pet.baseSrc);
});
test('sit folds the rear paw while preserving the face and planted front legs',()=>{
  const base=png(path.join(root,'../growlithe-hgss.png')),sit=png(path.join(root,'sit-0.png'));let foldedPixels=0;
  for(let y=0;y<80;y++)for(let x=0;x<80;x++){const at=(y*80+x)*4,a=sit.pixels.subarray(at,at+4),b=base.pixels.subarray(at,at+4);
    if(x<36||y<47)assert.deepEqual(a,b,'source face/frontlegs/back bridge');
    if(y>=60&&x>=38&&!a.equals(b))foldedPixels++;
  }assert.ok(foldedPixels>=15,'rear paw is visibly folded under lower haunch');
});
