import * as k from '../vendor/anatomy/iso-kit.mjs';
import * as A from '../vendor/anatomy/audit.mjs';
import { internals } from '../internals.mjs';

export function buildCutaways({audit=false,only=null}={}){
  const result={},sharedOrders=new Map();
  for(const [id,graph] of Object.entries(internals)){
    if(only&&id!==only)continue;
    const board={x:-220,y:-131,w:440,d:262,r:10};
    const P=k.fitProjection(k.boxCorners(board,-7,38),1000,650,{pad:48,azimuth:33,elevation:47});
    const R=A.recorder(P,{order:['cover']});let count=0,staticTop=-Infinity,coverBottom=null;
    function part(piece,plan,z,h,options={}){
      plan={...plan,r:plan.r??2};const name=`${piece}.${++count}`;
      if(piece==='cover')coverBottom=z;else staticTop=Math.max(staticTop,z+h);
      let inner='';
      if(options.border)inner+=k.lineSvg(k.planOutline(k.insetPlan(plan,3),z+h,P),{tone:'lo'});
      if(options.screws)inner+=k.dotsSvg(k.corners(plan,5).map(([x,y])=>k.iso([x,y,z+h],P)),{size:.7,tone:'mid'});
      if(options.text)inner+=k.faceTextSvg(k.topMatrix([plan.x+plan.w/2,plan.y+plan.d/2],z+h,P),options.text,{size:options.size||5,tone:'hi',anchor:'middle'});
      if(options.pins){
        const slots=[];for(let i=0;i<8;i++)for(const sign of [-1,1])slots.push(k.planOutline({x:plan.x+8+i*9,y:plan.y+(sign>0?plan.d-3:0),w:3,d:3,r:.3},z+h,P,2));
        inner+=k.lineSvg(slots.join(''),{tone:'mid'});
      }
      const move=piece==='cover'?[0,0,102]:undefined;
      const shapes=[R.solid(A.slab(plan,z,h,{name},6))];
      R.put({piece,move,at:[plan.x+plan.w/2,plan.y+plan.d/2,z+h/2],svg:k.solidSvg(k.slabOf(plan,z,h,P,6,.8),{tone:options.tone||'mid',inner}),shapes,node:options.node});
    }
    for(const[x,y]of k.corners(board,17))part('stand.foot',{x:x-6,y:y-6,w:12,d:12,r:3},-7,7,{tone:'lo'});
    part('stand.base',board,0,4,{border:true,screws:true});
    part('pcb',{x:-213,y:-124,w:426,d:248,r:7},4,3,{border:true,screws:true,tone:'lo'});
    for(const x of [-220,214])part('rim',{x,y:-131,w:6,d:262,r:1},4,26,{tone:'mid'});
    for(const y of [-131,125])part('rim',{x:-214,y,w:428,d:6,r:1},4,26,{tone:'mid'});
    const cols=graph.nodes.length>6?4:3;
    const gap=cols===4?100:132;
    const positions=graph.nodes.map((node,i)=>({x:(i%cols-(cols-1)/2)*gap,y:i<cols?-52:52}));
    const routes=[];
    graph.nodes.forEach((node,i)=>{
      const {x,y}=positions[i];
      part('chip',{x:x-43,y:y-22,w:86,d:44,r:3},7,10,{tone:'hi',border:true,pins:true,node:node.id,text:node.label,size:Math.min(5.6,112/node.label.length)});
    });
    graph.edges.forEach((edge,i)=>{
      const ai=graph.nodes.findIndex(n=>n.id===edge.from),bi=graph.nodes.findIndex(n=>n.id===edge.to);
      const a=positions[ai],b=positions[bi],offset=((i%5)-2)*6;
      let points;
      if(a.y===b.y){
        const sign=a.y<0?-1:1;const lane=sign*(89+i*2.5);
        points=[[a.x+offset,a.y+sign*22,7],[a.x+offset,lane,7],[b.x-offset,lane,7],[b.x-offset,b.y+sign*22,7]];
      }else{
        const lane=-16+(i%9)*4;
        points=[[a.x+offset,a.y-Math.sign(a.y)*22,7],[a.x+offset,lane,7],[b.x-offset,lane,7],[b.x-offset,b.y-Math.sign(b.y)*22,7]];
      }
      const d=k.pathOf(points.map(p=>k.iso(p,P)));
      const dots=k.dotsSvg([k.iso(points[0],P),k.iso(points.at(-1),P)],{size:2,tone:'mid'});
      // Traces are planar software annotations. A paper-colored under-stroke
      // makes crossings visibly insulated rather than suggesting a junction.
      routes.push(`<g class="trace" data-edge="${edge.id}" data-kind="${edge.kind}"><title>${edge.from} → ${edge.to}: ${edge.label}</title><path class="trace-insulator" d="${d}"/><path class="iso-line trace-line" d="${d}"/><path class="trace-pulse" d="${d}"/><path class="trace-hit" d="${d}"/>${dots}</g>`);
    });
    part('cover',{x:-220,y:-131,w:440,d:262,r:10},30,5,{tone:'hi',border:true,screws:true,text:`DeClaw / ${id.toUpperCase()}`,size:8});
    // For every interpolation share t in [0,1], the cover's lowest point is
    // 30 + 102*t, at or above every stationary part. Thus the whole continuous
    // opening/reversal trajectory is collision-free, beyond sampled poses.
    if(coverBottom<staticTop)throw new Error(`Cover intersects stationary geometry: ${id}`);
    const states=Array.from({length:9},(_,i)=>({label:`cover ${i}/8`,shares:{cover:i/8}}));
    const reused=!audit&&sharedOrders.get(graph.nodes.length);
    // Boards with equal node counts have identical recorded shapes/poses;
    // only text and schematic traces differ. Audit mode measures every board.
    if(reused)R.items.forEach((item,i)=>{item.key=reused[i];});
    else{A.settle(R,P,{states,step:.8});if(!audit)sharedOrders.set(graph.nodes.length,R.items.map(item=>item.key));}
    R.items.sort((a,b)=>a.key-b.key);
    if(audit){console.log(`\nCUTAWAY / ${id}`);A.auditOrExit(R,P,{apart:true,frames:Array.from({length:31},(_,i)=>({label:`cover ${i}/30`,shares:{cover:i/30}}))});}
    const body=[];let tracesAdded=false;
    for(const item of R.items){
      if(item.piece==='chip'&&!tracesAdded){body.push(`<g class="circuit-traces">${routes.join('')}</g>`);tracesAdded=true;}
      const meta=item.piece==='cover'?` data-cover="" data-k="${item.key}"`:item.node?` data-node="${item.node}"`:'';
      body.push(`<g class="board-item ${item.piece==='pcb'?'pcb':item.piece==='chip'?'chip':''}"${meta}>${item.svg}</g>`);
    }
    const shift=k.iso([0,0,102],P).map((v,i)=>v-k.iso([0,0,0],P)[i]);
    const svg=k.figureSvg({width:1000,height:650,label:`Bên trong ${id}: bấm một chip để xem class/hàm, bấm đường nối để xem quan hệ.`,body});
    result[id]={svg,coverShift:shift,parts:count,nodes:graph.nodes.length,edges:graph.edges.length,clearanceProof:{staticTop,coverBottom,lift:102}};
  }
  return result;
}
