import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const port=Number(process.env.PORT||4174);
createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(resolve(root)+sep)||file.includes(`${sep}.git${sep}`)){res.writeHead(403).end();return;}
    const content=await readFile(file);
    const type={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png'}[extname(file)]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'}).end(content);
  }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`DeClaw Anatomy: http://127.0.0.1:${port}`));
