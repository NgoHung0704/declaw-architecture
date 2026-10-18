import {test} from 'node:test';
import assert from 'node:assert/strict';
import {districts,landmark,connections,overviewNodes,overviewRoutes,interiorLayout} from '../map.mjs';
import {internals} from '../internals.mjs';
import {components} from '../model.mjs';
test('The atlas covers all responsibilities with distinct, meaningful landmarks',()=>{
  assert.deepEqual(new Set(Object.keys(districts)),new Set(components.map(c=>c.id)));
  assert.equal(new Set(Object.keys(districts).map(landmark)).size,12);
  assert.equal(connections.length,20);
  for(const e of connections){assert(districts[e.from]&&districts[e.to]);assert(e.label);}
});
test('All 92 routes attach OUT to IN, stay orthogonal and avoid unrelated cards',()=>{
  let count=0;
  for(const {nodes,routes}of [{nodes:overviewNodes,routes:overviewRoutes},...Object.values(internals).map(interiorLayout)]){
    for(const e of routes){
      count++;const from=nodes.find(n=>n.id===e.from),to=nodes.find(n=>n.id===e.to);
      assert.deepEqual(e.points[0],{x:from.x+from.w,y:from.y+from.h/2});assert.deepEqual(e.points.at(-1),{x:to.x,y:to.y+to.h/2});
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
