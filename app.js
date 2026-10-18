const $=s=>document.querySelector(s);
const all=s=>[...document.querySelectorAll(s)];
const byId=new Map(components.map(c=>[c.id,c]));
let selected='cli', journey='read', outcome='normal', step=0, timer=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const stateSteps=()=>journeySteps(journey,outcome);
function details(id,updateHash=true) {
  const c=byId.get(id); if(!c)return;
  selected=id;
  $('#details').innerHTML=`<div class="detail-kicker"><span>COMPONENT / INSPECT</span><span class="number">${c.n}</span></div><h2>${escapeHtml(c.name)}</h2><p class="object-name">${escapeHtml(c.object)}</p><div class="boundary-badge">${escapeHtml(c.boundary)}</div><p class="summary">${escapeHtml(c.summary)}</p><p class="detail-label">ĐẦU VÀO</p><p class="detail-value">${escapeHtml(c.input)}</p><p class="detail-label">ĐẦU RA</p><p class="detail-value">${escapeHtml(c.output)}</p><p class="detail-label">BÊN TRONG CƠ CẤU</p><ul class="inside-list">${c.inside.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul><p class="detail-label">RANH GIỚI & NGUYÊN TẮC</p><p class="rule">${escapeHtml(c.rule)}</p><p class="detail-label">ĐỌC MÃ NGUỒN ↗</p><div class="file-links">${c.files.map(f=>`<a href="${sourceLink(f)}" target="_blank" rel="noopener">${escapeHtml(f)} ↗</a>`).join('')}</div><p class="detail-label">THÀNH PHẦN LIÊN QUAN</p><div class="related">${c.links.map(s=>`<button data-select="${s}">${escapeHtml(byId.get(s).name)}</button>`).join('')}</div>`;
  all('[data-select]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.select===id)));
  all('.iso-stage [data-station]').forEach(g=>g.toggleAttribute('data-selected',g.dataset.station===id));
  $('#drawing-readout').textContent=`${c.n} / ${c.name}`;
  if(updateHash) saveHash();
}
function saveHash() {
  const params=new URLSearchParams({component:selected,flow:journey,outcome,step:String(step+1)});
  try {history.replaceState(null,'',`#${params}`);} catch { /* file:// may restrict history; UI remains usable. */ }
}
function stop(){if(timer)clearTimeout(timer);timer=null;$('#play').textContent=reduced.matches?'Xem bước tiếp':'Chạy mô phỏng';$('#play').setAttribute('aria-pressed','false');$('#quick-play').textContent=reduced.matches?'Bước tiếp':'▶ Chạy luồng';$('#quick-play').setAttribute('aria-pressed','false');}
function renderStep(focusStation=true) {
  const steps=stateSteps();step=Math.max(0,Math.min(step,steps.length-1));const s=steps[step];
  $('#steps').style.setProperty('--count',steps.length);
  $('#steps').innerHTML=steps.map((v,i)=>`<button class="step-button" data-step="${i}"${i===step?' aria-current="step"':''}${i<step?' data-complete=""':''}><span class="step-number">${String(i+1).padStart(2,'0')} / ${byId.get(v.at).n}</span><span>${escapeHtml(v.title)}</span></button>`).join('');
  $('#step-counter').textContent=`${String(step+1).padStart(2,'0')} / ${String(steps.length).padStart(2,'0')}`;
  $('#step-title').textContent=s.title;$('#step-text').textContent=s.text;
  $('#quick-flow').value=journey;$('#quick-status').textContent=`${step+1} / ${steps.length} · ${s.title}`;
  $('#quick-next').disabled=step===steps.length-1;
  $('#prev').disabled=step===0;$('#next').disabled=step===steps.length-1;
  all('[data-journey]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.journey===journey)));
  if(focusStation)details(s.at,false);saveHash();
}
function renderOutcomes() {
  const choices=journey==='write'?[['normal','Người dùng cho phép'],['deny','Người dùng từ chối']]:journey==='index'?[['normal','Tệp thay đổi, parse thành công']]:[['normal','Nội dung an toàn'],['unsafe','Nội dung bị chặn / classifier lỗi']];
  if(!choices.some(([v])=>v===outcome))outcome='normal';
  $('#outcome').innerHTML=choices.map(([v,n])=>`<option value="${v}"${v===outcome?' selected':''}>${n}</option>`).join('');
}
function advance(){if(step>=stateSteps().length-1){stop();return;}step++;renderStep();timer=setTimeout(advance,2600);}
document.addEventListener('click',e=>{
  const pick=e.target.closest('[data-select]');
  if(pick){stop();details(pick.dataset.select);return;}
  const g=e.target.closest('.iso-stage [data-station]');
  if(g&&byId.has(g.dataset.station)){stop();details(g.dataset.station);return;}
  const tab=e.target.closest('[data-journey]');
  if(tab){stop();journey=tab.dataset.journey;outcome='normal';step=0;renderOutcomes();renderStep();return;}
  const next=e.target.closest('[data-step]');
  if(next){stop();step=Number(next.dataset.step);renderStep();}
});
$('#outcome').addEventListener('change',()=>{stop();outcome=$('#outcome').value;step=0;renderStep();});
$('#next').addEventListener('click',()=>{stop();step++;renderStep();});
$('#prev').addEventListener('click',()=>{stop();step--;renderStep();});
$('#reset').addEventListener('click',()=>{stop();step=0;renderStep();});
$('#play').addEventListener('click',()=>{
  if(timer){stop();return;}
  // Reduced motion advances exactly one step, including restart at step zero.
  if(reduced.matches){step=step===stateSteps().length-1?0:step+1;renderStep();return;}
  if(step===stateSteps().length-1){step=0;renderStep();}
  $('#play').textContent='Tạm dừng';$('#play').setAttribute('aria-pressed','true');timer=setTimeout(advance,2600);
  $('#quick-play').textContent='Ⅱ Tạm dừng';$('#quick-play').setAttribute('aria-pressed','true');
});
$('#quick-flow').addEventListener('change',()=>{stop();journey=$('#quick-flow').value;outcome='normal';step=0;renderOutcomes();renderStep();});
$('#quick-play').addEventListener('click',()=>$('#play').click());
$('#quick-next').addEventListener('click',()=>$('#next').click());
$('#theme').addEventListener('click',()=>{document.body.dataset.theme=document.body.dataset.theme==='light'?'dark':'light';$('#theme').setAttribute('aria-pressed',String(document.body.dataset.theme==='dark'));});
$('.iso-stage').addEventListener('pointerover',e=>{
  const id=e.target.closest('[data-station]')?.dataset.station;
  all('.iso-stage [data-station]').forEach(g=>g.toggleAttribute('data-hover',g.dataset.station===id&&id!=='stand'));
});
$('.iso-stage').addEventListener('pointerleave',()=>all('.iso-stage [data-hover]').forEach(g=>g.removeAttribute('data-hover')));
$('.brand').addEventListener('click',e=>{e.preventDefault();stop();journey='read';outcome='normal';step=0;renderOutcomes();renderStep();window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){stop();return;}
  if(e.target.closest('.stations')&&['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){
    const buttons=all('.stations button');let i=buttons.indexOf(e.target);if(i<0)return;e.preventDefault();
    i=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
    buttons[i].focus();stop();details(buttons[i].dataset.select);
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();},{threshold:0}).observe($('main'));
reduced.addEventListener('change',()=>{stop();$('#play').textContent=reduced.matches?'Xem bước tiếp':'Chạy mô phỏng';});
function restore(){
  stop();const p=new URLSearchParams(location.hash.slice(1));
  journey=journeys[p.get('flow')]?p.get('flow'):'read';outcome=p.get('outcome')||'normal';
  renderOutcomes();step=Math.max(0,(Number(p.get('step'))||1)-1);renderStep(false);
  details(byId.has(p.get('component'))?p.get('component'):'cli');
  if(reduced.matches)$('#play').textContent='Xem bước tiếp';
}
window.addEventListener('hashchange',restore);restore();
