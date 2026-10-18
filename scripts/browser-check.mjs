import { spawnSync } from 'node:child_process';
import { mkdirSync,writeFileSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
mkdirSync(resolve(root,'.verification'),{recursive:true});
const reduced=process.argv.includes('--reduced');
const actions=[
  ['eval',`window.checks=[];window.check=(condition,label)=>{checks.push({label,pass:!!condition});return !!condition};check(document.querySelectorAll('.stations button').length===12,'12 accessible component controls')`],
  ['scroll','.iso-plate'],
  ['click','[data-station="documents"][data-subject] .iso-top'],
  ['eval',`check(document.querySelector('#details h2').textContent==='Document pipeline','SVG pointer selection')`],
  ['eval',`(()=>{let ok=true;for(const button of document.querySelectorAll('.stations button')){button.click();ok&&=document.querySelector('#details h2').textContent===button.textContent.trim().slice(2).trim();}return check(ok,'All 12 inspectors render')})()`],
  ['key','Home','.stations button'],
  ['key','ArrowRight','.stations button'],
  ['eval',`check(document.querySelector('#details h2').textContent==='Agent loop','Arrow-key component navigation')`],
  ['eval',`(()=>{let ok=true;const expected={read:7,write:7,index:8,search:8};for(const [id,count] of Object.entries(expected)){document.querySelector('[data-journey="'+id+'"]').click();ok&&=document.querySelectorAll('[data-step]').length===count;for(let i=0;i<count;i++)document.querySelector('[data-step="'+i+'"]').click();ok&&=document.querySelector('#next').disabled;}return check(ok,'Four complete journeys with bounded steps')})()`],
  ['eval',`document.querySelector('[data-journey="write"]').click();document.querySelector('#outcome').value='deny';document.querySelector('#outcome').dispatchEvent(new Event('change'));check(!document.querySelector('#steps').textContent.includes('Thực hiện thay đổi'),'Denied write never executes filesystem step')`],
  ['eval',`(()=>{let ok=true;for(const flow of ['read','search']){document.querySelector('[data-journey="'+flow+'"]').click();document.querySelector('#outcome').value='unsafe';document.querySelector('#outcome').dispatchEvent(new Event('change'));ok&&=document.querySelector('#steps').textContent.includes('cách ly');}return check(ok,'Unsafe read/retrieval quarantine branches')})()`],
  ['eval',`document.querySelector('[data-journey="read"]').click();document.querySelector('#quick-play').click();window.before=document.querySelector('#step-counter').textContent;check(${reduced?'true':`document.querySelector('#play').textContent==='Tạm dừng'`},'Quick playback starts')`],
  ['wait',2800],
  ['eval',`check(document.querySelector('#step-counter').textContent${reduced?'===':'!=='}window.before,'${reduced?'Reduced motion has no timed progression':'Playback advances from one shared model'}')`],
  ['eval',`document.querySelector('#play').textContent==='Tạm dừng'&&document.querySelector('#quick-play').click();window.paused=document.querySelector('#step-counter').textContent`],
  ['wait',2800],
  ['eval',`check(document.querySelector('#step-counter').textContent===window.paused,'Pause stops progression');document.querySelector('#theme').click();check(document.body.dataset.theme==='dark','Theme toggle');document.querySelector('#theme').click();location.hash='component=plugins&flow=search&outcome=unsafe&step=6'`],
  ['wait',100],
  ['eval',`check(document.querySelector('#details h2').textContent==='Plugin host / doc-intel'&&document.querySelector('#outcome').value==='unsafe'&&document.querySelector('#step-counter').textContent.startsWith('06'),'Deep link restores component, branch and step');check(document.documentElement.scrollWidth<=innerWidth+1,'No horizontal overflow');({passed:checks.filter(v=>v.pass).length,total:checks.length,checks})`],
];
const file=resolve(root,`.verification/actions${reduced?'-reduced':''}.json`);
writeFileSync(file,JSON.stringify(actions,null,2));
const result=spawnSync(process.execPath,[resolve(root,'vendor/anatomy/verify/drive.mjs'),resolve(root,'index.html'),'--actions',file,'--width',reduced?'390':'1440','--height','1200',...(reduced?['--reduced']:[])],{cwd:root,encoding:'utf8',timeout:60000,windowsHide:true});
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
const reports=(result.stdout||'').split('\n').filter(line=>line.startsWith('eval:')).map(line=>{try{return JSON.parse(line.slice(5));}catch{return null;}});
const report=reports.findLast(v=>v&&typeof v==='object'&&Array.isArray(v.checks));
if(result.status!==0||!report||report.passed!==report.total){console.error('Browser checks failed or did not finish.');process.exitCode=1;}
else console.log(`Browser assertions passed: ${report.passed}/${report.total} (${reduced?'phone + reduced motion':'desktop'}).`);
