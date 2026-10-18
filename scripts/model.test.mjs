import { test } from 'node:test';
import assert from 'node:assert/strict';
import { components,journeySteps } from '../model.mjs';
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
