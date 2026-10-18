import {test} from 'node:test';
import assert from 'node:assert/strict';
import {atlasSize,districts,landmark,connections,overviewNodes,overviewRoutes,interiorLayout} from '../map.mjs';
import {internals} from '../internals.mjs';
import {components} from '../model.mjs';
test('The atlas covers all responsibilities with distinct, meaningful landmarks',()=>{
  assert.deepEqual(new Set(Object.keys(districts)),new Set(components.map(c=>c.id)));
  assert.equal(new Set(Object.keys(districts).map(landmark)).size,12);
  assert.equal(connections.length,20);
  for(const e of connections){assert(districts[e.from]&&districts[e.to]);assert(e.label);}
});
test('Role-based positions and sizes preserve the input, coordination and document axes',()=>{
  const d=districts;
  assert.equal(d.cli.x,Math.min(...Object.values(d).map(n=>n.x)));
  assert.equal(d.agent.x+d.agent.w/2,atlasSize.w/2);
  assert(d.cli.x+d.cli.w<d.agent.x&&d.agent.x+d.agent.w<d.tools.x&&d.tools.x+d.tools.w<d.workspace.x);
  assert(d.documents.y>d.agent.y+d.agent.h);
  assert(d.ollama.y+d.ollama.h<d.agent.y&&d.memory.y+d.memory.h<d.agent.y);
  assert(d.agent.w*d.agent.h>d.cli.w*d.cli.h&&d.documents.w>d.storage.w);
  for(const a of overviewNodes){
    assert(a.x>=0&&a.y>=0&&a.x+a.w<=atlasSize.w&&a.y+a.h<=atlasSize.h);
    for(const b of overviewNodes)if(a.id!==b.id)assert(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,`${a.id} overlaps ${b.id}`);
  }
});
test('All 92 routes attach at visible ports, stay orthogonal and avoid cards',()=>{
  let count=0;
  for(const {nodes,routes}of [{nodes:overviewNodes,routes:overviewRoutes},...Object.values(internals).map(interiorLayout)]){
    for(const e of routes){
      count++;const from=nodes.find(n=>n.id===e.from),to=nodes.find(n=>n.id===e.to);
      const atSide=(p,n,side)=>side==='left'?p.x===n.x&&p.y>=n.y&&p.y<=n.y+n.h:side==='right'?p.x===n.x+n.w&&p.y>=n.y&&p.y<=n.y+n.h:side==='top'?p.y===n.y&&p.x>=n.x&&p.x<=n.x+n.w:p.y===n.y+n.h&&p.x>=n.x&&p.x<=n.x+n.w;
      assert(atSide(e.points[0],from,e.fromSide||'right'));assert(atSide(e.points.at(-1),to,e.toSide||'left'));
      for(let i=1;i<e.points.length;i++){
        const a=e.points[i-1],b=e.points[i];assert(a.x===b.x||a.y===b.y,`${e.id} is orthogonal`);
        for(const n of nodes){
          const cross=a.x===b.x?a.x>n.x&&a.x<n.x+n.w&&Math.max(a.y,b.y)>n.y&&Math.min(a.y,b.y)<n.y+n.h:a.y>n.y&&a.y<n.y+n.h&&Math.max(a.x,b.x)>n.x&&Math.min(a.x,b.x)<n.x+n.w;
          assert(!cross,`${e.id} crosses ${n.id}`);
        }
      }
    }
  }
  assert.equal(count,92);
});
