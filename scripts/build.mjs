import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import * as k from '../vendor/anatomy/iso-kit.mjs';
import * as A from '../vendor/anatomy/audit.mjs';
import { components, journeys, source } from '../model.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const deck={x:-208,y:-130,w:416,d:270,r:9};
const P=k.fitProjection(k.boxCorners(deck,-20,65),1000,650,{pad:55,azimuth:38,elevation:38});
const R=A.recorder(P);
let serial=0;
function block(id,x,y,w,d,z,h,tone='mid',options={}) {
  const plan={x,y,w,d,r:Math.min(options.r??1.7,w/4,d/4)};
  const name=`${id}.${++serial}`;
  let inner='';
  if(options.seam) inner+=k.lineSvg(k.sideSeam(plan,z+h*.5,P,5),{tone:'faint'});
  if(options.border) inner+=k.lineSvg(k.planOutline(k.insetPlan(plan,2),z+h,P),{tone:'lo'});
  if(options.slots) inner+=k.lineSvg(options.slots.map(slot=>k.planOutline({...slot,r:.7},z+h,P,3)).join(''),{tone:'mid'});
  if(options.screws) {
    const screws=k.corners(plan,3.4);
    inner+=k.lineSvg(screws.map(([a,b])=>k.ring(a,b,.95,z+h,P,12)).join(''),{tone:'lo'});
    inner+=k.dotsSvg(screws.map(([a,b])=>k.iso([a,b,z+h],P)),{size:.33,tone:'mid'});
  }
  if(options.text) inner+=k.faceTextSvg(k.topMatrix([x+w/2,y+d/2],z+h,P),options.text,{size:3.5,tone:'mid',anchor:'middle'});
  const shape=R.solid(A.slab(plan,z,h,{name},5));
  R.put({piece:id,at:[x+w/2,y+d/2,z+h/2],svg:`<g data-station="${id}"${options.subject?' data-subject=""':''}>${k.solidSvg(k.slabOf(plan,z,h,P,5,.6),{tone,inner})}</g>`,shapes:[shape]});
}
// Each module is a supported instrument on the same explanatory workbench.
// Physical separation does not stand for separate software processes.
for(const [x,y] of k.corners(deck,19)) block('stand',x-7,y-7,14,14,-20,8,'lo');
block('stand',deck.x,deck.y,deck.w,deck.d,-12,12,'mid',{r:9,border:true,screws:true});
block('stand',-188,120,376,8,0,1,'lo',{r:1,text:'D E C L A W'});
block('stand',-188,109,376,4,0,2,'mid',{r:1});

for(const c of components) {
  const {id,x,y}=c;
  block(id,x-36,y-28,72,56,0,4,'lo',{border:true,screws:true});
  if(id==='cli') {
    block(id,x-25,y-19,50,27,4,6,'mid',{seam:true});
    block(id,x-24,y-18,48,12,10,32,'hi',{seam:true});
    block(id,x-19,y-17,38,10,42,1,'hi',{subject:true,border:true});
    block(id,x-25,y+9,50,12,4,3,'mid',{border:true,slots:Array.from({length:3},(_,j)=>({x:x-19+j*14,y:y+12,w:11,d:5}))});
  } else if(id==='agent') {
    block(id,x-28,y-20,56,40,4,3,'mid',{border:true,screws:true,slots:[...[-24,18].map(dx=>({x:x+dx,y:y-14,w:6,d:28})),...[-18,14].map(dy=>({x:x-15,y:y+dy,w:30,d:4}))]});
    block(id,x-15,y-13,30,26,7,8,'hi',{border:true,subject:true});
  } else if(id==='tools') {
    block(id,x-29,y-20,58,40,4,5,'mid',{border:true});
    for(let j=0;j<4;j++) block(id,x-23+j*12,y-11,9,18,9,5,'hi',{subject:j===0,border:true});
  } else if(id==='approval') {
    block(id,x-28,y-18,56,36,4,3,'mid',{border:true});
    for(const dx of [-26,20]) block(id,x+dx,y-12,6,24,7,27,'hi',{seam:true});
    block(id,x-26,y-12,52,6,34,5,'hi',{seam:true});
    block(id,x-18,y-4,36,12,7,4,'hi',{subject:true,border:true});
    block(id,x-8,y+12,16,5,7,4,'mid');
  } else if(id==='workspace') {
    block(id,x-27,y-20,54,40,4,3,'mid',{border:true});
    block(id,x-27,y-20,54,3,7,11,'hi');
    for(const dx of [-27,24]) block(id,x+dx,y-17,3,37,7,8,'mid');
    for(let j=0;j<3;j++) block(id,x-19+j,y-12+j*2,36,25,7+j,1,'hi',{subject:j===2,border:true});
  } else if(id==='documents') {
    block(id,x-29,y-21,58,42,4,4,'mid',{border:true});
    for(const dx of [-27,21]) block(id,x+dx,y-16,6,29,8,31,'hi',{seam:true});
    block(id,x-27,y-16,54,8,39,6,'hi',{screws:true});
    block(id,x-18,y-4,36,19,8,2,'hi',{subject:true,border:true});
    block(id,x-12,y-11,24,7,8,17,'mid',{seam:true});
  } else if(id==='sanitizer') {
    block(id,x-29,y-20,58,40,4,4,'mid',{border:true});
    for(const dx of [-27,23]) block(id,x+dx,y-17,4,28,8,16,'hi');
    block(id,x-23,y-17,46,4,8,16,'mid');
    block(id,x-18,y-8,32,15,8,2,'hi',{subject:true,border:true});
    block(id,x-17,y+11,34,6,8,7,'mid',{border:true});
  } else if(id==='plugins') {
    block(id,x-28,y-21,56,42,4,4,'mid',{border:true});
    for(const dx of [-26,22]) block(id,x+dx,y-17,4,34,8,20,'hi',{seam:true});
    block(id,x-19,y-13,38,26,8,29,'hi',{subject:true,border:true,seam:true});
    block(id,x-13,y+14,26,5,8,3,'mid',{border:true});
  } else if(id==='memory'||id==='storage') {
    block(id,x-28,y-20,56,32,4,34,'mid',{seam:true,screws:true,slots:[{x:x-20,y:y-15,w:13,d:9}]});
    // Drawer fronts touch the near face, handles touch the fronts.
    for(let j=0;j<2;j++) {
      block(id,x-24,y+12,48,3,7+j*15,12,'hi',{border:true,subject:j===1});
      block(id,x-7,y+15,14,3,11+j*15,3,'mid');
    }
  } else if(id==='ollama') {
    block(id,x-27,y-21,54,42,4,29,'mid',{seam:true,screws:true});
    block(id,x-24,y-18,48,36,33,4,'hi',{border:true});
    for(let j=0;j<3;j++) block(id,x-18+j*13,y-10,9,20,37,2,'hi',{subject:j===0,border:true});
  } else if(id==='audit') {
    block(id,x-28,y-21,56,42,4,7,'mid',{border:true,screws:true});
    block(id,x-21,y-11,42,22,11,3,'hi',{border:true});
    block(id,x-15,y-10,30,27,14,1,'hi',{subject:true,border:true});
    block(id,x-26,y-17,52,6,11,16,'mid',{seam:true});
    block(id,x-5,y-11,10,6,15,4,'hi',{border:true});
  }
}

A.settle(R,P,{states:[0],step:.65});
R.items.sort((a,b)=>a.key-b.key);
A.auditOrExit(R,P,{apart:false,frames:[0]});
if(process.exitCode) process.exit(process.exitCode);
const svg=k.figureSvg({width:1000,height:650,label:'Bàn xử lý tài liệu DeClaw: mười hai cơ cấu thể hiện các thành phần phần mềm, không phải sơ đồ thiết bị triển khai.',body:[`<path class="iso-halo" d="${k.haloOf(deck,-20,12,P)}"/>`,...R.items.map(item=>item.svg)]});
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const nav=components.map(c=>`<button class="station-button" data-select="${c.id}" aria-pressed="false"><span>${c.n}</span>${esc(c.name)}</button>`).join('');
const html=theme=>`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="description" content="Khám phá kiến trúc DeClaw bằng mô hình isometric tương tác, đối chiếu với mã nguồn."><title>DeClaw — Anatomy of a local agent</title><style>${k.ISO_CSS}\n${readFileSync(resolve(ROOT,'style.css'),'utf8')}</style></head>
<body class="iso" data-theme="${theme}"><a class="skip" href="#inspector">Đến chi tiết thành phần</a><div class="shell">
<header><a href="#" class="brand" aria-label="DeClaw Anatomy, về tổng quan"><span class="brand-mark">D<span>↗</span></span><span>DeClaw <b>/</b> Anatomy</span></a><div class="header-right"><span class="version">SOURCE STUDY · 01</span><button id="theme" aria-label="Đổi giao diện sáng tối">◐ <span>Đổi giao diện</span></button><a class="repo-link" href="https://github.com/NgoHung0704/declaw-architecture" target="_blank" rel="noopener">GitHub ↗</a></div></header>
<section class="intro"><div><p class="eyebrow">A LOCAL AGENT, TAKEN APART</p><h1>Một yêu cầu.<br>Cả hệ thống chuyển động.</h1></div><div class="intro-copy"><p>Khám phá cách DeClaw suy luận, xử lý tài liệu và kiểm soát thao tác — qua một bàn máy có thể chạm vào.</p><p class="source-note"><span class="status-dot"></span>Đối chiếu mã nguồn <a href="${source.repo}/tree/${source.commit}" target="_blank" rel="noopener">${source.commit.slice(0,7)} ↗</a></p></div></section>
<main><div class="explorer"><section class="drawing-column" aria-label="Mô hình kiến trúc"><figure class="iso-figure"><div class="iso-plate"><div class="plate-top"><span>FIG. 01 / DOCUMENT WORKBENCH</span><span>12 THÀNH PHẦN</span></div><div class="quick-controls"><label for="quick-flow" class="sr-only">Luồng xử lý trên mô hình</label><select id="quick-flow">${Object.entries(journeys).map(([id,j])=>`<option value="${id}">${esc(j.name)}</option>`).join('')}</select><button id="quick-play">▶ Chạy luồng</button><button id="quick-next" aria-label="Bước tiếp trên mô hình">→</button></div><div class="iso-stage">${svg}</div><div class="plate-bottom"><span>Chạm vào một cơ cấu để khám phá</span><span id="drawing-readout" data-readout>01 / CLI / REPL</span></div><div id="quick-status" class="quick-status"></div></div><figcaption>Cơ cấu vật lý là phép minh họa phần mềm. Các module lõi dùng chung một tiến trình Python; Ollama và plugin worker có ranh giới riêng.</figcaption></figure><div class="station-heading"><span>KHÁM PHÁ TỪNG CƠ CẤU</span><span>01 — 12</span></div><nav class="stations" aria-label="Chọn thành phần">${nav}</nav></section>
<aside id="inspector" tabindex="-1" aria-label="Chi tiết thành phần"><div id="details"></div></aside></div>
<section class="journey-section" aria-labelledby="journey-heading"><div class="section-heading"><div><p class="eyebrow">FOLLOW THE WORK</p><h2 id="journey-heading">Theo dấu một yêu cầu.</h2></div><p>Mô phỏng đường xử lý trong code. <br>Không chạy AI hay truy cập tài liệu của bạn.</p></div><div class="journey-tabs" role="group" aria-label="Chọn luồng xử lý">${Object.entries(journeys).map(([id,j])=>`<button data-journey="${id}" aria-pressed="false">${esc(j.name)}</button>`).join('')}</div><div class="journey-controls"><label for="outcome">Tình huống <select id="outcome"></select></label><div class="playback"><button id="prev" aria-label="Bước trước">←</button><button id="play">Chạy mô phỏng</button><button id="next" aria-label="Bước tiếp theo">→</button><button id="reset" aria-label="Chạy lại từ đầu">↺</button></div></div><div id="steps" class="steps" aria-label="Các bước xử lý"></div><div class="step-description" aria-live="polite" aria-atomic="true"><span id="step-counter"></span><div><h3 id="step-title"></h3><p id="step-text"></p></div><span class="simulation-tag">SIMULATION</span></div></section>
<section class="boundaries"><div><p class="eyebrow">READ THE BOUNDARIES</p><h2>Cục bộ, với ranh giới rõ ràng.</h2></div><div class="boundary-grid"><article><span>01 / PROCESS</span><h3>Một lõi Python</h3><p>CLI, agent, tool registry, documents, sanitizer, memory và audit là các module trong cùng ứng dụng. Worker plugin chạy ở subprocess; Ollama là dịch vụ riêng.</p></article><article><span>02 / DATA</span><h3>Mã hóa có phạm vi</h3><p>Text payloads trong Chroma được mã hóa. Embedding vectors và một số metadata không được mã hóa; SQLite không được mô tả là mã hóa toàn bộ.</p></article><article><span>03 / ROADMAP</span><h3>Phần chưa triển khai</h3><p>Gateway FastAPI, trải nghiệm desktop kết nối và shell sandbox chưa thuộc đường chạy CLI hiện tại. HTTP observer là quan sát trong process, không phải OS firewall.</p></article></div></section>
</main><footer><span>DeClaw / Architecture study · 2026</span><span>Geometry built with <a href="https://github.com/wheresryan22/anatomy" target="_blank" rel="noopener">Anatomy ↗</a> · <a href="${source.repo}" target="_blank" rel="noopener">Application source ↗</a></span></footer></div>
<script type="module">${readFileSync(resolve(ROOT,'model.mjs'),'utf8').replaceAll('export ','')}\n${readFileSync(resolve(ROOT,'app.js'),'utf8')}</script></body></html>`;
for(const theme of ['light','dark']) writeFileSync(resolve(ROOT,theme==='light'?'index.html':'index-dark.html'),html(theme));
mkdirSync(resolve(ROOT,'assets'),{recursive:true});
for(const theme of ['light','dark']) writeFileSync(resolve(ROOT,`assets/declaw-${theme}.svg`),k.figureSvg({width:1000,height:650,label:'DeClaw document workbench',body:R.items.map(i=>i.svg),standalone:theme}));
writeFileSync(resolve(ROOT,'docs/geometry.json'),JSON.stringify({parts:serial,projection:P,stations:components.map(c=>({id:c.id,x:c.x,y:c.y})),source,anatomy:'e9488296a44211c42701ff71705b7901470ec78f'},null,2)+'\n');
console.log(`Built light/dark HTML and SVG: ${serial} supported solids, ${components.length} stations.`);
