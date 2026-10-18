const $=s=>document.querySelector(s);
const all=s=>[...document.querySelectorAll(s)];
const byId=new Map(components.map(c=>[c.id,c]));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
let selected='cli',journey='read',outcome='normal',step=0,timer=null;
let view='overview',node=null,edge=null,traceTimer=null,cameraFrame=0,transitionTimer=null,transitionSerial=0;
const overviewSVG=$('#overview-scene svg');
const homeCamera=[0,0,1000,650];
const stateSteps=()=>journeySteps(journey,outcome);
const graph=()=>internals[selected];
const symbolLink=n=>sourceLink(n.file)+'#L'+n.line;
function saveHash(){
  const params=new URLSearchParams({component:selected,flow:journey,outcome,step:String(step+1)});
  if(view!=='overview')params.set('view',view);
  if(view==='open'&&node)params.set('node',node);
  if(view==='open'&&edge)params.set('wire',edge);
  try{history.replaceState(null,'','#'+params);}catch{}
}
function cameraTo(target,instant=false,targetSVG=overviewSVG){
  cancelAnimationFrame(cameraFrame);cameraFrame=0;
  const from=targetSVG.getAttribute('viewBox').split(/[ ,]+/).map(Number);
  if(instant||reduced.matches){targetSVG.setAttribute('viewBox',target.join(' '));return;}
  const start=performance.now();
  function frame(now){
    const t=Math.min(1,Math.max(0,(now-start)/950));
    const ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    targetSVG.setAttribute('viewBox',from.map((v,i)=>v+(target[i]-v)*ease).join(' '));
    cameraFrame=t<1?requestAnimationFrame(frame):0;
  }
  cameraFrame=requestAnimationFrame(frame);
}
function cameraFor(id){
  const b=machineBounds[id],h=Math.max(185,(b.bottom-b.y)*1.65),w=h*1000/650;
  return[(b.x+b.right-w)/2,(b.y+b.bottom-h)/2,w,h];
}
function stopTraces(){clearTimeout(traceTimer);traceTimer=null;$('#trace-play').textContent=reduced.matches?'Kết nối tiếp':'▶ Theo kết nối';$('#trace-play').setAttribute('aria-pressed','false');}
function stop(){
  clearTimeout(timer);timer=null;
  $('#play').textContent=reduced.matches?'Xem bước tiếp':'Chạy mô phỏng';$('#play').setAttribute('aria-pressed','false');
  $('#quick-play').textContent=reduced.matches?'Bước tiếp':'▶ Chạy luồng';$('#quick-play').setAttribute('aria-pressed','false');
}
function cancelTransition(){transitionSerial++;clearTimeout(transitionTimer);}
function viewControls(){
  $('#scene-tooltip').hidden=true;
  $('.iso-plate').dataset.mode=view;
  $('#back-view').hidden=view==='overview';$('#open-housing').hidden=view!=='focus';$('#trace-play').hidden=view!=='open';
  $('#crumb-component').hidden=view==='overview';$('#crumb-component').textContent=' / '+byId.get(selected).name;
  $('#crumb-depth').hidden=view!=='open';$('#crumb-depth').textContent=' / Bên trong';
  $('#inside-directory').hidden=view!=='open';
  $('#view-instruction').textContent=view==='overview'?'Bấm khoang máy để tiến lại gần':view==='focus'?'Bấm “Mở lớp vỏ” để khám phá class và hàm':'Bấm chip hoặc đường nối để xem vai trò và quan hệ';
  $('#scene-hint').textContent=view==='overview'?'KHAY NẠP → QUÉT → KIỂM TRA → KẾT QUẢ':view==='focus'?'MỞ LỚP VỎ ĐỂ XEM BÊN TRONG':'CHIP = CLASS / HÀM · DÂY = QUAN HỆ PHẦN MỀM';
  if(view==='focus')$('#quick-status').textContent=byId.get(selected).name+' · '+graph().nodes.length+' chip có thể khám phá';
}
function details(id,updateHash=true){
  const c=byId.get(id);if(!c)return;selected=id;
  const contract=`<p class="detail-label">ĐẦU VÀO</p><p class="detail-value">${escapeHtml(c.input)}</p><p class="detail-label">ĐẦU RA</p><p class="detail-value">${escapeHtml(c.output)}</p><p class="detail-label">BÊN TRONG CƠ CẤU</p><ul class="inside-list">${c.inside.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul><p class="detail-label">RANH GIỚI & NGUYÊN TẮC</p><p class="rule">${escapeHtml(c.rule)}</p><p class="detail-label">ĐỌC MÃ NGUỒN ↗</p><div class="file-links">${c.files.map(f=>`<a href="${sourceLink(f)}" target="_blank" rel="noopener">${escapeHtml(f)} ↗</a>`).join('')}</div>`;
  $('#details').innerHTML=`<div class="detail-kicker"><span>${view==='open'?'INTERNALS / INSPECT':'COMPARTMENT / INSPECT'}</span><span class="number">${c.n}</span></div><h2>${escapeHtml(c.name)}</h2><p class="object-name">${escapeHtml(c.object)}</p><div class="boundary-badge">${escapeHtml(c.boundary)}</div><p class="summary">${escapeHtml(c.summary)}</p>${view==='open'?'<section id="symbol-inspector" aria-live="polite"></section><details class="module-contract"><summary>Xem hợp đồng toàn module</summary>'+contract+'</details>':`<button class="inspect-cta" data-explore="${id}">Mở bên trong · ${graph().nodes.length} class / hàm ↗</button>`+contract}<p class="detail-label">THÀNH PHẦN LIÊN QUAN</p><div class="related">${c.links.map(s=>`<button data-select="${s}">${escapeHtml(byId.get(s).name)}</button>`).join('')}</div>`;
  all('[data-select]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.select===id)));
  all('#overview-scene [data-station]').forEach(g=>g.toggleAttribute('data-selected',g.dataset.station===id));
  $('#drawing-readout').textContent=`${c.n} / ${c.name}`;
  if(updateHash)saveHash();
}
function hideCutaway(){
  $('#cutaway').hidden=true;$('#cutaway').classList.remove('visible','opened');$('#cutaway').innerHTML='';
  delete $('#cutaway').dataset.component;
  $('#overview-scene').classList.remove('behind-cutaway');
}
function homeView(instant=false,write=true){
  cancelTransition();stopTraces();view='overview';node=null;edge=null;hideCutaway();cameraTo(homeCamera,instant);viewControls();details(selected,false);if(write)saveHash();
}
function focusComponent(id,instant=false){
  if(!byId.has(id))return;stop();stopTraces();
  if(id===selected&&view==='focus'&&!instant){openHousing();return;}
  if(id===selected&&view==='open'&&!instant)return;
  cancelTransition();hideCutaway();view='focus';node=null;edge=null;details(id,false);viewControls();cameraTo(cameraFor(id),instant);saveHash();
  if(!instant){const r=$('.iso-plate').getBoundingClientRect();if(r.top<12||r.bottom>innerHeight-12)$('.iso-plate').scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});}
}
function openHousing(instant=false){
  if(view==='overview')focusComponent(selected,instant);
  cancelTransition();stop();stopTraces();cameraTo(cameraFor(selected),true);view='open';node=graph().nodes[0].id;edge=null;
  const art=cutawayArt[selected];
  const reuse=$('#cutaway').dataset.component===selected&&!$('#cutaway').hidden&&!!$('#cutaway').firstElementChild;
  if(!reuse)$('#cutaway').innerHTML=art.svg;
  $('#cutaway').dataset.component=selected;$('#cutaway').hidden=false;
  $('#cutaway').style.setProperty('--cover-x',art.coverShift[0]+'px');$('#cutaway').style.setProperty('--cover-y',art.coverShift[1]+'px');
  $('#cutaway').classList.add('visible');$('#overview-scene').classList.add('behind-cutaway');
  const token=transitionSerial;
  if(instant||reduced.matches)$('#cutaway').classList.add('opened');
  else requestAnimationFrame(()=>requestAnimationFrame(()=>{if(token===transitionSerial&&view==='open')$('#cutaway').classList.add('opened');}));
  viewControls();details(selected,false);renderInside();saveHash();
}
function closeHousing(){
  if(view!=='open')return;cancelTransition();stopTraces();view='focus';node=null;edge=null;
  $('#cutaway').classList.remove('opened');$('#overview-scene').classList.remove('behind-cutaway');
  viewControls();details(selected,false);const token=transitionSerial;
  if(reduced.matches)hideCutaway();else transitionTimer=setTimeout(()=>{if(token===transitionSerial)hideCutaway();},650);
  saveHash();
}
function renderInside(){
  if(view!=='open')return;const g=graph();const current=g.nodes.find(n=>n.id===node)||g.nodes[0];
  const active=document.activeElement;
  const focusKey=active?.closest('#inside-directory')?(active.dataset.nodeSelect?['node-select',active.dataset.nodeSelect]:active.dataset.edgeSelect?['edge-select',active.dataset.edgeSelect]:null):null;
  const connection=g.edges.find(e=>e.id===edge);
  $('#inside-count').textContent=g.nodes.length+' CHIP / '+g.edges.length+' KẾT NỐI';
  $('#node-directory').innerHTML=g.nodes.map((n,i)=>`<button data-node-select="${n.id}" aria-pressed="${String(!edge&&current.id===n.id)}"><span>${String(i+1).padStart(2,'0')}</span><code>${escapeHtml(n.symbol)}</code></button>`).join('');
  $('#edge-directory').innerHTML=g.edges.map(e=>`<button data-edge-select="${e.id}" aria-pressed="${String(edge===e.id)}"><span class="relation-kind">${relationNames[e.kind]}</span><span>${escapeHtml(g.nodes.find(n=>n.id===e.from).label)} <b>→</b> ${escapeHtml(g.nodes.find(n=>n.id===e.to).label)}</span></button>`).join('');
  all('#cutaway [data-node]').forEach(el=>{el.toggleAttribute('data-node-active',!connection?el.dataset.node===current.id:[connection.from,connection.to].includes(el.dataset.node));});
  all('#cutaway [data-edge]').forEach(el=>{el.toggleAttribute('data-edge-active',connection?el.dataset.edge===connection.id:g.edges.some(e=>e.id===el.dataset.edge&&[e.from,e.to].includes(current.id)));el.toggleAttribute('data-signal',!!connection&&el.dataset.edge===connection.id);});
  const target=$('#symbol-inspector');
  if(connection){
    const from=g.nodes.find(n=>n.id===connection.from),to=g.nodes.find(n=>n.id===connection.to);
    target.innerHTML=`<p class="detail-label">${escapeHtml(relationNames[connection.kind].toUpperCase())}</p><h3 class="symbol-name">${escapeHtml(from.label)} <span>→</span> ${escapeHtml(to.label)}</h3><p class="symbol-role">${escapeHtml(connection.label)}</p><div class="wire-endpoints"><button data-node-select="${from.id}"><span>ĐẦU GỬI</span><code>${escapeHtml(from.symbol)}</code></button><button data-node-select="${to.id}"><span>ĐẦU NHẬN</span><code>${escapeHtml(to.symbol)}</code></button></div><p class="detail-label">ĐỐI CHIẾU HAI ĐẦU NỐI</p><div class="file-links"><a href="${symbolLink(from)}" target="_blank" rel="noopener">${escapeHtml(from.file)}:${from.line} ↗</a><a href="${symbolLink(to)}" target="_blank" rel="noopener">${escapeHtml(to.file)}:${to.line} ↗</a></div>`;
    $('#quick-status').textContent=relationNames[connection.kind]+' · '+connection.label;
  }else{
    target.innerHTML=`<p class="detail-label">CLASS / HÀM THẬT TRONG MÃ NGUỒN</p><h3 class="symbol-name">${escapeHtml(current.symbol)}</h3><p class="symbol-role">${escapeHtml(current.role)}</p><p class="detail-label">NHẬN</p><p class="detail-value">${escapeHtml(current.input)}</p><p class="detail-label">TRẢ VỀ / TẠO RA</p><p class="detail-value">${escapeHtml(current.output)}</p><p class="detail-label">ĐỊNH NGHĨA ↗</p><div class="file-links"><a href="${symbolLink(current)}" target="_blank" rel="noopener">${escapeHtml(current.file)}:${current.line} ↗</a></div><p class="detail-label">CÁC DÂY NỐI VỚI CHIP</p><div class="symbol-connections">${g.edges.filter(e=>[e.from,e.to].includes(current.id)).map(e=>`<button data-edge-select="${e.id}">${escapeHtml(e.label)} →</button>`).join('')||'<p class="detail-value">Không có kết nối được chọn trong góc nhìn này.</p>'}</div>`;
    $('#quick-status').textContent=current.symbol+' · '+current.role;
  }
  $('#drawing-readout').textContent=byId.get(selected).n+' / '+(connection?'CONNECTION':current.label);
  if(focusKey)$(`#inside-directory [data-${focusKey[0]}="${focusKey[1]}"]`)?.focus({preventScroll:true});
}
function selectNode(id){if(view!=='open'||!graph().nodes.some(n=>n.id===id))return;stopTraces();node=id;edge=null;renderInside();saveHash();}
function selectEdge(id,pause=true){if(view!=='open'||!graph().edges.some(e=>e.id===id))return;if(pause)stopTraces();edge=id;node=null;renderInside();saveHash();}
function traceNext(){
  if(view!=='open'){stopTraces();return;}
  const edges=graph().edges,i=edges.findIndex(e=>e.id===edge)+1;
  if(i>=edges.length){stopTraces();return;}
  selectEdge(edges[i].id,false);traceTimer=setTimeout(traceNext,2100);
}
$('#trace-play').addEventListener('click',()=>{
  if(traceTimer){stopTraces();return;}
  if(reduced.matches){const edges=graph().edges;selectEdge(edges[(edges.findIndex(e=>e.id===edge)+1)%edges.length].id);return;}
  if(edge===graph().edges.at(-1).id)edge=null;
  $('#trace-play').textContent='Ⅱ Tạm dừng kết nối';$('#trace-play').setAttribute('aria-pressed','true');traceNext();
});
$('#home-view').addEventListener('click',()=>{stop();homeView();});
$('#back-view').addEventListener('click',()=>view==='open'?closeHousing():homeView());
$('#open-housing').addEventListener('click',()=>openHousing());
function changeZoom(factor){
  const svg=view==='open'?$('#cutaway svg'):overviewSVG;
  const [x,y,w,h]=svg.getAttribute('viewBox').split(/[ ,]+/).map(Number);
  const next=Math.max(230,Math.min(1200,w*factor));
  let cx=x+w/2,cy=y+h/2;
  if(view==='open'&&node){const chip=$(`#cutaway [data-node="${node}"]`);if(chip){const b=chip.getBBox();cx=b.x+b.width/2;cy=b.y+b.height/2;}}
  cameraTo([cx-next/2,cy-next*650/1000/2,next,next*650/1000],false,svg);
}
$('#zoom-in').addEventListener('click',()=>changeZoom(.75));
$('#zoom-out').addEventListener('click',()=>changeZoom(1.33));
$('#fit-view').addEventListener('click',()=>cameraTo(view==='focus'?cameraFor(selected):homeCamera,false,view==='open'?$('#cutaway svg'):overviewSVG));
function renderStep(focusStation=true){
  const steps=stateSteps();step=Math.max(0,Math.min(step,steps.length-1));const s=steps[step];
  if(focusStation&&view!=='overview')homeView(false,false);
  $('#steps').style.setProperty('--count',steps.length);
  $('#steps').innerHTML=steps.map((v,i)=>`<button class="step-button" data-step="${i}"${i===step?' aria-current="step"':''}${i<step?' data-complete=""':''}><span class="step-number">${String(i+1).padStart(2,'0')} / ${byId.get(v.at).n}</span><span>${escapeHtml(v.title)}</span></button>`).join('');
  $('#step-counter').textContent=`${String(step+1).padStart(2,'0')} / ${String(steps.length).padStart(2,'0')}`;
  $('#step-title').textContent=s.title;$('#step-text').textContent=s.text;
  $('#quick-flow').value=journey;$('#quick-status').textContent=`${step+1} / ${steps.length} · ${s.title}`;
  $('#quick-next').disabled=step===steps.length-1;$('#prev').disabled=step===0;$('#next').disabled=step===steps.length-1;
  all('[data-journey]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.journey===journey)));
  if(focusStation)details(s.at,false);saveHash();
}
function renderOutcomes(){
  const choices=journey==='write'?[['normal','Người dùng cho phép'],['deny','Người dùng từ chối']]:journey==='index'?[['normal','Tệp thay đổi, parse thành công']]:[['normal','Nội dung an toàn'],['unsafe','Nội dung bị chặn / classifier lỗi']];
  if(!choices.some(([v])=>v===outcome))outcome='normal';
  $('#outcome').innerHTML=choices.map(([v,n])=>`<option value="${v}"${v===outcome?' selected':''}>${n}</option>`).join('');
}
function advance(){if(step>=stateSteps().length-1){stop();return;}step++;renderStep();timer=setTimeout(advance,2600);}
function chooseJourney(id){stop();stopTraces();homeView(false,false);journey=id;outcome='normal';step=0;renderOutcomes();renderStep();}

document.addEventListener('click',e=>{
  const chip=e.target.closest('[data-node-select],#cutaway [data-node]');
  if(chip){selectNode(chip.dataset.nodeSelect||chip.dataset.node);return;}
  const wire=e.target.closest('[data-edge-select],#cutaway [data-edge]');
  if(wire){selectEdge(wire.dataset.edgeSelect||wire.dataset.edge);return;}
  const explore=e.target.closest('[data-explore]');
  if(explore){
    const id=explore.dataset.explore;
    if(view==='focus'&&id===selected){openHousing();return;}
    focusComponent(id);const token=transitionSerial;
    if(reduced.matches)openHousing(true);else transitionTimer=setTimeout(()=>{if(token===transitionSerial)openHousing();},980);
    return;
  }
  const pick=e.target.closest('[data-select]');if(pick){focusComponent(pick.dataset.select);return;}
  const g=e.target.closest('#overview-scene [data-station]');if(g&&byId.has(g.dataset.station)){focusComponent(g.dataset.station);return;}
  const tab=e.target.closest('[data-journey]');if(tab){chooseJourney(tab.dataset.journey);return;}
  const next=e.target.closest('[data-step]');if(next){stop();step=Number(next.dataset.step);renderStep();}
});
$('#outcome').addEventListener('change',()=>{stop();outcome=$('#outcome').value;step=0;renderStep();});
$('#next').addEventListener('click',()=>{stop();step++;renderStep();});
$('#prev').addEventListener('click',()=>{stop();step--;renderStep();});
$('#reset').addEventListener('click',()=>{stop();step=0;renderStep();});
$('#play').addEventListener('click',()=>{
  if(timer){stop();return;}stopTraces();if(view!=='overview')homeView(false,false);
  if(reduced.matches){step=step===stateSteps().length-1?0:step+1;renderStep();return;}
  if(step===stateSteps().length-1){step=0;renderStep();}
  $('#play').textContent='Tạm dừng';$('#play').setAttribute('aria-pressed','true');timer=setTimeout(advance,2600);
  $('#quick-play').textContent='Ⅱ Tạm dừng';$('#quick-play').setAttribute('aria-pressed','true');
});
$('#quick-flow').addEventListener('change',()=>chooseJourney($('#quick-flow').value));
$('#quick-play').addEventListener('click',()=>$('#play').click());$('#quick-next').addEventListener('click',()=>$('#next').click());
$('#theme').addEventListener('click',()=>{document.body.dataset.theme=document.body.dataset.theme==='light'?'dark':'light';$('#theme').setAttribute('aria-pressed',String(document.body.dataset.theme==='dark'));});
$('.iso-stage').addEventListener('pointermove',e=>{
  const n=e.target.closest('#cutaway [data-node]'),w=e.target.closest('#cutaway [data-edge]'),g=e.target.closest('#overview-scene [data-station]');
  let text='';if(n)text=graph().nodes.find(v=>v.id===n.dataset.node)?.symbol||'';
  else if(w)text=graph().edges.find(v=>v.id===w.dataset.edge)?.label||'';
  else if(g&&byId.has(g.dataset.station))text=byId.get(g.dataset.station).name+' · Bấm để khám phá';
  const tip=$('#scene-tooltip'),box=$('.iso-stage').getBoundingClientRect();if(tip.textContent!==text)tip.textContent=text;tip.hidden=!text;
  tip.style.left=Math.max(8,Math.min(box.width-230,e.clientX-box.left+12))+'px';tip.style.top=Math.max(8,e.clientY-box.top-38)+'px';
  all('#overview-scene [data-station]').forEach(el=>el.toggleAttribute('data-hover',g&&el.dataset.station===g.dataset.station&&byId.has(g.dataset.station)));
});
$('.iso-stage').addEventListener('pointerleave',()=>{$('#scene-tooltip').hidden=true;all('#overview-scene [data-hover]').forEach(g=>g.removeAttribute('data-hover'));});
$('.brand').addEventListener('click',e=>{e.preventDefault();chooseJourney('read');homeView();window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){stop();stopTraces();if(view==='open')closeHousing();else if(view==='focus')homeView();return;}
  if(e.target.closest('.stations')&&['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){
    const buttons=all('.stations button');let i=buttons.indexOf(e.target);if(i<0)return;e.preventDefault();
    i=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
    buttons[i].focus();focusComponent(buttons[i].dataset.select);
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();stopTraces();}});
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting){stop();stopTraces();}},{threshold:0}).observe($('main'));
new IntersectionObserver(entries=>{$('.iso-stage').toggleAttribute('data-offscreen',!entries[0].isIntersecting);if(!entries[0].isIntersecting)stopTraces();},{threshold:0}).observe($('.iso-stage'));
reduced.addEventListener('change',()=>{stop();stopTraces();cameraTo(view==='overview'?homeCamera:cameraFor(selected),true);});
function restore(){
  stop();stopTraces();cancelTransition();const p=new URLSearchParams(location.hash.slice(1));
  const wantedView=p.get('view'),wantedNode=p.get('node'),wantedEdge=p.get('wire'),wantedId=byId.has(p.get('component'))?p.get('component'):'cli';
  view='overview';hideCutaway();cameraTo(homeCamera,true);
  journey=journeys[p.get('flow')]?p.get('flow'):'read';outcome=p.get('outcome')||'normal';renderOutcomes();
  step=Math.max(0,(Number(p.get('step'))||1)-1);renderStep(false);details(wantedId,false);viewControls();
  if(['focus','open'].includes(wantedView)){
    focusComponent(wantedId,true);
    if(wantedView==='open'){openHousing(true);if(graph().nodes.some(n=>n.id===wantedNode))selectNode(wantedNode);if(graph().edges.some(e=>e.id===wantedEdge))selectEdge(wantedEdge);}
  }
  saveHash();
}
window.addEventListener('hashchange',restore);restore();
