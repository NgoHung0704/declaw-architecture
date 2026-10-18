import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {internals} from '../internals.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const reduced=process.argv.includes('--reduced');
mkdirSync(resolve(root,'.verification'),{recursive:true});
const expected=Object.fromEntries(Object.entries(internals).map(([id,g])=>[id,{nodes:g.nodes.map(n=>n.id),edges:g.edges.map(e=>e.id)}]));
const actions=[
  ['eval',`window.results=[];window.check=(condition,label)=>{results.push({label,pass:!!condition});return !!condition};document.querySelector('[data-select="documents"]').click();window.widthAtStart=Number(document.querySelector('#overview-scene svg').getAttribute('viewBox').split(/[ ,]+/)[2])`],
  ['wait',140],
  ['eval',`check(Number(document.querySelector('#overview-scene svg').getAttribute('viewBox').split(/[ ,]+/)[2])<1000,'Camera zoom begins after selecting a compartment')`],
  ['eval',`window.beforeRetarget=document.querySelector('#overview-scene svg').getAttribute('viewBox');document.querySelector('[data-select="agent"]').click();check(document.querySelector('#overview-scene svg').getAttribute('viewBox')===window.beforeRetarget||${reduced},'An interrupted zoom starts from the visible camera pose');document.querySelector('[data-select="documents"]').click()`],
  ['wait',1000],
  ['eval',`check(document.querySelector('.iso-plate').dataset.mode==='focus'&&!document.querySelector('#open-housing').hidden,'Focus level exposes the open-housing action');document.querySelector('#open-housing').click()`],
  ['until',`document.querySelector('[data-cover]')&&Number(getComputedStyle(document.querySelector('[data-cover]')).opacity)<.01`,4000],
  ['eval',`check(document.querySelector('.iso-plate').dataset.mode==='open'&&document.querySelector('#cutaway').classList.contains('opened'),'Housing opens into a cutaway');check(Number(getComputedStyle(document.querySelector('[data-cover]')).opacity)<.01,'Lifted cover reveals the circuit board');check(document.querySelectorAll('#cutaway [data-node]').length===8,'Document compartment reveals eight real symbols')`],
  ...(!reduced?[
    ['eval',`window.originalCover=document.querySelector('[data-cover]');document.querySelector('#back-view').click()`],
    ['wait',160],
    ['eval',`document.querySelector('#open-housing').click();check(document.querySelector('[data-cover]')===window.originalCover,'Reversing a cover mid-close preserves the visible object')`],
    ['wait',1100],
  ]:[]),
  ['eval',`document.querySelector('[data-node-select="search"]').click();check(document.querySelector('.symbol-name').textContent==='search_documents','Selecting a chip reveals its exact function');check(document.querySelector('#symbol-inspector a').href.includes('#L98'),'Symbol inspection links to the definition line');document.querySelector('[data-edge-select="search-filter"]').click();check(document.querySelectorAll('#cutaway [data-node-active]').length===2,'Wire selection illuminates both endpoints');check(document.querySelectorAll('#cutaway [data-signal]').length===1,'Exactly one selected wire carries the signal');check(document.querySelector('#symbol-inspector').textContent.includes('chunk_sanitizer.filter'),'Wire inspector explains the relationship')`],
  ['eval',`document.querySelector('#zoom-in').click()`],
  ['wait',1050],
  ['eval',`check(Number(document.querySelector('#cutaway svg').getAttribute('viewBox').split(/[ ,]+/)[2])<1000,'Circuit camera supports a closer inspection');document.querySelector('#fit-view').click()`],
  ['wait',1050],
  ['eval',`check(document.querySelector('#cutaway svg').getAttribute('viewBox')==='0 0 1000 650','Fit restores the full circuit');document.querySelector('#back-view').click();document.querySelector('[data-select="plugins"]').click();document.querySelector('#open-housing').click()`],
  ['wait',850],
  ['eval',`check(!document.querySelector('#cutaway').hidden&&document.querySelector('.iso-plate').dataset.mode==='open'&&document.querySelector('#details h2').textContent==='Plugin host / doc-intel','An interrupted close cannot hide a newly opened compartment')`],
  ['eval',`(()=>{const expected=${JSON.stringify(expected)};for(const [id,g]of Object.entries(expected)){document.querySelector('#home-view').click();document.querySelector('[data-select="'+id+'"]').click();document.querySelector('#open-housing').click();check(document.querySelectorAll('#cutaway [data-node]').length===g.nodes.length&&document.querySelectorAll('#edge-directory button').length===g.edges.length,'Correct internal graph: '+id);document.querySelector('[data-node-select="'+g.nodes.at(-1)+'"]').click();check(document.querySelector('#symbol-inspector a').href.includes('#L'),'Source contract available: '+id);}return true})()`],
  ['key','Escape','#back-view'],
  ['eval',`check(document.querySelector('.iso-plate').dataset.mode==='focus','Escape closes one exploration level')`],
  ['key','Escape','#back-view'],
  ['wait',1000],
  ['eval',`check(document.querySelector('.iso-plate').dataset.mode==='overview','A second Escape returns to the whole machine');location.hash='component=memory&view=open&node=encrypt&flow=read&outcome=normal&step=1'`],
  ['wait',150],
  ['eval',`check(document.querySelector('.iso-plate').dataset.mode==='open'&&document.querySelector('.symbol-name').textContent==='encrypt_text','Deep links restore the exact internal symbol');check(document.documentElement.scrollWidth<=innerWidth+1,'Open internals do not overflow the viewport');({passed:results.filter(r=>r.pass).length,total:results.length,results})`],
];
const path=resolve(root,`.verification/inspection${reduced?'-reduced':''}.json`);writeFileSync(path,JSON.stringify(actions,null,2));
const r=spawnSync(process.execPath,[resolve(root,'vendor/anatomy/verify/drive.mjs'),resolve(root,'index.html'),'--actions',path,'--width',reduced?'390':'1440','--height','1200',...(reduced?['--reduced']:[])],{cwd:root,encoding:'utf8',timeout:60000,windowsHide:true});
process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');
const reports=(r.stdout||'').split('\n').filter(l=>l.startsWith('eval:')).map(l=>{try{return JSON.parse(l.slice(5));}catch{return null;}});
const report=reports.findLast(v=>v&&Array.isArray(v.results));
if(r.status!==0||!report||report.passed!==report.total){console.error('Inspection checks failed or did not finish.');process.exitCode=1;}
else console.log(`Inspection assertions passed: ${report.passed}/${report.total} (${reduced?'phone + reduced motion':'desktop'}).`);
