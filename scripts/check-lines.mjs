import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {internals} from '../internals.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
mkdirSync(resolve(root,'.verification'),{recursive:true});
const actions=[];
for(const theme of ['light','dark']){
  actions.push(['eval',`document.body.dataset.theme='${theme}';document.querySelector('#home-view').click();'${theme} / overview'`],['lines']);
  for(const id of Object.keys(internals))actions.push(
    ['eval',`document.querySelector('#home-view').click();document.querySelector('[data-select="${id}"]').click();document.querySelector('#open-housing').click();document.querySelectorAll('.trace-hit,.trace-insulator,.trace-pulse').forEach(el=>el.style.strokeOpacity='0');'${theme} / ${id}'`],
    ['wait',50],['lines'],
  );
}
const file=resolve(root,'.verification/line-checks.json');writeFileSync(file,JSON.stringify(actions,null,2));
const r=spawnSync(process.execPath,[resolve(root,'vendor/anatomy/verify/drive.mjs'),resolve(root,'index.html'),'--actions',file,'--reduced','--width','1440','--height','1200'],{cwd:root,encoding:'utf8',timeout:180000,windowsHide:true});
process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exitCode=r.status??1;
if(r.status===0)console.log('Line ends passed: overview and all 12 cutaways, both themes.');
