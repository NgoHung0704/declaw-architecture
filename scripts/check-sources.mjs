import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {internals} from '../internals.mjs';
const root=process.argv[2];
if(!root)throw new Error('Usage: node scripts/check-sources.mjs /path/to/DeClaw');
const cache=new Map();const errors=[];let count=0;
function definitions(file){
  if(cache.has(file))return cache.get(file);
  const result=new Map(),stack=[];
  for(const [i,line]of readFileSync(resolve(root,file),'utf8').split(/\r?\n/).entries()){
    const match=line.match(/^(\s*)(?:(?:async\s+)?def|class)\s+(\w+)/);if(!match)continue;
    const indent=match[1].length;while(stack.length&&stack.at(-1).indent>=indent)stack.pop();
    stack.push({indent,name:match[2]});result.set(i+1,stack.map(s=>s.name).join('.'));
  }
  cache.set(file,result);return result;
}
for(const [id,g]of Object.entries(internals))for(const n of g.nodes){
  count++;const actual=definitions(n.file).get(n.line);
  if(actual!==n.symbol)errors.push({compartment:id,symbol:n.symbol,file:n.file,line:n.line,actual});
}
console.log(JSON.stringify({symbols:count,files:cache.size,errors},null,2));
if(errors.length)process.exitCode=1;
