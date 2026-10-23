// Linux Electron integration on a virtual X display (DISPLAY required).
// Uses the installed Electron and Node 24 built-ins; Windows is a separate check.
// --no-sandbox is restricted to trusted local repository content in the isolated cloud.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
if (process.platform !== 'linux') throw new Error('This check targets Linux headless Electron; it does not verify Windows GUI behavior.');
if (!process.env.DISPLAY) throw new Error('Provide a virtual X display through DISPLAY for native startup/Manual/Start checks.');
const profile = await mkdtemp('/tmp/desktop-pet-profile-');
await mkdir(`${profile}/cache`, { recursive: true });
const child = spawn(`${root}/node_modules/electron/dist/electron`, [root,
  '--disable-gpu', '--no-sandbox',
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
    if (child.exitCode !== null || child.signalCode) throw new Error(`Electron exited early: ${child.exitCode}/${child.signalCode}`);
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

const evidence = `${root}/docs/start-screen-polish`;
await mkdir(evidence, {recursive:true});
try {
  const endpoint = await until(() => output.match(/DevTools listening on (ws:\/\/127\.0\.0\.1:\d+)/)?.[1]);
  const origin = endpoint.replace('ws:', 'http:');
  const target = await until(async () => {
    try {return (await (await fetch(`${origin}/json/list`)).json()).find(p => p.type === 'page' && p.url.endsWith('/start.html'));}
    catch { return null; }
  });
  async function navigate(url, width, height) {
    await evaluate(target,{width,height,deviceScaleFactor:1,mobile:false},'Emulation.setDeviceMetricsOverride');
    await evaluate(target,{url},'Page.navigate');
    await until(async () => {
      try {return await evaluate(target,`location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && [...document.images].every(im=>im.complete && im.naturalWidth)`);}
      catch {return false;}
    });
    await evaluate(target,`document.querySelector('[data-character="spheal"]').click(); true`);
  }
  const assets = pathToFileURL(`${root}/src/assets/`).href;
  const before = execFileSync('git',['show','0d7af0faea3f92932e3bca85858a4149395aedaf:src/start.html'],{cwd:root,encoding:'utf8'}).replaceAll('src="assets/',`src="${assets}`);
  const beforeFile = `${profile}/before.html`;
  await writeFile(beforeFile,before);
  const results = {};
  for (const [name,url,width,height] of [
    ['before',pathToFileURL(beforeFile).href,500,461],
    ['after',pathToFileURL(`${root}/src/start.html`).href,680,560]
  ]) {
    await navigate(url,width,height);
    const data = await evaluate(target,`(() => {
      const r = node => {const b=node.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};};
      return {viewport:[innerWidth,innerHeight], scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
        card:r(document.querySelector('.card')), buttons:[...document.querySelectorAll('.buttons button')].map(r),
        choices:[...document.querySelectorAll('.choice')].map(r),images:[...document.images].map(im=>({src:im.getAttribute('src'),natural:[im.naturalWidth,im.naturalHeight],rect:r(im)}))};
    })()`);
    results[name]=data;
    if (name==='after') {
      if(data.scroll[0]>width || data.scroll[1]>height || data.card.top<0 || data.card.bottom>height) throw new Error('startup content overflows '+JSON.stringify(data));
      for(const b of data.buttons) if(b.top<0||b.bottom>height) throw new Error('hidden action');
      for(const im of data.images) if(im.rect.width!==80||im.rect.height!==80) throw new Error('fractional image scaling');
    }
    const shot=await evaluate(target,{format:'png'},'Page.captureScreenshot');
    await writeFile(`${evidence}/${name}.png`,Buffer.from(shot.data,'base64'));
  }
  // All selections, including the longest hint, must keep actions visible.
  for(const character of ['neukgu','growlithe','royce','spheal']) {
    const check=await evaluate(target,`(() => {document.querySelector('[data-character="${character}"]').click();const b=document.getElementById('start').getBoundingClientRect();return {selected:selectedCharacter,count:document.querySelectorAll('.choice.selected').length,overflow:document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth,buttonVisible:b.top>=0&&b.bottom<=innerHeight};})()`);
    if(check.selected!==character||check.count!==1||check.overflow||!check.buttonVisible) throw new Error('selection/layout '+JSON.stringify(check));
  }
  // Native preload + main handler: open Manual, then Start the selected Spheal.
  await evaluate(target,`document.getElementById('manual').click(); true`);
  const manual = await until(async()=> (await(await fetch(`${origin}/json/list`)).json()).find(p=>p.url.endsWith('/manual.html')));
  if(!manual) throw new Error('manual did not open');
  // Return the CDP result before Start closes this window and its session.
  await evaluate(target,`setTimeout(()=>document.getElementById('start').click(),50); true`);
  const pet = await until(async()=> (await(await fetch(`${origin}/json/list`)).json()).find(p=>p.url.includes('/index.html?character=spheal')));
  await until(async()=>{try{return await evaluate(pet,`document.readyState==='complete'&&document.body.dataset.character==='spheal'&&typeof window.petAPI==='object'`);}catch{return false;}});
  await writeFile(`${evidence}/layout-results.json`,JSON.stringify(results,null,2)+'\n');
  console.log('PASS: four selections, all actions visible without scroll, images decoded at 80px, native Manual and Start → Spheal IPC flow');
  console.log(JSON.stringify(results));
} catch(error) {
  await writeFile('/tmp/desktop-pet-start-electron.log',output);
  console.error(error.message,'(Electron log: /tmp/desktop-pet-start-electron.log)');
  process.exitCode=1;
} finally {
  for(const {socket} of connections.values()) socket.close();
  child.kill('SIGTERM');
  await Promise.race([new Promise(resolve=>child.once('exit',resolve)),delay(3000)]);
  if(child.exitCode===null&&!child.signalCode) child.kill('SIGKILL');
  await rm(profile,{recursive:true,force:true});
}
