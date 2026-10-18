import { test } from 'node:test';
import assert from 'node:assert/strict';
import { components,journeySteps } from '../model.mjs';
import { internals,relationNames } from '../internals.mjs';
test('Denied writes cannot reach filesystem execution',()=>{
  const steps=journeySteps('write','deny');
  assert(!steps.some(s=>s.at==='workspace'));
  assert(steps.some(s=>s.at==='approval'));
  assert.equal(steps.at(-1).at,'agent');
});
test('Read and retrieval screen text before returning it to the agent',()=>{
  for(const flow of ['read','search']){
    const steps=journeySteps(flow,'unsafe');
    const filter=steps.findIndex(s=>s.at==='sanitizer');
    assert(filter>0);assert(steps[filter].title.includes('cách ly'));
    assert.equal(steps.at(-1).at,'agent');
    assert(steps.slice(filter+1).some(s=>s.at==='audit'));
  }
});
test('Index stores chunks before committing catalog and does not pre-classify corpus',()=>{
  const steps=journeySteps('index');
  assert(steps.findIndex(s=>s.at==='storage')<steps.findIndex(s=>s.title.includes('catalog sau')));
  assert(!steps.some(s=>s.at==='sanitizer'));
});
test('Every component and journey reference resolves',()=>{
  const ids=new Set(components.map(c=>c.id));assert.equal(ids.size,12);
  for(const c of components)for(const id of c.links)assert(ids.has(id));
  for(const flow of ['read','write','index','search'])for(const outcome of ['normal','deny','unsafe'])for(const step of journeySteps(flow,outcome))assert(ids.has(step.at));
});
test('Every compartment has a distinct source-backed internal graph',()=>{
  assert.deepEqual(new Set(Object.keys(internals)),new Set(components.map(c=>c.id)));
  assert.equal(Object.values(internals).reduce((sum,g)=>sum+g.nodes.length,0),76);
  for(const g of Object.values(internals)){
    const ids=new Set(g.nodes.map(n=>n.id));assert.equal(ids.size,g.nodes.length);
    assert(g.nodes.length>=6);assert(g.edges.length>=3);
    assert.equal(new Set(g.edges.map(e=>e.id)).size,g.edges.length);
    for(const n of g.nodes){assert(n.symbol&&n.role&&n.input&&n.output);assert(n.file.endsWith('.py'));assert(Number.isInteger(n.line)&&n.line>0);}
    for(const e of g.edges){assert(ids.has(e.from)&&ids.has(e.to));assert(relationNames[e.kind]);assert(e.label);}
  }
});
test('The denial branch terminates before execution, and plugin permission precedes worker calls',()=>{
  const gate=internals.approval.edges;
  assert(gate.some(e=>e.from==='gate'&&e.to==='run'&&e.kind==='branch'));
  assert(gate.some(e=>e.from==='gate'&&e.to==='deny'&&e.kind==='branch'));
  assert(!gate.some(e=>e.from==='deny'&&e.to==='run'));
  assert(internals.plugins.edges.some(e=>e.from==='host'&&e.to==='permission'));
  assert(internals.plugins.edges.some(e=>e.from==='host'&&e.to==='supervisor'&&e.kind==='branch'));
});
