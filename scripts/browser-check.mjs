// Project integration tests: real mouse, wheel and two-finger touch through CDP.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromePort} from '../vendor/anatomy/verify/chrome-port.mjs';
import {internals} from '../internals.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const phone=process.argv.includes('--phone'),reduced=process.argv.includes('--reduced');
const short=process.argv.includes('--short'),fallback=process.argv.includes('--fallback'),layoutOnly=process.argv.includes('--layout-only');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
if(typeof WebSocket==='undefined'){
  const child=spawn(process.execPath,['--experimental-websocket',...process.argv.slice(1)],{stdio:'inherit',windowsHide:true});child.on('exit',code=>process.exit(code??1));
}else await main();
async function main(){
  const binary=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>p&&existsSync(p));
  assert(binary,'Set CHROME_PATH to a Chromium browser');
  const profile=mkdtempSync(join(tmpdir(),'declaw-atlas-test-'));
  const chrome=spawn(binary,['--headless=new',`--window-size=${phone?390:1440},${short?450:phone?900:1100}`,...(process.platform==='win32'?['--do-not-de-elevate']:process.platform==='linux'?['--no-sandbox']:[]),'--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--allow-file-access-from-files','about:blank'],{windowsHide:true});
  let socket;const checks=[],errors=[];mkdirSync(resolve(root,'.verification'),{recursive:true});
  const suffix=short?'phone-short-fallback':phone?'phone-reduced':'desktop';
  try{
    const port=await chromePort(chrome,profile),page=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
    socket=new WebSocket(page.webSocketDebuggerUrl);let serial=0;const pending=new Map();
    socket.onmessage=ev=>{const m=JSON.parse(ev.data);if(m.id){const item=pending.get(m.id);if(item){pending.delete(m.id);clearTimeout(item.timer);m.error?item.reject(new Error(m.error.message)):item.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
    await new Promise(r=>socket.onopen=r);
    const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject,timer:setTimeout(()=>reject(new Error('CDP timeout: '+method)),15000)});socket.send(JSON.stringify({id,method,params}));});
    const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
    const check=async(expression,label)=>{const pass=!!await evaluate(expression);checks.push({label,pass});assert(pass,label);};
    const until=async expression=>{const start=Date.now();while(!await evaluate(expression)){assert(Date.now()-start<3000,'Timed out: '+expression);await wait(35);}};
    const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    const box=selector=>evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height}})()`);
    const vb=()=>evaluate(`document.querySelector('#atlas').getAttribute('viewBox').split(' ').map(Number)`);
    const settle=()=>until(`document.querySelector('#overview').hasAttribute('hidden')&&getComputedStyle(document.querySelector('#interior')).opacity==='1'`);
    const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(resolve(root,`.verification/${name}-${suffix}.png`),Buffer.from(r.data,'base64'));};
    const mouse=async(type,x,y)=>send('Input.dispatchMouseEvent',{type,x,y,...(type==='mouseWheel'?{deltaY:-120,deltaX:0}:type==='mouseMoved'?{buttons:1,button:'left'}:{button:'left',buttons:type==='mousePressed'?1:0,clickCount:1})});
    const key=async key=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key});await send('Input.dispatchKeyEvent',{type:'keyUp',key});};
    await send('Runtime.enable');await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride',{width:phone?390:1440,height:short?450:phone?900:1100,deviceScaleFactor:1,mobile:phone});
    if(fallback)await send('Page.addScriptToEvaluateOnNewDocument',{source:`Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Simulated embedded-browser restriction'))`});
    if(reduced)await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await send('Page.navigate',{url:pathToFileURL(resolve(root,'index.html')).href});await until(`document.querySelector('#steps button')`);await wait(100);
    await check(`document.querySelectorAll('[data-district]').length===12&&document.querySelectorAll('.district-directory button').length===12`,'Twelve map districts and keyboard alternatives');
    await check(`new Set([...document.querySelectorAll('[data-district] .landmark')].map(n=>n.innerHTML)).size===12`,'Every district has its own functional landmark');
    await check(`document.querySelectorAll('.overview-wire').length===20`,'Twenty typed inter-component relations');
    await check(`document.querySelector('#overview').hasAttribute('hidden')===false&&!document.querySelector('#interior').getClientRects().length`,'Overview starts with internals hidden');
    await check(`document.querySelector('#viewport').contains(document.querySelector('.flow-dock'))`,'Request playback is inside the map workspace');
    await check(`(()=>{const a=document.querySelector('#canvas-surface').getBoundingClientRect(),b=document.querySelector('.flow-dock').getBoundingClientRect();return a.bottom<=b.top+1})()`,'Playback footer never covers map content');
    await check(`(()=>{return [...document.querySelectorAll('[data-district]')].every(g=>{const land=g.querySelector('.district-land').getBBox();return [...g.querySelectorAll('text:not(.journey-badge text)')].every(t=>{const b=t.getBBox();return b.x>=0&&b.x+b.width<=land.width+1&&b.y>=0&&b.y+b.height<=land.height+1;});});})()`,'All district labels stay inside their variable-sized parcels');
    await shot('overview');
    const normalSurface=await box('#canvas-surface'),fullButton=await box('#fullscreen');
    await mouse('mousePressed',fullButton.x+fullButton.w/2,fullButton.y+fullButton.h/2);await mouse('mouseReleased',fullButton.x+fullButton.w/2,fullButton.y+fullButton.h/2);
    await until(`document.querySelector('#atlas-app').classList.contains('is-expanded')`);await wait(120);
    await check(`document.querySelector('#fullscreen').getAttribute('aria-pressed')==='true'&&document.querySelector('#inspector').hidden`,'Fullscreen maximizes the map and collapses the inspector');
    await check(`(()=>{const r=document.querySelector('#atlas-app').getBoundingClientRect();return Math.abs(r.width-innerWidth)<2&&Math.abs(r.height-innerHeight)<2})()`,'Fullscreen map occupies the entire available screen');
    await check(fallback?`!document.fullscreenElement&&document.querySelector('#atlas-app').classList.contains('is-expanded')`:`!document.fullscreenEnabled||document.fullscreenElement===document.querySelector('#atlas-app')`,fallback?'Full-window mode survives a rejected native fullscreen request':'A real pointer click enters native fullscreen when available');
    const fullSurface=await box('#canvas-surface'),windowHeight=await evaluate('innerHeight'),visibleNormal=Math.max(0,Math.min(windowHeight,normalSurface.y+normalSurface.h)-normalSurface.y);assert(fullSurface.w>=normalSurface.w&&fullSurface.h>=visibleNormal);checks.push({label:'Fullscreen gives the visible canvas more room',pass:true});
    await check(`(()=>{const r=document.querySelector('.flow-dock').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1})()`,'Fullscreen keeps all playback controls on screen');
    await click('#next');await wait(reduced?30:850);
    await check(`document.querySelector('[data-district="agent"]').classList.contains('active-step')&&document.querySelector('[data-badge="cli"]').hasAttribute('hidden')===false&&document.querySelector('[data-badge="agent"] text').textContent==='02'`,'The journey numbers its actual districts and highlights the active step');
    await check("document.querySelector('#details h2').textContent==='Brain'",'Inspector follows the active processing district');
    await shot('fullscreen-trace');await click('#stop-trace');
    await check(`document.querySelectorAll('[data-badge]:not([hidden])').length===0`,'Leaving trace mode clears all map annotations');
    if(layoutOnly){
      await click('#details-toggle');await check(`!document.querySelector('#inspector').hidden&&document.querySelector('#inspector-backdrop').hidden===false`,'Short-screen fullscreen can open the information drawer');
      await click('#close-inspector');await check(`document.querySelector('#inspector').hidden`,'Information drawer can be dismissed');
      await click('#flow-collapse');await check(`(()=>{const r=document.querySelector('#canvas-surface').getBoundingClientRect(),d=document.querySelector('.flow-dock').getBoundingClientRect();return r.height>100&&d.bottom<=innerHeight+1})()`,'Expanded playback leaves a usable map on short screens');await click('#flow-collapse');
      await evaluate(`document.querySelector('#atlas').focus()`);await key('f');
    }else await click('#fullscreen');
    await until(`!document.querySelector('#atlas-app').classList.contains('is-expanded')&&!document.fullscreenElement`);await wait(120);
    await check(`document.querySelector('#fullscreen').getAttribute('aria-pressed')==='false'`,'Exit restores the normal workspace');
    if(layoutOnly){assert.deepEqual(errors,[]);console.log(JSON.stringify({viewport:suffix,passed:checks.length,errors:errors.length}));return;}
    await click('#reset-flow');await click('#stop-trace');await wait(reduced?50:850);
    const p0=await vb(),r=await box('#atlas'),cx=r.x+r.w*.52,cy=r.y+r.h*.48;
    await mouse('mousePressed',cx,cy);await mouse('mouseMoved',cx+40,cy+30);await mouse('mouseReleased',cx+40,cy+30);
    const p1=await vb();assert(p1[0]!==p0[0]&&p1[1]!==p0[1],'Pointer drag pans the overview');checks.push({label:'Pointer drag pans without opening a district',pass:true});
    await check(`!document.querySelector('#overview').hasAttribute('hidden')`,'Dragging across a district does not activate it');
    const worldBefore={x:p1[0]+.52*p1[2],y:p1[1]+.48*p1[3]};await send('Page.bringToFront');await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:cx,y:cy,button:'none',buttons:0});await until(`!document.querySelector('#atlas').hasPointerCapture(1)`);await wait(60);await send('Input.synthesizeScrollGesture',{x:cx,y:cy,yDistance:120,gestureSourceType:'mouse',speed:1200});await until(`Number(document.querySelector('#atlas').getAttribute('viewBox').split(' ')[2])<${p1[2]}`);const p2=await vb();
    assert(Math.abs(p2[0]+.52*p2[2]-worldBefore.x)<2&&Math.abs(p2[1]+.48*p2[3]-worldBefore.y)<2,JSON.stringify({p1,p2,worldBefore}));checks.push({label:'Real wheel zoom preserves the cursor anchor',pass:true});
    await click('#fit-view');await wait(reduced?30:850);const beforeOpen=await vb();await click('.district-directory [data-open="documents"]');
    if(!reduced){await wait(160);await check(`Number(document.querySelector('#atlas').getAttribute('viewBox').split(' ')[2])<${beforeOpen[2]}&&Number(document.querySelector('#atlas').getAttribute('viewBox').split(' ')[2])>350`,'Camera eases between overview and detail');}
    await settle();await check(`document.querySelectorAll('#interior [data-node]').length===8&&document.querySelectorAll('#interior [data-wire]').length===7`,'Documents opens its eight source nodes and seven relations');
    await check(`document.querySelector('.input-band')&&document.querySelector('.output-band')&&document.querySelectorAll('#interior .in-port').length===8&&document.querySelectorAll('#interior .out-port').length===8`,'District boundary and every symbol expose input/output');
    await shot('documents');
    const beforeDetail=await vb(),dr=await box('#atlas');await mouse('mousePressed',dr.x+dr.w*.45,dr.y+dr.h*.48);await mouse('mouseMoved',dr.x+dr.w*.45+35,dr.y+dr.h*.48-25);await mouse('mouseReleased',dr.x+dr.w*.45+35,dr.y+dr.h*.48-25);
    assert((await vb())[0]!==beforeDetail[0]);checks.push({label:'Pointer drag also pans the internal map',pass:true});
    await click('#fit-view');await wait(reduced?30:850);
    await click('#details [data-inspect-node="search"]');await wait(reduced?30:850);
    await check(`document.querySelector('#details h2').textContent==='search_documents'&&document.querySelector('#details .source-link').href.endsWith('search.py#L98')`,'Symbol inspection shows exact function, contract and source line');
    assert((await vb())[2]<beforeDetail[2]);checks.push({label:'Selecting a symbol zooms to a readable card',pass:true});
    await click('#details [data-relation="search-filter"]');
    await check(`document.querySelectorAll('#interior .symbol.endpoint').length===2&&document.querySelector('#details h2').textContent.includes('chunk_sanitizer.filter')`,'Selecting a wire exposes its relationship and exactly two endpoints');
    await check(`document.querySelectorAll('.wire-pulse').length===${reduced?'0':'1'}`,'Signal animation respects reduced motion');
    await click('#clear-selection');await click('#fit-view');await wait(reduced?30:850);
    // A true two-contact gesture exercises pointer capture, distance and moving center.
    await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
    const tr=await box('#atlas'),tx=tr.x+tr.w*.5,ty=tr.y+tr.h*.5,pinchBefore=await vb();
    const touch=(type,d)=>send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:tx-d,y:ty,id:1},{x:tx+d,y:ty,id:2}]});
    await touch('touchStart',40);await touch('touchMove',75);await touch('touchEnd');await wait(100);
    assert((await vb())[2]<pinchBefore[2]*.8);checks.push({label:'Two-finger pinch zooms the internal map',pass:true});
    await send('Emulation.setTouchEmulationEnabled',{enabled:false});
    // Rapid retargeting must not leave the old overview or old graph visible.
    await click('#home-view');await wait(100);await click('.district-directory [data-open="plugins"]');await wait(100);await click('.district-directory [data-open="memory"]');await settle();
    await check(`document.querySelector('#details h2').textContent==='Memory'&&document.querySelector('#interior [data-node="key"]')&&document.querySelectorAll('#interior .interior-ground').length===1`,'Interrupted transitions preserve only the requested district');
    for(const [id,g]of Object.entries(internals)){
      await click(`.district-directory [data-open="${id}"]`);await settle();
      await check(`document.querySelectorAll('#interior [data-node]').length===${g.nodes.length}&&document.querySelectorAll('#interior [data-wire]').length===${g.edges.length}`,`Correct distinct graph: ${id}`);
      await click(`#details [data-inspect-node="${g.nodes.at(-1).id}"]`);
      await check(`document.querySelector('#details .source-link').href.endsWith('#L${g.nodes.at(-1).line}')`,`Source contract resolves: ${id}`);
    }
    await key('Escape');await key('Escape');await until(`!document.querySelector('#overview').hasAttribute('hidden')&&document.querySelector('#interior').hasAttribute('hidden')`);
    await evaluate(`document.querySelector('#overview [data-wire="agent-tools"]').focus()`);await key('Enter');
    await check(`document.querySelectorAll('#overview .district.neighbor').length===2&&document.querySelector('#details h2').textContent==='Tool calls → observations'`,'Keyboard selection reveals an overview connection and its two districts');
    await click('#all-wires');await check(`document.querySelector('#atlas').classList.contains('show-all')`,'Overview wiring can be made fully visible');await click('#all-wires');
    await click('.district-directory [data-open="agent"]');await settle();await click('.district-directory [data-open="memory"]');await settle();
    await evaluate(`history.back()`);await until(`document.querySelector('#map-title').textContent.startsWith('Brain')`);await check(`document.querySelector('#interior [data-node="think"]')`,'Browser Back restores the previous district');
    await evaluate(`history.forward()`);await until(`document.querySelector('#map-title').textContent.startsWith('Memory')`);await check(`document.querySelector('#interior [data-node="key"]')`,'Browser Forward restores the next district');
    await click('#home-view');await wait(reduced?30:850);
    for(const [id,count]of Object.entries({read:7,write:7,index:8,search:8})){
      await evaluate(`document.querySelector('#flow').value='${id}';document.querySelector('#flow').dispatchEvent(new Event('change'))`);
      await check(`document.querySelectorAll('[data-step]').length===${count}`,`Complete request journey: ${id}`);
    }
    await evaluate(`document.querySelector('#flow').value='write';document.querySelector('#flow').dispatchEvent(new Event('change'));document.querySelector('#outcome').value='deny';document.querySelector('#outcome').dispatchEvent(new Event('change'))`);
    await check(`![...document.querySelectorAll('[data-step]')].some(n=>n.getAttribute('aria-label').includes('Thực hiện thay đổi'))`,'Denied write never reaches execution');
    for(const flow of ['read','search']){
      await evaluate(`document.querySelector('#flow').value='${flow}';document.querySelector('#flow').dispatchEvent(new Event('change'));document.querySelector('#outcome').value='unsafe';document.querySelector('#outcome').dispatchEvent(new Event('change'))`);
      await check(`[...document.querySelectorAll('[data-step]')].some(n=>n.getAttribute('aria-label').includes('cách ly'))`,`Unsafe ${flow} quarantines content`);
    }
    await click('#play');const atPlay=await evaluate(`document.querySelector('#step-counter').textContent`);await wait(2550);
    assert.equal((await evaluate(`document.querySelector('#step-counter').textContent`))===atPlay,reduced);checks.push({label:reduced?'Reduced motion advances manually':'Playback progresses automatically',pass:true});
    await evaluate(`document.querySelector('#play').getAttribute('aria-label').startsWith('Tạm')&&document.querySelector('#play').click();location.hash='component=memory&view=open&node=encrypt&flow=read&outcome=normal&step=2'`);await wait(100);
    await check(`document.querySelector('#details h2').textContent==='encrypt_text'&&document.querySelector('#step-counter').textContent.startsWith('02')`,'Legacy source deep links restore the same symbol and flow');
    await click('#theme');await check(`document.body.dataset.theme==='dark'`,'Dark theme');await shot('detail-dark');await click('#theme');
    await check(`document.documentElement.scrollWidth<=innerWidth+1`,'No horizontal page overflow');
    assert.deepEqual(errors,[]);checks.push({label:'No browser runtime exceptions',pass:true});
    await evaluate(`document.querySelector('.brand').click();scrollTo(0,0)`);await wait(reduced?50:850);await shot('final');
    console.log(JSON.stringify({viewport:suffix,passed:checks.length,errors:errors.length}));
  }catch(error){console.error(error);process.exitCode=1;}
  finally{
    writeFileSync(resolve(root,`.verification/report-${suffix}.json`),JSON.stringify({checks,errors},null,2));
    socket?.close();chrome.kill('SIGKILL');await wait(300);
    const resolvedProfile=resolve(profile),safePrefix=resolve(tmpdir())+sep;
    if(resolvedProfile.startsWith(safePrefix)&&resolvedProfile.includes('declaw-atlas-test-'))try{rmSync(resolvedProfile,{recursive:true,force:true});}catch{}
  }
}
