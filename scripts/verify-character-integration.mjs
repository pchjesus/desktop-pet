// Linux headless integration only. Uses the installed Electron and Node 24 built-ins.
// --no-sandbox is restricted to trusted local repository content in the isolated cloud.
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
if (process.platform !== 'linux') throw new Error('This check targets Linux headless Electron; it does not verify Windows GUI behavior.');
const profile = await mkdtemp('/tmp/desktop-pet-profile-');
await mkdir(`${profile}/cache`, { recursive: true });
const child = spawn(`${root}/node_modules/electron/dist/electron`, [root, '--smoke-test',
  '--ozone-platform=headless', '--disable-gpu', '--no-sandbox',
  `--user-data-dir=${profile}`, '--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=0'], {
  env: { ...process.env, XDG_CACHE_HOME: `${profile}/cache`, XDG_CONFIG_HOME: profile },
  stdio: ['ignore', 'pipe', 'pipe']
});
let output = '';
child.stdout.on('data', data => { output += data; });
child.stderr.on('data', data => { output += data; });
child.on('error', error => { output += error.stack; });
async function until(fn) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode) throw new Error('Electron exited early');
    const value = await fn();
    if (value) return value;
    await delay(100);
  }
  throw new Error('Electron readiness timeout');
}
const connections = new Map();
let commandId = 0;
async function evaluate(target, expression, method = 'Runtime.evaluate') {
  let connection = connections.get(target.webSocketDebuggerUrl);
  if (!connection) {
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    const pending = new Map();
    await new Promise((resolve,reject) => { socket.addEventListener('open', resolve, {once:true}); socket.addEventListener('error',reject,{once:true}); });
    socket.addEventListener('message', event => {
      const response = JSON.parse(event.data);
      const task = pending.get(response.id);
      if (!task) return;
      pending.delete(response.id);
      clearTimeout(task.timer);
      if (response.error || response.result?.exceptionDetails) task.reject(new Error(JSON.stringify(response)));
      else task.resolve(response.result?.result?.value ?? response.result);
    });
    connection = {socket,pending};
    connections.set(target.webSocketDebuggerUrl, connection);
  }
  return new Promise((resolve,reject) => {
    const id = ++commandId;
    const timer = setTimeout(() => reject(new Error('CDP command timeout')),15000);
    connection.pending.set(id,{resolve,reject,timer});
    connection.socket.send(JSON.stringify({id,method,params:method === 'Runtime.evaluate' ? {expression,returnByValue:true,awaitPromise:true} : expression}));
  });
}

try {
 const endpoint=await until(()=>output.match(/DevTools listening on (ws:\/\/127\.0\.0\.1:\d+)/)?.[1]);
 const origin=endpoint.replace('ws:','http:');
 const pet=await until(async()=>{try{return(await(await fetch(`${origin}/json/list`)).json()).find(p=>p.type==='page'&&p.url.includes('/index.html'));}catch{return false;}});
 await evaluate(pet,{width:180,height:150,deviceScaleFactor:1,mobile:false},'Emulation.setDeviceMetricsOverride');
 const evidence=`${root}/docs/pachirisu-followme`;await mkdir(evidence,{recursive:true});
 const checks=[];
 for(const name of ['neukgu','royce','growlithe','spheal','pachirisu']) {
  await evaluate(pet,{url:`file://${root}/src/index.html?character=${name}`},'Page.navigate');
  await until(async()=>{try{return await evaluate(pet,`document.body.dataset.character==='${name}' && document.readyState==='complete'`);}catch{return false;}});
  const result=await evaluate(pet,`(async()=>{
   clearInterval(behaviorTimer);
   const visible=['neukgu','royce','growlithe','spheal','pachirisu'].filter(n=>getComputedStyle(document.getElementById(n)).display!=='none');
   if(visible.length!==1||visible[0]!=='${name}')throw new Error('visible '+visible);
   for(const s of Object.values(PET_STATES)){setState(s);character.render(performance.now());}
   if(character.isSpecialActionActive?.())character.finishSpecialAction?.();
   setState(PET_STATES.IDLE);
   if('${name}'==='growlithe'){const css=getComputedStyle(character.sprite);if(css.width!=='92px'||css.height!=='92px')throw new Error('Growlithe size');}
   for(const direction of [-1,1]){character.setFacing(direction);character.render(performance.now());if(character.facing!==direction)throw new Error('facing');}
   return {name:'${name}',states:6,visible};
  })()`);
  checks.push(result);
  if(!['pachirisu','growlithe'].includes(name))continue;
  const command=name==='pachirisu'?'FoLlOwMe':'FlAmEtHrOwEr';
  await evaluate(pet,`(()=>{
   for(const k of '${command}')window.dispatchEvent(new KeyboardEvent('keydown',{key:k}));
   window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));
   if(character.isSpecialActionActive())throw new Error('unarmed special');
   pet.dispatchEvent(new PointerEvent('pointerdown',{button:0,screenX:10,screenY:10,pointerId:1}));
   pet.dispatchEvent(new PointerEvent('pointerup',{button:0,screenX:10,screenY:10,pointerId:1}));
   for(const k of '${command}')window.dispatchEvent(new KeyboardEvent('keydown',{key:k}));
   window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));
   if(!character.isSpecialActionActive())throw new Error('armed special missing');
  })()`);
  for(const time of (name==='pachirisu'?[0,800,1500,2200,2900,3800]:[0,400,900,1700,2400,2800])) {
   await evaluate(pet,`(async()=>{
    document.body.style.background='#fff';
    if(character.activeSpecial){character.activeSpecial.start=performance.now()-${time};character.render();}
    else{character.special.startedAt=100;character.render(${time}+100);}
    await character.sprite.decode();
    const r=character.sprite.getBoundingClientRect();
    if('${name}'==='growlithe'&&(Math.abs(r.x+39-49)>.01||Math.abs(r.y+21-21)>.01))throw new Error('body size/anchor jump');
    if(r.left<-.01||r.top<-.01||r.right>180.01||r.bottom>150.01)throw new Error('effect window clipping '+JSON.stringify(r.toJSON()));
   })()`);
   const shot=await evaluate(pet,{format:'png'},'Page.captureScreenshot');
   await writeFile(`${root}/docs/${name==='growlithe'?'growlithe-motion':'pachirisu-followme'}/${name}-${time}.png`,Buffer.from(shot.data,'base64'));
  }
  await evaluate(pet,`(()=>{
   if(character.activeSpecial){character.activeSpecial.start=performance.now()-4400;character.render();}
   else character.render(3000+100);
   if(character.isSpecialActionActive())throw new Error('completion');
   if(character.followIcon&&!character.followIcon.hidden)throw new Error('icon residue');
   if(character.element.className!=='${name} idle')throw new Error('idle restore');
   for(const facing of [-1,1]) {
    character.setFacing(facing);
    character.startSpecialAction('${name==='pachirisu'?'followme':'flamethrower'}');
    character.render(performance.now());
    const r=character.sprite.getBoundingClientRect();
    if(r.left<-.01||r.top<-.01||r.right>180.01||r.bottom>150.01)throw new Error('facing effect clip');
    if(character.startSpecialAction('${name==='pachirisu'?'followme':'flamethrower'}'))throw new Error('duplicate');
    pet.dispatchEvent(new PointerEvent('pointerdown',{button:0,screenX:10,screenY:10,pointerId:1}));
    pet.dispatchEvent(new PointerEvent('pointerup',{button:0,screenX:10,screenY:10,pointerId:1}));
    if(!character.isSpecialActionActive())throw new Error('click cancelled special');
    pet.dispatchEvent(new PointerEvent('pointerdown',{button:0,screenX:10,screenY:10,pointerId:1}));
    window.dispatchEvent(new PointerEvent('pointermove',{screenX:25,screenY:10,pointerId:1}));
    if(character.isSpecialActionActive())throw new Error('real drag did not cancel');
    pet.dispatchEvent(new PointerEvent('pointerup',{button:0,screenX:25,screenY:10,pointerId:1}));
   }
  })()`);
 }
 await evaluate(pet,{url:`file://${root}/src/start.html`},'Page.navigate');
 await until(async()=>{try{return await evaluate(pet,"document.readyState==='complete' && !!document.querySelector('#start')");}catch{return false;}});
 await evaluate(pet,{width:760,height:520,deviceScaleFactor:1,mobile:false},'Emulation.setDeviceMetricsOverride');
 await evaluate(pet,`(async()=>{
  window.startAPI={start(id){window.startedCharacter=id},openManual(){window.manualRequested=true}};
  await Promise.all([...document.images].map(i=>i.decode()));
  for(const name of ['neukgu','royce','growlithe','spheal','pachirisu']) {
   document.querySelector('[data-character="'+name+'"]').click();document.getElementById('start').click();
   if(window.startedCharacter!==name||document.querySelectorAll('.choice.selected').length!==1)throw new Error('launcher selection '+name+' got '+window.startedCharacter+' selected '+document.querySelectorAll('.choice.selected').length+' api '+JSON.stringify(window.startAPI));
  }
  document.getElementById('manual').click();if(!window.manualRequested)throw new Error('manual request');
  if(document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth)throw new Error('launcher overflow');
 })()`);
 const launcher=await evaluate(pet,{format:'png'},'Page.captureScreenshot');
 await writeFile(`${evidence}/five-character-launcher.png`,Buffer.from(launcher.data,'base64'));
 await writeFile(`${evidence}/electron-check.json`,JSON.stringify({platform:process.platform,viewport:[180,150],checks,specialInputAndCleanup:true,launcherSelectionAndManualRequest:true,launcherNativeWindow:"NOT VERIFIED",windows:'NOT VERIFIED'},null,2)+'\n');
 console.log('PASS: five-character visibility/six states/facing, click-armed case-insensitive specials, full-frame bounds, duplicate/drag/idle cleanup');
} catch(error){console.error(error.stack);process.exitCode=1;}
finally {
 for(const {socket} of connections.values())socket.close();child.kill('SIGTERM');
 await Promise.race([new Promise(resolve=>child.once('exit',resolve)),delay(3000)]);
 if(child.exitCode===null&&!child.signalCode)child.kill('SIGKILL');
 await rm(profile,{recursive:true,force:true});
}
