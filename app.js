const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const byId=Object.fromEntries(components.map(c=>[c.id,c]));
const svg=$('#atlas'),overview=$('#overview'),inside=$('#interior');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const state={view:'overview',component:null,node:null,wire:null,flow:'read',outcome:'normal',step:0};
let pose={x:0,y:0,w:1640,h:1040},savedOverview=null,cameraFrame=0,pulseFrame=0,playTimer=0,motionEnd=null;
const frameToLocal=id=>{const b=districtBoxes[id],s=b.w/1800;return {...b,s,h:1040*s};};
const baseBox=()=>state.view==='detail'?frameToLocal(state.component):{x:0,y:0,w:1640,h:1040};
const show=(el,visible)=>el.toggleAttribute('hidden',!visible);
function fitted(box,padding=1.03){
  const rect=svg.getBoundingClientRect(),ratio=rect.width/Math.max(1,rect.height);
  let w=box.w*padding,h=box.h*padding;if(w/h>ratio)h=w/ratio;else w=h*ratio;
  return {x:box.x+box.w/2-w/2,y:box.y+box.h/2-h/2,w,h};
}
function initialView(){
  const p=fitted(baseBox());
  // A narrow panel starts at a readable neighbourhood scale; Fit still shows all 12.
  if(state.view==='overview'&&svg.clientWidth<600){const factor=820/p.w;p.x+=p.w*(1-factor)/2;p.y+=p.h*(1-factor)/2;p.w*=factor;p.h*=factor;}
  if(state.view==='detail'&&svg.clientWidth<600){const b=frameToLocal(state.component),w=720*b.s,h=w*svg.clientHeight/svg.clientWidth;p.x=b.x+260*b.s-w/2;p.y=b.y+520*b.s-h/2;p.w=w;p.h=h;}
  return p;
}
function nodeBox(id){
  const g=internals[state.component],i=g.nodes.findIndex(n=>n.id===id),cols=g.nodes.length>6?4:3,b=frameToLocal(state.component);
  return {x:b.x+(80+(i%cols)*(cols===4?400:600))*b.s,y:b.y+(255+Math.floor(i/cols)*350)*b.s,w:(cols===4?300:360)*b.s,h:240*b.s};
}
function setPose(p){
  pose={...p};svg.setAttribute('viewBox',`${pose.x} ${pose.y} ${pose.w} ${pose.h}`);
  $('#zoom-value').textContent=Math.round(fitted(baseBox()).w/pose.w*100)+'%';
}
function settledLayers(){
  show(overview,state.view!=='detail');show(inside,state.view==='detail');
  overview.style.opacity='1';inside.style.opacity='1';
  overview.style.pointerEvents='';inside.style.pointerEvents='';
}
function cancelCamera(){
  cancelAnimationFrame(cameraFrame);cameraFrame=0;
  if(motionEnd){const finish=motionEnd;motionEnd=null;finish();}
}
function cameraTo(target,{animate=true,transition=false,done}={}){
  cancelCamera();const from={...pose},start=performance.now();
  if(!animate||reduced.matches){setPose(target);settledLayers();done?.();return;}
  if(transition){show(overview,true);show(inside,true);overview.style.pointerEvents='none';inside.style.pointerEvents='none';}
  motionEnd=()=>{settledLayers();done?.();};
  const frame=now=>{
    const t=Math.min(1,(now-start)/800),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    const p={};for(const key of ['x','y','w','h'])p[key]=from[key]+(target[key]-from[key])*ease;setPose(p);
    if(transition){inside.style.opacity=String(state.view==='detail'?ease:1-ease);overview.style.opacity=String(state.view==='detail'?1-ease:ease);}
    if(t<1)cameraFrame=requestAnimationFrame(frame);else{cameraFrame=0;const finish=motionEnd;motionEnd=null;finish?.();}
  };cameraFrame=requestAnimationFrame(frame);
}
function limitPose(p){
  const fit=fitted(baseBox()),min=fit.w*.12,max=fit.w*2.5;
  const w=Math.max(min,Math.min(max,p.w)),h=w*pose.h/pose.w,b=baseBox();
  return {x:Math.max(b.x-w*.8,Math.min(b.x+b.w-w*.2,p.x)),y:Math.max(b.y-h*.8,Math.min(b.y+b.h-h*.2,p.y)),w,h};
}
function worldPoint(x,y,p=pose){const r=svg.getBoundingClientRect();return {x:p.x+(x-r.left)/r.width*p.w,y:p.y+(y-r.top)/r.height*p.h};}
function zoom(factor,x,y){
  cancelCamera();const r=svg.getBoundingClientRect(),at=worldPoint(x??r.left+r.width/2,y??r.top+r.height/2);
  setPose(limitPose({x:at.x-(at.x-pose.x)*factor,y:at.y-(at.y-pose.y)*factor,w:pose.w*factor,h:pose.h*factor}));
}
function sourceAnchor(n){return `<a class="source-link" href="${sourceLink(n.file)}#L${n.line}" target="_blank" rel="noopener">${esc(n.file)}:${n.line} ↗</a>`;}
const contracts=(input,output)=>`<div class="contract"><span>IN / ĐẦU VÀO</span><p>${esc(input)}</p></div><div class="contract out"><span>OUT / ĐẦU RA</span><p>${esc(output)}</p></div>`;
const section=(title,content)=>`<section class="detail-section"><h3>${title}</h3>${content}</section>`;
function icon(id){return `<svg class="detail-icon" viewBox="0 0 145 140" style="--zone:${districts[id].color}" aria-hidden="true">${$(`[data-district="${id}"] .landmark`).outerHTML}</svg>`;}
function relationButton(e,internal=true){
  const name=id=>internal?internals[state.component].nodes.find(n=>n.id===id).label:districts[id].name;
  return `<button data-relation="${e.id}" aria-pressed="${state.wire===e.id}">${esc(name(e.from))} → ${esc(name(e.to))}<small>${esc(e.label)} · ${relationNames[e.kind]}</small></button>`;
}
function renderDetails(){
  const c=byId[state.component],g=internals[state.component],n=g?.nodes.find(n=>n.id===state.node);
  const edges=state.view==='detail'?g.edges:connections,e=edges.find(e=>e.id===state.wire);
  let content='';
  $('#clear-selection').hidden=!state.node&&!state.wire;
  if(e){
    const nodeName=id=>state.view==='detail'?g.nodes.find(n=>n.id===id).label:districts[id].name;
    const attr=state.view==='detail'?'data-inspect-node':'data-open';
    content=`<p class="detail-kicker">${state.view==='detail'?districts[state.component].name:'Tổng quan'} / KẾT NỐI</p><h2>${esc(e.label)}</h2><div class="relation-key"><span class="relation-sample ${e.kind}"></span>${relationNames[e.kind]}</div><div class="edge-summary"><button ${attr}="${e.from}">${esc(nodeName(e.from))}</button><span>→</span><button ${attr}="${e.to}">${esc(nodeName(e.to))}</button></div>`;
    if(state.view==='detail'){
      const from=g.nodes.find(n=>n.id===e.from),to=g.nodes.find(n=>n.id===e.to);
      content+=contracts(from.output,to.input)+section('HAI ĐẦU NỐI',`<p class="detail-copy"><b>${esc(from.symbol)}</b><br>${esc(from.role)}</p>${sourceAnchor(from)}<p class="detail-copy"><b>${esc(to.symbol)}</b><br>${esc(to.role)}</p>${sourceAnchor(to)}`);
    }else content+=`<p class="detail-copy">Mũi tên từ <b>${districts[e.from].name}</b> tới <b>${districts[e.to].name}</b> biểu diễn ${relationNames[e.kind].toLowerCase()}. Kết quả của lời gọi được trả về caller.</p>`+contracts(byId[e.from].output,byId[e.to].input)+`<p class="rule">Đây là quan hệ giữa các trách nhiệm. Bấm hai đầu nối để mở hàm/class và nguồn tương ứng.</p>`;
  }else if(n){
    content=`<p class="detail-kicker">${districts[c.id].name} / HÀM & CLASS</p><h2>${esc(n.label)}</h2><p class="detail-subtitle">${esc(n.symbol)}</p><p class="detail-copy">${esc(n.role)}</p>${contracts(n.input,n.output)}${sourceAnchor(n)}${section('CÁC QUAN HỆ CỦA NÚT',`<div class="relation-list">${g.edges.filter(e=>e.from===n.id||e.to===n.id).map(e=>relationButton(e)).join('')}</div>`)}`;
  }else if(c){
    content=`${icon(c.id)}<p class="detail-kicker">KHU ${c.n} / ${state.view==='detail'?'BÊN TRONG':'TỔNG QUAN'}</p><h2>${districts[c.id].name}</h2><p class="detail-subtitle">${c.name}</p><span class="boundary-badge">${esc(c.boundary)}</span><p class="detail-copy">${esc(c.summary)}</p>${contracts(c.input,c.output)}${state.view==='overview'?`<button data-open="${c.id}">Đi vào khu ${districts[c.id].name} ↗</button>`:''}${section('CÓ GÌ BÊN TRONG?',`<div class="symbol-list">${g.nodes.map(n=>`<button data-inspect-node="${n.id}" aria-pressed="false"><strong>${esc(n.label)}</strong><span>${esc(n.symbol)}</span></button>`).join('')}</div>`)}${section(state.view==='detail'?'KẾT NỐI BÊN TRONG':'LIÊN KẾT VỚI CÁC KHU',`<div class="relation-list">${(state.view==='detail'?g.edges:connections.filter(e=>e.from===c.id||e.to===c.id)).map(e=>relationButton(e,state.view==='detail')).join('')}</div>`)}${section('RANH GIỚI & HÀNH VI',`<p class="rule">${esc(c.rule)}</p>`)}${section('MÃ NGUỒN',`<div class="source-list">${c.files.map(f=>`<a href="${sourceLink(f)}" target="_blank" rel="noopener">${esc(f)} ↗</a>`).join('')}</div>`)}`;
  }else{
    content=`<p class="detail-kicker">BẢN ĐỒ KIẾN TRÚC / 01</p><h2>Đi vào DeClaw.</h2><p class="overview-intro"><b>Brain</b> điều phối suy luận. <b>Tools</b> thực thi thao tác. <b>Documents</b> xử lý tài liệu. <b>Memory</b> giữ ngữ cảnh và ký ức.</p><p class="overview-intro">Mỗi khu có một hình nhận diện theo chức năng. Bấm vào khu để phóng to và xem các hàm/class nối với nhau.</p><div class="overview-metrics"><div><strong>12</strong><span>KHU CHỨC NĂNG</span></div><div><strong>76</strong><span>THAM CHIẾU NGUỒN</span></div><div><strong>72</strong><span>QUAN HỆ NỘI BỘ</span></div></div><button data-open="agent">Khám phá Brain ↗</button>${section('ĐỌC CÁC ĐƯỜNG NỐI',`<p class="detail-copy">Rê chuột lên một khu để làm rõ các khu liên quan. Bấm đường nối để xem dữ liệu hoặc lời gọi đi qua.</p>${Object.entries(relationNames).map(([k,v])=>`<div class="relation-key"><span class="relation-sample ${k}"></span>${v}</div>`).join('')}`)}${section('THAO TÁC',`<p class="detail-copy">Kéo để di chuyển, cuộn hoặc chụm hai ngón để zoom. Nút ⊡ đưa bản đồ vừa khung. Escape trở lại tổng quan.</p>`)}`;
  }
  $('#details').innerHTML=content;$('#inspector').scrollTop=0;
}
function highlight(hoverId=null){
  const edges=state.view==='detail'?internals[state.component].edges:connections;
  const active=edges.find(e=>e.id===state.wire),node=state.node||hoverId;
  const rel=active?[active]:node?edges.filter(e=>e.from===node||e.to===node):[];
  const ids=new Set(rel.flatMap(e=>[e.from,e.to]));
  const root=state.view==='detail'?inside:overview;root.classList.toggle('has-relation',!!active||!!node);
  for(const el of root.querySelectorAll('[data-wire]')){el.classList.toggle('highlight',rel.some(e=>e.id===el.dataset.wire));el.classList.toggle('selected',el.dataset.wire===state.wire);}
  for(const el of root.querySelectorAll('[data-node]')){el.classList.toggle('selected',el.dataset.node===state.node);el.classList.toggle('endpoint',ids.has(el.dataset.node));el.classList.toggle('dimmed',(!!active||!!node)&&!ids.has(el.dataset.node)&&el.dataset.node!==node);}
  for(const el of overview.querySelectorAll('[data-district]')){el.classList.toggle('selected',el.dataset.district===state.component);el.classList.toggle('neighbor',ids.has(el.dataset.district));}
}
function stopPulse(){cancelAnimationFrame(pulseFrame);pulseFrame=0;all('.wire-pulse').forEach(n=>n.remove());}
function pulse(){
  stopPulse();if(reduced.matches||!state.wire||document.hidden)return;
  const root=state.view==='detail'?inside:overview,path=root.querySelector(`[data-wire="${state.wire}"] .wire-line`);if(!path)return;
  const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('r',state.view==='detail'?'5':'4');dot.classList.add('wire-pulse');root.append(dot);
  const start=performance.now(),length=path.getTotalLength();
  const frame=now=>{if(now-start>4800){stopPulse();return;}const p=path.getPointAtLength(((now-start)%2400)/2400*length);dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);pulseFrame=requestAnimationFrame(frame);};pulseFrame=requestAnimationFrame(frame);
}
function updateUI(){
  const detail=state.view==='detail';
  $('#map-title').textContent=detail?districts[state.component].name+' / bên trong.':'Bản đồ hệ thống.';
  $('#map-subtitle').textContent=detail?'Chọn hàm/class hoặc đường nối để xem chi tiết.':'Chọn một khu để đi vào bên trong.';
  $('#crumb').hidden=!detail;$('#crumb').textContent=detail?districts[state.component].name:'';
  $('.wiring-option').hidden=detail;
  $('#back-view').hidden=!detail;$('#map-context').textContent=detail?'IN bên trái → OUT bên phải · Chọn một đường để theo kết nối':'Kéo để di chuyển · Cuộn để zoom · Bấm một khu để khám phá';
  all('[data-open]').filter(n=>n.closest('.district-directory')).forEach(n=>n.setAttribute('aria-pressed',n.dataset.open===state.component));
  renderDetails();highlight();$('#map-status').textContent=detail?`Đã mở khu ${districts[state.component].name}. ${counts[state.component]} hàm/class.`:'Bản đồ tổng quan, 12 khu chức năng.';
}
function openDistrict(id,{animate=true,write=true}={}){
  if(!byId[id])return;stopPulse();pause();cancelCamera();
  const same=state.view==='detail'&&state.component===id;
  if(state.view==='overview')savedOverview={...pose};
  state.view='detail';state.component=id;state.node=null;state.wire=null;
  inside.innerHTML=interiorArt[id];const b=frameToLocal(id);inside.setAttribute('transform',`translate(${b.x} ${b.y}) scale(${b.s})`);inside.style.setProperty('--zone',districts[id].color);
  updateUI();cameraTo(initialView(),{animate,transition:!same});svg.focus({preventScroll:true});if(write)saveHash(true);
}
function goHome({animate=true,write=true}={}){
  stopPulse();cancelCamera();const wasDetail=state.view==='detail';state.view='overview';state.node=null;state.wire=null;
  updateUI();cameraTo(savedOverview||fitted(baseBox()),{animate,transition:wasDetail});svg.focus({preventScroll:true});if(write)saveHash(true);
}
function inspectNode(id,{write=true}={}){
  if(!state.component)return;if(state.view!=='detail')openDistrict(state.component,{write:false});
  if(!internals[state.component].nodes.some(n=>n.id===id))return;
  state.node=id;state.wire=null;stopPulse();renderDetails();highlight();
  cameraTo(fitted(nodeBox(id),1.8));if(write)saveHash();
}
function inspectWire(id,{write=true}={}){
  const edges=state.view==='detail'?internals[state.component].edges:connections;
  const edge=edges.find(e=>e.id===id);if(!edge)return;state.wire=id;state.node=null;renderDetails();highlight();
  if(state.view==='detail'){const a=nodeBox(edge.from),b=nodeBox(edge.to),x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);cameraTo(fitted({x,y,w:Math.max(a.x+a.w,b.x+b.w)-x,h:Math.max(a.y+a.h,b.y+b.h)-y},1.2));}
  pulse();if(write)saveHash();
}
function clearSelection(){const hadNode=!!state.node;state.node=null;state.wire=null;stopPulse();renderDetails();highlight();if(hadNode)cameraTo(fitted(baseBox()));saveHash();}
function activate(target){
  const district=target.closest('[data-district]'),node=target.closest('[data-node]'),wire=target.closest('[data-wire]');
  if(district)openDistrict(district.dataset.district);else if(node)inspectNode(node.dataset.node);else if(wire)inspectWire(wire.dataset.wire);else clearSelection();
}
// Pointer capture supports mouse, pen and two-finger touch on both exploration levels.
const pointers=new Map();let pan=null,pinch=null,lastPointerAction=0;
svg.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;cancelCamera();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture(e.pointerId);
  if(pointers.size===1)pan={x:e.clientX,y:e.clientY,pose:{...pose},target:e.target,moved:false};
  if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),anchor:worldPoint((a.x+b.x)/2,(a.y+b.y)/2),pose:{...pose}};if(pan)pan.moved=true;}
});
svg.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size>=2&&pinch){const [a,b]=[...pointers.values()],factor=pinch.distance/Math.max(10,Math.hypot(a.x-b.x,a.y-b.y)),at=worldPoint((a.x+b.x)/2,(a.y+b.y)/2,pinch.pose);setPose(limitPose({x:pinch.anchor.x-(at.x-pinch.pose.x)*factor,y:pinch.anchor.y-(at.y-pinch.pose.y)*factor,w:pinch.pose.w*factor,h:pinch.pose.h*factor}));}
  else if(pan){const dx=e.clientX-pan.x,dy=e.clientY-pan.y;if(Math.hypot(dx,dy)>5)pan.moved=true;if(pan.moved){svg.classList.add('dragging');const rect=svg.getBoundingClientRect();setPose(limitPose({...pan.pose,x:pan.pose.x-dx/rect.width*pan.pose.w,y:pan.pose.y-dy/rect.height*pan.pose.h}));}}
});
function pointerEnd(e){
  if(!pointers.has(e.pointerId))return;const selected=pan?.target,click=pan&&!pan.moved&&!pinch&&e.type==='pointerup';pointers.delete(e.pointerId);pinch=null;
  if(pointers.size===1){const p=[...pointers.values()][0];pan={...p,pose:{...pose},moved:true,target:svg};}
  else{pan=null;svg.classList.remove('dragging');}
  lastPointerAction=performance.now();if(click)activate(selected);
}
svg.addEventListener('pointerup',pointerEnd);svg.addEventListener('pointercancel',pointerEnd);
svg.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId))pointerEnd({...e,pointerId:e.pointerId,type:'pointercancel'});});
svg.addEventListener('click',e=>{if(performance.now()-lastPointerAction>500)activate(e.target);});
svg.addEventListener('wheel',e=>{
  e.preventDefault();if(e.shiftKey){cancelCamera();setPose(limitPose({...pose,x:pose.x+e.deltaY*pose.w/svg.clientWidth,y:pose.y+e.deltaX*pose.h/svg.clientHeight}));}
  else zoom(Math.exp(Math.max(-180,Math.min(180,e.deltaY))*.003),e.clientX,e.clientY);
},{passive:false});
svg.addEventListener('dblclick',e=>{e.preventDefault();if(!e.target.closest('[data-district],[data-node],[data-wire]'))zoom(.65,e.clientX,e.clientY);});
svg.addEventListener('pointerover',e=>{if(state.view==='overview'&&!pointers.size&&!state.wire){const id=e.target.closest('[data-district]')?.dataset.district;if(id)highlight(id);}});
svg.addEventListener('pointerleave',()=>highlight());
svg.addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(e.target);return;}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();cancelCamera();setPose(limitPose({...pose,x:pose.x+({'ArrowLeft':-1,'ArrowRight':1}[e.key]||0)*pose.w*.1,y:pose.y+({'ArrowUp':-1,'ArrowDown':1}[e.key]||0)*pose.h*.1}));}
  if(e.key==='+'||e.key==='='){e.preventDefault();zoom(.8);}if(e.key==='-'){e.preventDefault();zoom(1.25);}if(e.key==='Home'){e.preventDefault();cameraTo(fitted(baseBox()));}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){pause();$('#help').hidden=true;$('#help-toggle').setAttribute('aria-expanded','false');if(state.node||state.wire)clearSelection();else if(state.view==='detail')goHome();}});
document.addEventListener('click',e=>{
  const open=e.target.closest('[data-open]'),node=e.target.closest('[data-inspect-node]'),relation=e.target.closest('[data-relation]'),step=e.target.closest('[data-step]');
  if(open)openDistrict(open.dataset.open);if(node)inspectNode(node.dataset.inspectNode);if(relation)inspectWire(relation.dataset.relation);if(step){pause();state.step=+step.dataset.step;renderFlow();saveHash();}
});
$('#home-view').onclick=()=>goHome();$('#back-view').onclick=()=>goHome();$('.brand').onclick=e=>{e.preventDefault();state.component=null;savedOverview=null;goHome();};
$('#clear-selection').onclick=clearSelection;$('#zoom-in').onclick=()=>zoom(.8);$('#zoom-out').onclick=()=>zoom(1.25);$('#fit-view').onclick=()=>cameraTo(fitted(baseBox()));
$('#all-wires').onchange=e=>svg.classList.toggle('show-all',e.target.checked);
$('#help-toggle').onclick=()=>{$('#help').hidden=!$('#help').hidden;$('#help-toggle').setAttribute('aria-expanded',String(!$('#help').hidden));};
$('#theme').onclick=()=>document.body.dataset.theme=document.body.dataset.theme==='dark'?'light':'dark';
$('#mobile-details').onclick=()=>$('#inspector').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
$('#mobile-map').onclick=()=>$('#viewport').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
function currentSteps(){return journeySteps(state.flow,state.outcome);}
function pause(){clearInterval(playTimer);playTimer=0;$('#play').textContent='▶';$('#play').setAttribute('aria-label','Chạy mô phỏng');}
function renderFlow(){
  const steps=currentSteps();state.step=Math.max(0,Math.min(steps.length-1,state.step));const s=steps[state.step];
  $('#step-counter').textContent=`${String(state.step+1).padStart(2,'0')} / ${String(steps.length).padStart(2,'0')}`;
  $('#step-title').textContent=districts[s.at].name+' · '+s.title;$('#step-text').textContent=s.text;
  $('#steps').innerHTML=steps.map((s,i)=>`<button data-step="${i}" aria-label="Bước ${i+1}: ${esc(s.title)}" ${i===state.step?'aria-current="step"':''}></button>`).join('');
  $('#prev').disabled=state.step===0;$('#next').disabled=state.step===steps.length-1;
  all('[data-district]').forEach(n=>n.classList.toggle('active-step',n.dataset.district===s.at));
}
function outcomeOptions(){
  const options=[['normal','Bình thường'],...(state.flow==='write'?[['deny','Từ chối']]:['read','search'].includes(state.flow)?[['unsafe','Không an toàn']]:[])];
  if(!options.some(([v])=>v===state.outcome))state.outcome='normal';
  $('#outcome').innerHTML=options.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');$('#outcome').value=state.outcome;
}
function advance(delta){pause();state.step+=delta;renderFlow();saveHash();}
$('#prev').onclick=()=>advance(-1);$('#next').onclick=()=>advance(1);
$('#flow').onchange=e=>{pause();state.flow=e.target.value;state.step=0;outcomeOptions();renderFlow();saveHash();};
$('#outcome').onchange=e=>{pause();state.outcome=e.target.value;state.step=0;renderFlow();saveHash();};
$('#locate-step').onclick=()=>openDistrict(currentSteps()[state.step].at);
$('#play').onclick=()=>{
  if(playTimer){pause();return;}if(reduced.matches){advance(state.step===currentSteps().length-1?-state.step:1);return;}
  if(state.view==='detail')goHome();if(state.step===currentSteps().length-1)state.step=0;renderFlow();
  $('#play').textContent='Ⅱ';$('#play').setAttribute('aria-label','Tạm dừng mô phỏng');
  playTimer=setInterval(()=>{if(state.step>=currentSteps().length-1){pause();return;}state.step++;renderFlow();saveHash();if(state.step===currentSteps().length-1)pause();},2400);
};
function saveHash(push=false){
  const q=new URLSearchParams();if(state.component)q.set('component',state.component);if(state.view==='detail')q.set('view','detail');if(state.node)q.set('node',state.node);if(state.wire)q.set('wire',state.wire);q.set('flow',state.flow);q.set('outcome',state.outcome);q.set('step',state.step+1);
  const hash='#'+q;if(location.hash!==hash)history[push?'pushState':'replaceState'](null,'',hash);
}
function restoreHash(){
  pause();stopPulse();cancelCamera();const q=new URLSearchParams(location.hash.slice(1)),id=q.get('component');
  state.flow=journeys[q.get('flow')]?q.get('flow'):'read';state.outcome=q.get('outcome')||'normal';state.step=Math.max(0,(Number(q.get('step'))||1)-1);state.component=byId[id]?id:null;state.node=null;state.wire=null;
  const detail=['detail','open','focus'].includes(q.get('view'))&&state.component;
  if(detail)openDistrict(state.component,{animate:false,write:false});else{state.view='overview';settledLayers();updateUI();setPose(initialView());}
  if(detail&&q.get('node'))inspectNode(q.get('node'),{write:false});if(q.get('wire'))inspectWire(q.get('wire'),{write:false});
  $('#flow').value=state.flow;outcomeOptions();renderFlow();
}
window.addEventListener('hashchange',restoreHash);window.addEventListener('popstate',restoreHash);
new ResizeObserver(()=>{cancelCamera();setPose(initialView());}).observe($('#viewport'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();stopPulse();cancelCamera();}});
reduced.addEventListener('change',()=>{if(reduced.matches){pause();stopPulse();cancelCamera();}});
restoreHash();
