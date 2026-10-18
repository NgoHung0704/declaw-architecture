import * as k from '../vendor/anatomy/iso-kit.mjs';
import * as A from '../vendor/anatomy/audit.mjs';
import { components } from '../model.mjs';

export const layout={
  workspace:{x:-181,y:0,z:0,label:'KHAY NẠP'},documents:{x:-65,y:0,z:18,label:'QUÉT & CHIA ĐOẠN'},
  sanitizer:{x:40,y:0,z:18,label:'KIỂM TRA NỘI DUNG'},approval:{x:115,y:0,z:0,label:'CHỐT DUYỆT'},
  cli:{x:-124,y:86,z:-4,label:'ĐIỀU KHIỂN'},tools:{x:-25,y:86,z:-4,label:'CÔNG CỤ'},
  agent:{x:-113,y:-52,z:18,label:'BỘ ĐIỀU PHỐI'},plugins:{x:-21,y:-52,z:18,label:'CARTRIDGE'},
  memory:{x:65,y:-52,z:18,label:'BỘ NHỚ'},storage:{x:150,y:-63,z:-4,label:'LƯU TRỮ'},
  audit:{x:155,y:53,z:-4,label:'NHẬT KÝ'},ollama:{x:-91,y:-105,z:-4,label:'OLLAMA'},
};

export function buildMachine({audit=false}={}){
  const deck={x:-225,y:-138,w:450,d:260,r:15};
  const P=k.fitProjection(k.boxCorners(deck,-27,100),1000,650,{pad:38,azimuth:38,elevation:34});
  const R=A.recorder(P);let count=0;const bounds={};
  function b(id,x,y,w,d,z,h,tone='mid',o={}){
    const plan={x,y,w,d,r:Math.min(o.r??2,w/4,d/4)};const points=k.boxCorners(plan,z,z+h).map(p=>k.iso(p,P));
    if(id!=='stand'){const box=bounds[id]??{x:Infinity,y:Infinity,right:-Infinity,bottom:-Infinity};for(const [a,c]of points){box.x=Math.min(box.x,a);box.y=Math.min(box.y,c);box.right=Math.max(box.right,a);box.bottom=Math.max(box.bottom,c);}bounds[id]=box;}
    let inner='';
    if(o.seam)inner+=k.lineSvg(k.sideSeam(plan,z+h*.5,P,5),{tone:'lo'});
    if(o.border)inner+=k.lineSvg(k.planOutline(k.insetPlan(plan,2),z+h,P,5),{tone:'lo'});
    if(o.screws)inner+=k.dotsSvg(k.corners(plan,4).map(([a,c])=>k.iso([a,c,z+h],P)),{size:.6,tone:'mid'});
    if(o.slots)inner+=k.lineSvg(o.slots.map(p=>k.planOutline({...p,r:.6},z+h,P,3)).join(''),{tone:'lo'});
    if(o.name)inner+=k.faceTextSvg(k.topMatrix([x+w/2,y+d/2],z+h,P),o.name,{size:o.size||3,tone:'mid',anchor:'middle'});
    if(o.sheet)for(let j=0;j<6;j++)inner+=k.lineSvg(k.segment([x+7,y+d,z+h-8-j*5],[x+w-(j===5?18:7),y+d,z+h-8-j*5],P),{tone:'mid',free:true});
    if(o.paper&&h===1&&d>25)for(let j=0;j<4;j++)inner+=k.lineSvg(k.lineOnTop([x+8,y+8+j*5],[x+w-(j===3?20:8),y+8+j*5],z+h,P),{tone:'lo',free:true});
    if(o.vents)for(let j=0;j<15;j++)inner+=k.lineSvg(k.pathOf([[x+8+j*7,y+d,z+6],[x+10+j*7,y+d,z+6],[x+10+j*7,y+d,z+h-5],[x+8+j*7,y+d,z+h-5]].map(p=>k.iso(p,P)),true),{tone:'lo'});
    const name=`${id}.${++count}`;const shape=R.solid(A.slab(plan,z,h,{name},5));
    R.put({piece:id,at:[x+w/2,y+d/2,z+h/2],svg:`<g data-station="${id}" class="${o.shell?'machine-shell ':''}${o.paper?'machine-paper ':''}${o.ink?'machine-ink ':''}"${o.subject?' data-subject=""':''}>${k.solidSvg(k.slabOf(plan,z,h,P,5,.8),{tone,inner})}</g>`,shapes:[shape]});
  }
  // One plinth carries every functional compartment; there are no pedestals.
  for(const[x,y]of k.corners(deck,24))b('stand',x-9,y-9,18,18,-27,9,'lo',{r:4});
  b('stand',deck.x,deck.y,deck.w,deck.d,-18,14,'mid',{r:15,screws:true,shell:true});
  b('stand',-155,-78,265,150,-4,22,'hi',{r:9,shell:true,seam:true,vents:true});
  b('stand',-155,-78,265,7,18,34,'mid',{shell:true});
  b('stand',-155,65,265,7,18,15,'hi',{shell:true,seam:true});
  b('stand',-155,-71,7,136,18,28,'hi',{shell:true});
  b('stand',103,-71,7,136,18,14,'hi',{shell:true});
  b('stand',-139,107,280,7,-4,2,'lo',{name:'D E C L A W   /   L O C A L   D O C U M E N T   P R O C E S S O R',size:2.5});

  // Input tray and sheets visibly enter the left side of the scan chamber.
  b('workspace',-221,-41,66,82,-4,5,'mid',{border:true});
  for(const y of [-41,38])b('workspace',-221,y,66,3,1,10,'hi');
  b('workspace',-221,-38,3,76,1,7,'mid');
  b('workspace',-214,-36,50,1,1,52,'hi',{paper:true});
  b('workspace',-211,-34,48,1,1,50,'hi',{paper:true,sheet:true});
  for(let j=0;j<3;j++)b('workspace',-211+j,-29+j,53,56,1+j,1,'hi',{paper:true,border:j===2,subject:j===2});

  // Scan tunnel: broad bridge and read slit, directly seated on the main deck.
  b('documents',-145,-30,132,60,18,3,'mid',{border:true});
  for(const y of [-30,24])b('documents',-129,y,108,6,21,47,'hi',{shell:true,seam:true});
  b('documents',-129,-30,108,60,68,9,'hi',{r:6,shell:true,screws:true,subject:true});
  b('documents',-118,-20,86,40,77,1,'mid',{border:true,name:'DOCUMENT PIPELINE',size:3.6});
  b('documents',-99,-20,8,40,50,18,'lo',{ink:true});
  b('documents',-143,-18,100,36,21,1,'hi',{paper:true});

  // Screening tunnel with a narrow inspection window and quarantine receptacle.
  b('sanitizer',-10,-30,103,60,18,3,'mid',{border:true});
  for(const y of [-30,24])b('sanitizer',0,y,86,6,21,26,'hi',{shell:true});
  b('sanitizer',0,-30,86,60,47,8,'hi',{shell:true,r:5,seam:true,subject:true});
  b('sanitizer',12,-17,62,34,55,1,'lo',{ink:true,border:true,name:'CONTENT FILTER',size:3.8});

  // Approval gate sits in the exit, then a tray catches the result.
  b('approval',110,-30,32,60,-4,22,'mid',{border:true});
  for(const y of [-30,24])b('approval',113,y,22,6,18,26,'hi',{shell:true});
  b('approval',113,-30,22,60,44,6,'hi',{subject:true,shell:true,screws:true});
  b('approval',118,-18,12,36,18,5,'mid',{border:true});
  b('stand',142,-36,75,72,-4,5,'mid',{border:true});
  for(const y of [-36,33])b('stand',142,y,75,3,1,8,'hi');
  b('stand',150,-24,59,48,1,1,'hi',{paper:true});

  // Console and keys are built into the front fascia of the same chassis.
  b('cli',-153,74,67,30,-4,12,'mid',{shell:true,seam:true});
  b('cli',-147,78,55,22,8,1,'lo',{ink:true,subject:true,border:true,name:'> DeClaw_',size:4});
  b('tools',-76,74,91,30,-4,12,'mid',{shell:true,seam:true});
  for(let j=0;j<4;j++)b('tools',-67+j*19,81,14,13,8,3,'mid',{subject:j===0,border:true});

  // Controller, cartridge and memory bays share the back spine.
  b('agent',-144,-70,66,34,18,4,'mid',{border:true,screws:true});
  b('agent',-135,-64,48,22,22,13,'lo',{subject:true,ink:true});
  for(let j=0;j<4;j++)b('agent',-131+j*11,-62,5,18,35,5,'mid');
  b('plugins',-72,-70,76,34,18,4,'mid',{border:true});
  for(const x of [-68,-4])b('plugins',x,-67,4,28,22,19,'hi',{shell:true});
  b('plugins',-60,-64,52,22,22,31,'hi',{shell:true,seam:true,subject:true,screws:true});
  b('plugins',-52,-60,36,14,53,1,'mid',{name:'doc-intel',size:3.5});
  b('memory',14,-70,83,34,18,4,'mid',{border:true,screws:true});
  for(let j=0;j<2;j++)b('memory',23+j*34,-64,26,21,22,9,'lo',{subject:j===0,ink:true,border:true});

  // Rear external model dock and storage sidecar; process boundaries are in text.
  b('ollama',-143,-127,144,43,-4,26,'mid',{shell:true,r:6,seam:true,screws:true});
  for(let j=0;j<3;j++)b('ollama',-133+j*43,-119,34,26,22,3,'lo',{ink:true,border:true,subject:j===0,name:['CHAT','EMBED','CLASSIFY'][j],size:3});
  b('storage',116,-100,94,62,-4,13,'mid',{shell:true,seam:true,screws:true});
  for(let j=0;j<2;j++){
    b('storage',123,-92+j*25,80,21,9,8,'lo',{ink:true,border:true,subject:j===0});
    b('storage',191,-87+j*25,8,11,17,2,'mid');
  }
  b('audit',122,47,84,52,-4,12,'hi',{shell:true,border:true,screws:true});
  b('audit',132,55,64,28,8,3,'mid',{border:true});
  b('audit',139,59,50,35,11,1,'hi',{paper:true,subject:true,border:true});
  b('audit',132,51,64,4,8,18,'mid',{seam:true});
  b('audit',157,55,13,8,12,5,'lo',{ink:true});

  A.settle(R,P,{states:[0],step:.65});R.items.sort((a,b)=>a.key-b.key);
  if(audit)A.auditOrExit(R,P,{apart:false,frames:[0]});
  const content=[`<path class="iso-halo" d="${k.haloOf(deck,-27,14,P)}"/>`,...R.items.map(i=>i.svg)];
  const body=content.join('');
  const svg=k.figureSvg({width:1000,height:650,label:'Máy xử lý hồ sơ DeClaw: khay nạp giấy, buồng quét, bộ lọc, chốt duyệt và khay kết quả; bấm một khoang để phóng to và mở lớp bên trong.',body});
  return{svg,body,P,bounds,parts:count,layout};
}
