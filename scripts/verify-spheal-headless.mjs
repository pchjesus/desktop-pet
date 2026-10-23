// Linux headless integration only. Uses the installed Electron and Node 24 built-ins.
// --no-sandbox is restricted to trusted local repository content in the isolated cloud.
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
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
      else task.resolve(response.result?.result?.value);
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
    const loaded = await evaluate(pet, `(async () => {
      const paths = [...character.reactFrames, ...character.waterGunFrames, ...character.iceBeamFrames];
      await Promise.all(paths.map(src => new Promise((resolve,reject) => {const image = new Image(); image.onload=resolve; image.onerror=reject; image.src=src;})));
      return paths.length;
    })()`);
    if (loaded !== 34) throw new Error('Frame decoding failed');
    const result = await evaluate(pet, `(() => {
      setState(PET_STATES.IDLE);
      armEasterEgg();
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
    console.log('PASS: 34 PNGs decoded, real icebeam input, still freeze, cleanup and both facing bounds in emulated 180x150 viewport', JSON.stringify(result));
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
