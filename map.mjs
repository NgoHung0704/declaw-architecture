// A semantic, top-down atlas. Districts are software responsibilities, not services.
export const atlasSize={x:0,y:0,w:1640,h:1040};
export const districts={
  memory:{col:0,row:0,name:'Memory',sub:'Bộ nhớ & két khóa',color:'#997235',icon:'memory',verbs:['Lưu ngữ cảnh','Tìm ký ức','Giữ khóa']},
  ollama:{col:1,row:0,name:'Ollama',sub:'Dịch vụ mô hình riêng',color:'#8b63b5',icon:'model',verbs:['Chat','Embedding','Classifier']},
  sanitizer:{col:2,row:0,name:'Sanitizer',sub:'Sàng lọc nội dung',color:'#30846f',icon:'shield',verbs:['Kiểm tra','Giữ phần an toàn','Cách ly']},
  approval:{col:3,row:0,name:'Approval',sub:'Người dùng quyết định',color:'#b97935',icon:'gate',verbs:['Xem đề xuất','Cho phép','Từ chối']},
  cli:{col:0,row:1,name:'CLI / REPL',sub:'Cửa vào của người dùng',color:'#527795',icon:'terminal',verbs:['Nhận lệnh','Lắp phiên','Hiện kết quả']},
  agent:{col:1,row:1,name:'Brain',sub:'Agent loop · LangGraph',color:'#ba6558',icon:'brain',verbs:['Suy luận','Chọn công cụ','Quan sát & lặp']},
  tools:{col:2,row:1,name:'Tools',sub:'Công cụ có schema',color:'#4d819b',icon:'tools',verbs:['Validate args','Chọn wrapper','Thực thi tool']},
  workspace:{col:3,row:1,name:'Workspace',sub:'Tệp trong phạm vi cho phép',color:'#8a833e',icon:'folder',verbs:['Đọc / liệt kê','Ghi / di chuyển','Kiểm tra path']},
  storage:{col:0,row:2,name:'Storage',sub:'SQLite + ChromaDB',color:'#7b77a8',icon:'database',verbs:['Bản ghi SQL','Vector search','Text mã hóa']},
  documents:{col:1,row:2,name:'Documents',sub:'Lập chỉ mục & truy hồi',color:'#4d8c9a',icon:'documents',verbs:['Parse & chunk','Index','Search & cite']},
  plugins:{col:2,row:2,name:'Plugins',sub:'Host + worker riêng',color:'#9b7195',icon:'plug',verbs:['Kiểm tra quyền','NDJSON / stdio','Parse tài liệu']},
  audit:{col:3,row:2,name:'Audit',sub:'Nhật ký & HTTP observer',color:'#7b8072',icon:'ledger',verbs:['Ghi sự kiện','Quan sát httpx','Xuất báo cáo']},
};
export const districtBox=id=>({x:60+districts[id].col*400,y:90+districts[id].row*320,w:320,h:230});
const link=(from,to,label,kind='call',main=false)=>({id:`${from}-${to}`,from,to,label,kind,main});
export const connections=[
  link('cli','agent','Lượt chat → graph','call',true),
  link('cli','documents','Lắp stack / chạy index','construct'),
  link('cli','plugins','Load plugin trong phiên','construct'),
  link('agent','ollama','Messages → AIMessage','call',true),
  link('agent','tools','Tool calls → observations','call',true),
  link('tools','approval','Non-READ → xác nhận','branch',true),
  link('tools','workspace','Chạy tool filesystem','call',true),
  link('tools','documents','document_search','call',true),
  link('tools','sanitizer','READ có nội dung ngoài','branch'),
  link('tools','audit','Wrapper ghi tool event','data'),
  link('documents','plugins','parse → citable chunks','call',true),
  link('documents','storage','Chunks / vectors / catalog','data',true),
  link('documents','ollama','Embedding tài liệu & query','call'),
  link('documents','sanitizer','Top-k → safe hits','call',true),
  link('sanitizer','ollama','Phiên classifier riêng','call'),
  link('sanitizer','audit','Quarantine event','data'),
  link('memory','ollama','Embedding ký ức','call'),
  link('memory','storage','Episodes / semantic records','data'),
  link('audit','storage','Audit events → SQLite','data'),
  link('plugins','tools','Tool capabilities qua host','construct'),
];
export const escapeXML=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function textLines(s,max=28,limit=3){
  const lines=[];let line='';
  for(const word of String(s).split(/\s+/)){if((line+' '+word).trim().length>max&&line){lines.push(line);line=word;}else line=(line+' '+word).trim();}
  if(line)lines.push(line);
  if(lines.length>limit){lines.length=limit;lines[limit-1]=lines[limit-1].replace(/[.,;:]$/,'')+'…';}
  return lines;
}
const label=(s,x,y,cls,max=28,limit=3,leading=22)=>`<text x="${x}" y="${y}" class="${cls}">${textLines(s,max,limit).map((l,i)=>`<tspan x="${x}" dy="${i?leading:0}">${escapeXML(l)}</tspan>`).join('')}</text>`;

// Hand-drawn functional landmarks. Each silhouette encodes the component's job.
export function landmark(id){
  const art={
    brain:`<path class="tint" d="M65 112C41 123 16 107 23 84C5 73 15 47 31 43C30 20 54 9 68 25C83 9 107 18 108 39C132 44 135 68 120 83C130 102 108 120 88 111L77 123Z"/><path d="M69 27V105M44 32C32 46 52 51 49 66S29 77 34 94M97 32C111 50 87 51 91 68S112 79 106 96M49 66L69 58L91 68M69 85L49 93M69 85L91 96"/><circle cx="69" cy="58" r="5"/><circle cx="49" cy="66" r="4"/><circle cx="91" cy="68" r="4"/><circle cx="69" cy="85" r="4"/>`,
    memory:`<rect class="tint" x="15" y="22" width="76" height="91" rx="9"/><path d="M15 52H91M15 82H91M40 37H65M40 67H65M40 97H65"/><rect class="paper" x="77" y="63" width="52" height="52" rx="8"/><path d="M89 64V54A14 14 0 0 1 117 54V64"/><circle cx="103" cy="87" r="6"/><path d="M103 93V103"/>`,
    terminal:`<rect class="tint" x="10" y="20" width="122" height="87" rx="10"/><path d="M10 40H132"/><circle cx="23" cy="30" r="2"/><circle cx="33" cy="30" r="2"/><path d="M28 57L42 69L28 81M52 82H78M45 119H99M71 108V119"/><path class="signal" d="M94 65H114M105 57L114 65L105 73"/>`,
    tools:`<path class="tint" d="M31 24C13 29 11 51 27 61L73 108A13 13 0 0 0 91 90L44 44L46 22L35 35L26 32Z"/><path class="paper" d="M95 23L112 25L123 39L103 60L96 55L59 99L47 89L86 48L82 41Z"/><circle cx="82" cy="99" r="4"/><path d="M55 96L66 83M100 30L113 41"/>`,
    documents:`<path class="paper" d="M25 14H79L101 36V98H25Z"/><path d="M79 14V36H101M40 48H82M40 60H74"/><rect class="tint" x="14" y="70" width="111" height="42" rx="9"/><path d="M30 83H109M37 94H52M64 94H79M91 94H106"/><path class="paper" d="M42 102H98V128H42Z"/><path d="M52 113H87M52 120H78"/>`,
    shield:`<path class="tint" d="M70 15L116 33V65C116 92 94 110 70 120C46 110 24 92 24 65V33Z"/><path d="M43 42H97L79 66V83L62 93V66Z"/><path class="signal" d="M50 104L60 113L80 93"/><path d="M7 48H17M4 64H17M123 54H137M123 72H137"/>`,
    gate:`<rect class="tint" x="15" y="67" width="29" height="54" rx="5"/><rect class="tint" x="106" y="67" width="22" height="54" rx="5"/><path d="M31 68V44"/><rect class="paper" x="23" y="35" width="96" height="15" rx="5"/><path d="M38 36L50 49M60 36L72 49M82 36L94 49"/><circle class="paper" cx="76" cy="85" r="23"/><path class="signal" d="M64 85L72 93L89 76"/><path d="M25 89H34M67 120H88"/>`,
    folder:`<path class="tint" d="M12 42V29Q12 22 22 22H56L68 36H121Q131 36 131 46V108H12Z"/><path class="paper" d="M40 41H90L108 59V105H40Z"/><path d="M90 41V59H108M51 69H93M51 80H88"/><path class="tint" d="M12 70H133L122 116H22Z"/><path d="M55 90H91"/>`,
    database:`<ellipse class="tint" cx="48" cy="30" rx="33" ry="14"/><path class="tint" d="M15 30V94C15 113 81 113 81 94V30C81 49 15 49 15 30Z"/><path d="M15 59C15 78 81 78 81 59M15 85C15 104 81 104 81 85"/><rect class="paper" x="80" y="67" width="52" height="49" rx="7"/><circle cx="92" cy="80" r="3"/><circle cx="119" cy="81" r="3"/><circle cx="106" cy="103" r="3"/><path d="M94 81L104 100L118 83M95 80H115"/>`,
    model:`<rect class="tint" x="29" y="26" width="87" height="84" rx="13"/><path d="M45 14V26M63 14V26M82 14V26M101 14V26M45 110V124M64 110V124M83 110V124M102 110V124M16 43H29M16 65H29M16 87H29M116 43H130M116 65H130M116 87H130"/><circle cx="50" cy="51" r="6"/><circle cx="50" cy="87" r="6"/><circle cx="92" cy="68" r="8"/><path d="M56 52L84 65M56 85L84 71M50 57V81"/><path d="M68 39H96M68 98H96"/>`,
    plug:`<rect class="tint" x="14" y="24" width="71" height="94" rx="9"/><path d="M27 42H55M27 54H66M27 67H55M27 80H49"/><path class="paper" d="M77 57H123V75C123 91 114 99 100 99S77 91 77 75Z"/><path d="M88 57V38M112 57V38M100 99V113Q100 126 84 126H64"/><path d="M29 103H42M51 103H65"/>`,
    ledger:`<path class="tint" d="M27 16H111V124L101 118L90 124L79 118L68 124L57 118L46 124L35 118L27 124Z"/><path d="M43 33H93M43 47H84M43 61H93M43 101H93"/><path class="signal" d="M16 84H44L52 70L64 97L75 79H123"/>`,
  };
  return `<g class="landmark" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${art[districts[id].icon]}</g>`;
}

function collision(a,b,r){
  if(a.x===b.x)return a.x>r.x&&a.x<r.x+r.w&&Math.max(a.y,b.y)>r.y&&Math.min(a.y,b.y)<r.y+r.h;
  return a.y>r.y&&a.y<r.y+r.h&&Math.max(a.x,b.x)>r.x&&Math.min(a.x,b.x)<r.x+r.w;
}
// Orthogonal visibility routing keeps every wire out of unrelated nodes.
export function routeGraph(nodes,edges){
  const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
  return edges.map((edge,i)=>{
    const a=byId[edge.from],b=byId[edge.to],margin=20+(i%5)*5;
    const start={x:a.x+a.w,y:a.y+a.h/2},end={x:b.x,y:b.y+b.h/2};
    const p={x:start.x+margin,y:start.y},q={x:end.x-margin,y:end.y};
    const obstacles=nodes.map(n=>({x:n.x-10,y:n.y-10,w:n.w+20,h:n.h+20}));
    const xs=[...new Set([p.x,q.x,...nodes.flatMap(n=>[n.x-margin,n.x+n.w+margin])])].sort((a,b)=>a-b);
    const ys=[...new Set([p.y,q.y,...nodes.flatMap(n=>[n.y-margin,n.y+n.h+margin])])].sort((a,b)=>a-b);
    const points=xs.flatMap(x=>ys.map(y=>({x,y})));
    const valid=pt=>!obstacles.some(r=>pt.x>r.x&&pt.x<r.x+r.w&&pt.y>r.y&&pt.y<r.y+r.h);
    const si=points.findIndex(v=>v.x===p.x&&v.y===p.y),ti=points.findIndex(v=>v.x===q.x&&v.y===q.y);
    const queue=[{i:si,dir:0,cost:0,path:[p]}],best=new Map();let found;
    while(queue.length){
      queue.sort((a,b)=>a.cost-b.cost);const cur=queue.shift();
      const key=cur.i+':'+cur.dir;if(best.has(key)&&best.get(key)<=cur.cost)continue;best.set(key,cur.cost);
      if(cur.i===ti){found=cur.path;break;}
      const x=Math.floor(cur.i/ys.length),y=cur.i%ys.length,from=points[cur.i];
      for(const [nx,ny,dir] of [[x+1,y,1],[x-1,y,1],[x,y+1,2],[x,y-1,2]]){
        if(nx<0||ny<0||nx>=xs.length||ny>=ys.length)continue;
        const ni=nx*ys.length+ny,to=points[ni];if(!valid(to)||obstacles.some(r=>collision(from,to,r)))continue;
        const cost=cur.cost+Math.abs(from.x-to.x)+Math.abs(from.y-to.y)+(cur.dir&&cur.dir!==dir?35:0);
        if(!best.has(ni+':'+dir)||best.get(ni+':'+dir)>cost)queue.push({i:ni,dir,cost,path:[...cur.path,to]});
      }
    }
    if(!found)throw new Error('No unobstructed route for '+edge.id);
    const raw=[start,...found,end],pointsClean=raw.filter((v,j)=>!j||j===raw.length-1||!((raw[j-1].x===v.x&&v.x===raw[j+1].x)||(raw[j-1].y===v.y&&v.y===raw[j+1].y)));
    return {...edge,points:pointsClean,d:pointsClean.map((p,j)=>`${j?'L':'M'}${p.x} ${p.y}`).join(' ')};
  });
}
export const overviewNodes=Object.keys(districts).map(id=>({id,...districtBox(id)}));
export const overviewRoutes=routeGraph(overviewNodes,connections);
const wireMarkup=(routes,cls)=>routes.map(e=>`<g class="wire ${cls} kind-${e.kind}${e.main?' primary':''}" data-wire="${e.id}" data-from="${e.from}" data-to="${e.to}" role="button" tabindex="-1" aria-label="${escapeXML(e.label)}"><path class="wire-hit" d="${e.d}"/><path class="wire-line" d="${e.d}" marker-end="url(#arrow)"/><title>${escapeXML(e.label)}</title></g>`).join('');
export function overviewSVG(counts){
  return `<rect class="map-ground" width="1640" height="1040"/><path class="map-grid" d="M0 370H1640M0 690H1640M420 0V1040M820 0V1040M1220 0V1040"/>
  <text class="map-caption" x="60" y="40">DECLAW / BẢN ĐỒ CHỨC NĂNG</text><text class="map-note" x="1580" y="40" text-anchor="end">MŨI TÊN = CHIỀU YÊU CẦU / DỮ LIỆU</text>
  ${wireMarkup(overviewRoutes,'overview-wire')}
  ${Object.entries(districts).map(([id,d])=>{const b=districtBox(id);return `<g class="district" data-district="${id}" transform="translate(${b.x} ${b.y})" style="--zone:${d.color}" role="button" tabindex="0" aria-label="Khám phá ${d.name}"><rect class="district-shadow" x="0" y="7" width="320" height="230" rx="18"/><rect class="district-land" width="320" height="230" rx="18"/><path class="district-topline" d="M24 2H296"/><text class="district-name" x="24" y="39">${d.name}</text><text class="district-sub" x="24" y="64">${d.sub}</text><g transform="translate(19 77) scale(.88)">${landmark(id)}</g>${d.verbs.map((v,i)=>`<text class="district-verb" x="157" y="111" dy="${i*25}">${v}</text>`).join('')}<path class="district-divider" d="M24 192H296"/><text class="district-count" x="24" y="215">${counts[id]} hàm / class</text><text class="district-open" x="296" y="215" text-anchor="end">Khám phá ↗</text><circle class="port in-port" cx="0" cy="115" r="5"/><circle class="port out-port" cx="320" cy="115" r="5"/></g>`;}).join('')}
  <text class="map-note" x="60" y="1016">Các khu = trách nhiệm phần mềm. Lõi Python dùng chung tiến trình; Ollama và worker plugin chạy riêng.</text>`;
}
export function interiorLayout(graph){
  const cols=graph.nodes.length>6?4:3,w=cols===4?300:360;
  const nodes=graph.nodes.map((n,i)=>({...n,x:80+(i%cols)*(cols===4?400:600),y:255+Math.floor(i/cols)*350,w,h:240}));
  return {nodes,routes:routeGraph(nodes,graph.edges),box:{x:0,y:0,w:1800,h:1040}};
}
export function interiorSVG(id,graph,component){
  const d=districts[id],layout=interiorLayout(graph);
  return `<rect class="interior-ground" x="0" y="0" width="1800" height="1040" rx="22"/>
  <g transform="translate(35 22) scale(.6)">${landmark(id)}</g><text class="interior-title" x="135" y="62">${d.name} / bên trong</text><text class="interior-subtitle" x="135" y="96">${escapeXML(graph.title)}</text>
  <rect class="io-band input-band" x="40" y="135" width="1720" height="77" rx="13"/><text class="io-band-label" x="62" y="166">↓ ĐẦU VÀO CỦA KHU</text>${label(component.input,350,168,'io-band-text',96,2,23)}
  ${wireMarkup(layout.routes,'internal-wire')}
  ${layout.nodes.map(n=>`<g class="symbol" data-node="${n.id}" transform="translate(${n.x} ${n.y})" role="button" tabindex="0" aria-label="${escapeXML(n.symbol)}"><rect class="symbol-shadow" y="5" width="${n.w}" height="${n.h}" rx="14"/><rect class="symbol-body" width="${n.w}" height="${n.h}" rx="14"/><text class="symbol-type" x="22" y="29">${'SOURCE / SYMBOL'}</text>${label(n.label,22,61,'symbol-name',Math.floor(n.w/12),2,26)}${label(n.role,22,101,'symbol-role',Math.floor((n.w-44)/8.4),2,21)}<path class="symbol-divider" d="M20 141H${n.w-20}"/><text class="symbol-io-label" x="21" y="162">IN</text>${label(n.input,57,162,'symbol-io',Math.floor((n.w-79)/7.2),1,18)}<text class="symbol-io-label" x="21" y="193">OUT</text>${label(n.output,57,193,'symbol-io',Math.floor((n.w-79)/7.2),1,18)}<text class="symbol-source" x="22" y="222">${escapeXML(n.file.split('/').at(-1))}:${n.line} ↗</text><circle class="port in-port" cx="0" cy="120" r="6"/><circle class="port out-port" cx="${n.w}" cy="120" r="6"/></g>`).join('')}
  <rect class="io-band output-band" x="40" y="901" width="1720" height="77" rx="13"/><text class="io-band-label" x="62" y="934">↓ ĐẦU RA CỦA KHU</text>${label(component.output,350,934,'io-band-text',96,2,23)}
  <text class="map-note" x="40" y="1017">Mỗi nút có cổng IN bên trái / OUT bên phải. Chọn một đường để xem loại quan hệ và hai đầu nối.</text>`;
}
