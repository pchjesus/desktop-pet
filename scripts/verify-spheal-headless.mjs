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
  const endpoint = await until(() => output.match(/DevTools listening on (ws:\/\/127\.0\.0\.1:\d+)/)?.[1]);
  const origin = endpoint.replace('ws:', 'http:');
  const findPage = async suffix => {
    try {
      return (await (await fetch(`${origin}/json/list`)).json())
        .find(page => page.type === 'page' && new URL(page.url).pathname.endsWith(suffix));
    } catch { return null; }
  };
  const pet = await until(() => findPage('/index.html'));
  await until(() => evaluate(pet, "document.readyState === 'complete' && !!document.querySelector('#pet') && typeof window.petAPI === 'object'"));
  await evaluate(pet, {width:180,height:150,deviceScaleFactor:1,mobile:false}, 'Emulation.setDeviceMetricsOverride');
  for (const selected of ['spheal', 'neukgu', 'growlithe', 'royce']) {
    await evaluate(pet, `location.href = 'file://${root}/src/index.html?character=${selected}'; true`);
    await until(async () => {
      try { return await evaluate(pet, `document.body.dataset.character === '${selected}' && document.readyState === 'complete'`); }
      catch { return false; }
    });
    const visibility = await evaluate(pet, `['spheal', 'neukgu', 'growlithe', 'royce'].filter(id => getComputedStyle(document.getElementById(id)).display !== 'none')`);
    if (visibility.length !== 1 || visibility[0] !== selected) throw new Error(`Visibility: ${JSON.stringify(visibility)}`);
    if (selected !== 'spheal') continue;
    await evaluate(pet, `(async () => {
      nextDecision = performance.now() + 10000;
      setState(PET_STATES.IDLE);
      for (const facing of [1, -1]) {
        character.setFacing(facing);
        for (let sample = 0; sample < 3; sample++) {
          await new Promise(resolve => setTimeout(resolve,120));
          const matrix = new DOMMatrix(getComputedStyle(character.element).transform);
          if (Math.abs(matrix.a + facing) > .001 || Math.abs(matrix.d - 1) > .001)
            throw new Error('Idle animation changes facing or flattens the body: '+matrix.toString());
        }
      }
    })()`);
    console.log('PASS: idle breathing preserves facing and full body width in both directions');
    const loaded = await evaluate(pet, `(async () => {
      const paths = [character.baseSrc, ...character.rollFrames, ...character.reactFrames, ...character.waterGunFrames, ...character.iceBeamFrames];
      await Promise.all(paths.map(src => new Promise((resolve,reject) => {const image = new Image(); image.onload=resolve; image.onerror=reject; image.src=src;})));
      return paths.length;
    })()`);
    if (loaded !== 47) throw new Error('Frame decoding failed');
    if (process.argv.includes('--cleanup-review')) {
      const evidence = `${root}/docs/spheal-runtime-cleanup`;
      await mkdir(evidence, {recursive:true});
      const before = execFileSync('git', ['show', '0dfdb4d4ec38fefa22b1d82c1e7ab962fce57a37:src/assets/characters/spheal/spheal-base.png'], {cwd:root}).toString('base64');
      await evaluate(pet, 'clearInterval(behaviorTimer); true');
      for (const bg of ['white', 'dark']) {
        for (const version of ['before', 'after']) {
          const src = version === 'before' ? `data:image/png;base64,${before}` : 'assets/characters/spheal/spheal-base.png';
          const dimensions = await evaluate(pet, `(async () => {
            document.body.style.background = '${bg === 'white' ? '#fff' : '#252b38'}';
            character.sprite.src = ${JSON.stringify(src)};
            await character.sprite.decode();
            document.getAnimations().forEach(a=>a.pause());
            const rect=character.sprite.getBoundingClientRect();
            return [character.sprite.naturalWidth,character.sprite.naturalHeight,rect.width,rect.height];
          })()`);
          if (dimensions.some(n=>n!==80)) throw new Error('base not rendered at exact native 80px');
          const shot = await evaluate(pet, {format:'png'}, 'Page.captureScreenshot');
          await writeFile(`${evidence}/electron-${bg}-${version}.png`, Buffer.from(shot.data,'base64'));
        }
      }
      await evaluate(pet, 'startBehaviorLoop(); true');
      console.log('PASS: actual Electron base screenshots on white/dark at native 80x80 (no scale change)');
    }
    const roll = await evaluate(pet, `(async () => {
      nextDecision=performance.now()+60000;
      const seen=[];
      character.setState(PET_STATES.WALK);
      const start=performance.now();
      while(performance.now()-start<750) {
        character.render();
        const name=character.sprite.src.split('/').pop();
        if(seen.at(-1)!==name) seen.push(name);
        await new Promise(resolve=>setTimeout(resolve,20));
      }
      character.setState(PET_STATES.IDLE);
      const ending=performance.now();
      while(performance.now()-ending<450) {
        character.render();
        const name=character.sprite.src.split('/').pop();
        if(seen.at(-1)!==name) seen.push(name);
        await new Promise(resolve=>setTimeout(resolve,20));
      }
      return seen;
    })()`);
    for(let i=1;i<=12;i++) if(!roll.includes('roll-'+String(i).padStart(2,'0')+'.png')) throw new Error('ROLL frame missing '+i);
    if(roll.at(-1)!=='spheal-base.png') throw new Error('ROLL did not restore base');
    console.log('PASS: actual ROLL 12-frame entry/loop/exit playback and base recovery');
    const result = await evaluate(pet, `(() => {
      setState(PET_STATES.IDLE);
      const node = document.getElementById('pet');
      node.dispatchEvent(new PointerEvent('pointerdown', {button:0,pointerId:1,screenX:40,screenY:50}));
      node.dispatchEvent(new PointerEvent('pointerup', {button:0,pointerId:1,screenX:40,screenY:50}));
      if (character.special?.type !== 'clap') throw new Error('click did not start clap');
      for (const key of [...'icebeam', 'Enter']) window.dispatchEvent(new KeyboardEvent('keydown', {key}));
      if (character.special?.type !== 'icebeam') throw new Error('input did not start icebeam');
      character.special.startedAt = performance.now() - 1300;
      character.render();
      const freeze = character.sprite.src;
      const className = character.element.className;
      const bounds = [];
      for (const facing of [-1, 1]) {
        character.finishSpecialAction(); character.setFacing(facing); character.startSpecialAction('icebeam');
        const rect = character.sprite.getBoundingClientRect();
        bounds.push({facing,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom});
        if (rect.left < 0 || rect.top < 0 || rect.right > innerWidth || rect.bottom > innerHeight) throw new Error('clipped beam '+JSON.stringify({rect:rect.toJSON(),width:innerWidth,height:innerHeight}));
      }
      character.special.startedAt = performance.now() - 1300;
      character.render();
      return {freeze, className, bounds, canvas:[innerWidth,innerHeight], animation:getComputedStyle(character.sprite).animationName};
    })()`);
    if (!result.freeze.endsWith('icebeam-09.png') || result.animation !== 'none') throw new Error(JSON.stringify(result));
    await delay(100);
    const still = await evaluate(pet, `character.sprite.src.endsWith('icebeam-09.png') && character.element.className === 'spheal special-icebeam'`);
    if (!still) throw new Error('frozen art changed early');
    await evaluate(pet, `character.special.startedAt = performance.now() - 2950; character.render(); true`);
    const clean = await evaluate(pet, `!character.special && character.sprite.src.endsWith('spheal-base.png')`);
    if (!clean) throw new Error('ice remains after completion');
    console.log('PASS: 47 PNGs decoded, real icebeam input, still freeze, cleanup and both facing bounds in emulated 180x150 viewport', JSON.stringify(result));
    const playback = await evaluate(pet, `(async () => {
      const result = {};
      nextDecision = performance.now() + 60000;
      for (const type of ['clap', 'watergun', 'icebeam']) {
        character.finishSpecialAction(); setState(PET_STATES.IDLE);
        character.startSpecialAction(type);
        const seen = [];
        const start = performance.now();
        while (character.isSpecialActionActive() && performance.now() - start < 3500) {
          const name = character.sprite.src.split('/').pop();
          if (seen.at(-1)?.name !== name) seen.push({name,time:Math.round(performance.now()-start)});
          await new Promise(resolve => setTimeout(resolve,20));
        }
        if (character.isSpecialActionActive()) throw new Error('one-shot did not finish');
        result[type] = seen;
      }
      return result;
    })()`);
    for (const [type, frames] of Object.entries(playback)) {
      const expected = type === 'clap' ? 8 : type === 'watergun' ? 12 : 14;
      if (frames.length !== expected) throw new Error('missing live playback frames '+JSON.stringify(playback));
    }
    const frozenDuration = playback.icebeam[9].time - playback.icebeam[8].time;
    if (frozenDuration < 950 || frozenDuration > 1080) throw new Error(`Unexpected live freeze hold: ${frozenDuration}ms`);
    console.log('PASS: continuous real-time one-shot playback (8/12/14 frames)',JSON.stringify(playback));

  }
  console.log('PASS: all four characters remain independently visible');
} catch (error) {
  await writeFile('/tmp/desktop-pet-spheal-electron.log', output);
  console.error(error.message, '(details: /tmp/desktop-pet-spheal-electron.log)');
  process.exitCode = 1;
} finally {
  for (const {socket} of connections.values()) socket.close();
  child.kill('SIGTERM');
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)]);
  if (child.exitCode === null && !child.signalCode) child.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true });
}
