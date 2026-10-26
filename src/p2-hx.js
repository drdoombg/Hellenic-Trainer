/* ===== shared practice data for all three apps ===== */
window.HX=(function(){
const KEY='hellenic-suite-v1',TKEY='hellenic-suite-tasks';
const p2=n=>String(n).padStart(2,'0');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const T0=new Date();T0.setHours(0,0,0,0);
const dOff=(n,b)=>{const d=new Date(b||T0);d.setDate(d.getDate()+n);return d};
const iso=d=>d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());
const fromIso=s=>{const a=String(s).slice(0,10).split('-').map(Number);return new Date(a[0],a[1]-1,a[2])};
const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONL=['January','February','March','April','May','June','July','August','September','October','November','December'];
const uk=(s,long)=>{const d=typeof s==='string'?fromIso(s):s;return p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+(long?d.getFullYear():String(d.getFullYear()).slice(2))};
const lab=s=>{const d=typeof s==='string'?fromIso(s):s;return p2(d.getDate())+MON[d.getMonth()]+String(d.getFullYear()).slice(2)};
const ymd=s=>{const d=typeof s==='string'?fromIso(s):s;return String(d.getFullYear()).slice(2)+p2(d.getMonth()+1)+p2(d.getDate())};
function mod10(s){const d=s.replace(/\D/g,'').split('').reverse();let t=0;d.forEach((c,i)=>t+=(+c)*(i%2===0?3:1));return String((10-t%10)%10)}
function gtinFor(plu){const b='0500000'+String(plu).padStart(6,'0');return b+mod10(b)}

/* ---- label formats: element = {t:'text'|'bc'|'box', x,y mm, s size mm, b bold, v template, w,h mm} ---- */
function seedFormats(){
  const MS=[
    {t:'text',x:4,y:3,s:2,v:'SUPPLIER'},
    {t:'text',x:4,y:6,s:5,b:1,v:'{supplier}'},
    {t:'bc',x:30,y:3,w:72,h:6.5,v:'{serial}'},
    {t:'text',x:40,y:10.2,s:1.7,v:'{serial}'},
    {t:'text',x:4,y:13.5,s:5.4,b:1,v:'{name}'},
    {t:'text',x:4,y:20.5,s:4.4,b:1,v:'{t1}\n{t2}'},
    {t:'text',x:4,y:31,s:2,v:'TPND: {tpnd}'},
    {t:'text',x:38,y:31,s:2,v:'{twa}'},
    {t:'text',x:68,y:31,s:2,v:'Tare  {tare} KG'},
    {t:'bc',x:4,y:34,w:92,h:22,v:'{gs1}'},
    {t:'text',x:6,y:56.6,s:2,v:'{hri}'},
    {t:'text',x:4,y:60,s:4.6,b:1,v:'KEEP REFRIGERATED AT -2C TO 4C'},
    {t:'text',x:4,y:66.5,s:1.6,v:'2 SISTERS FOOD GROUP, FOXHILLS IND ESTATE, SCUNTHORPE, DN15 8QW'},
    {t:'text',x:112,y:3,s:2,v:'USE BY'},
    {t:'text',x:112,y:6,s:6,b:1,v:'{useby}'},
    {t:'text',x:120,y:13.5,s:2,v:'PACK TIME:'},
    {t:'text',x:124,y:16.2,s:2.4,v:'{pack}'},
    {t:'text',x:104,y:26,s:2.4,v:'Net'},
    {t:'text',x:112,y:22.5,s:6,b:1,v:'{net}'},
    {t:'text',x:137,y:26,s:2.4,v:'KG'},
    {t:'text',x:100,y:35,s:3.6,b:1,v:'{t3}\n{t4}'},
    {t:'text',x:100,y:46,s:3.6,b:1,v:'{t5}'},
    {t:'text',x:100,y:51,s:3.6,b:1,v:'{t6}'}];
  const GEN=[
    {t:'text',x:4,y:4,s:6,b:1,v:'{name}'},
    {t:'text',x:4,y:13,s:3,v:'PLU {plu}   FO {fo}   LOT {lot}'},
    {t:'bc',x:4,y:20,w:96,h:24,v:'{gs1}'},
    {t:'text',x:6,y:45,s:2,v:'{hri}'},
    {t:'text',x:4,y:52,s:4,b:1,v:'KEEP REFRIGERATED AT -2C TO 4C'},
    {t:'text',x:108,y:4,s:2,v:'USE BY'},
    {t:'text',x:108,y:7,s:6,b:1,v:'{useby}'},
    {t:'text',x:108,y:20,s:2.4,v:'Net'},
    {t:'text',x:116,y:17,s:6,b:1,v:'{net}'},
    {t:'text',x:140,y:20,s:2.4,v:'KG'},
    {t:'box',x:2,y:2,w:146,h:76}];
  return {
    'MS-CASE':{id:'MS-CASE',name:'M&S case label',w:150,h:80,ver:3,els:MS,from:'photo'},
    'GEN-CASE':{id:'GEN-CASE',name:'Generic case label',w:150,h:80,ver:1,els:GEN,from:'assumed'}};
}
function seedProducts(){
  const P={};
  const add=o=>{P[o.plu]=Object.assign({plu:'',code:'',desc:'',label:'',supplier:'SC0242',gtin:gtinFor(o.plu),tpnd:'',twa:'TWA GB 2037',t:['','','','','',''],tare:2.44,min:5,max:15,life:10,fmt:'GEN-CASE',sub:'',src:'assumed'},o)};
  add({plu:'9980',code:'37C3T9R',desc:'THETFORD DRUM FLL UNCAL X15KG HWC 100%',label:'CHICKEN DRUMSTICKS HWC',gtin:'05063942535479',tpnd:'49786049',t:['X02','X01','X05','X06','TWA, RTA, M&S W','1KG X8 PER CASE'],fmt:'MS-CASE',src:'photo'});
  add({plu:'6759',code:'1CWB583A',desc:'OCADO M&S PSO RB WB 2.458KG X2 HWC',label:'M&S PSO RB WB 2.458KG X2',t:['X02','X01','','','OCADO, M&S W','2.458KG X2 PER CASE'],tare:0.6,min:4.5,max:5.5,life:9,fmt:'MS-CASE',src:'photo'});
  add({plu:'6756',code:'1CWB144A',desc:'OCADO M&S GARLIC&HERB RB WB 1.395KGX4 HV',label:'M&S GARLIC&HERB RB WB 1.395KG X4',t:['X02','X01','','','OCADO, M&S W','1.395KG X4 PER CASE'],tare:0.6,min:5.2,max:6.0,life:9,fmt:'MS-CASE',src:'photo'});
  add({plu:'6758',code:'1CWB649A',desc:'OCADO M&S ROTISSERIE RB 1.55KG X4 HWC',label:'M&S ROTISSERIE RB 1.55KG X4',t:['X02','X01','','','OCADO, M&S W','1.55KG X4 PER CASE'],tare:0.6,min:5.8,max:6.6,life:9,fmt:'MS-CASE',src:'photo'});
  [['7333','742'],['7335','924'],['6154','5835'],['6149','2892'],['6155','2149'],['3285','6245'],['3457','7381']].forEach(([plu,sub])=>
    add({plu,code:'—',desc:'PRODUCT '+plu+' (name not captured)',label:'PRODUCT '+plu,sub,src:'hotkey photo'}));
  return P;
}
/* ---- factory orders for the photographed day (FOPS 8 photo, 24 Oct 2026) ---- */
const ROWS=[
 ['091936',3,'DESP','TESCO RETAIL SUN','TS SU',2001,1660,25615.40,21929.50,-2,-2,'act'],
 ['091937',3,'DESP','CWS SUN','CWS SU',7377,6893,24532.32,30614.02,-2,-2,'act'],
 ['091938',3,'WIP','ICELAND SUN','ICELAND SU',180,204,783.60,888.00,-2,-2,''],
 ['091939',3,'WIP','ALDI SUN','ALDI SU',1482,1286,6984.10,6467.91,-2,-2,''],
 ['091940',3,'DESP','OCADO SUNDAY','OCADO SU',1,0,9.60,0,0,0,''],
 ['091941',3,'DESP','DERBY SUN','DERBY SU',15,0,225.00,0,0,0,''],
 ['091942',3,'DESP','THETFORD SUN','THET SU',11,0,165.00,0,-2,0,''],
 ['091943',3,'DESP','B/HAM SUN','BHAM SU',110,29,2105.00,543.48,0,0,''],
 ['091944',3,'DESP','AV CUTTING TFR SUN','TFR VA SU',0,0,0,0,0,0,''],
 ['091945',3,'HOLD','BULK PORTIONS SUN','BULK SUN',0,0,0,0,0,0,''],
 ['091946',3,'HOLD','WASTE SATURDAY','WASTE SAT',0,0,0,0,0,0,''],
 ['091947',3,'HOLD','BULK PLT SATURDAY','BULK PLT S',0,0,0,0,0,0,''],
 ['091948',3,'HOLD','BULK WB SATURDAY','BULK WB SA',24,0,15480.00,0,0,0,''],
 ['091972',7,'HOLD','BULK PORTIONS SUN','BULK SUN',0,0,0,0,0,0,''],
 ['091973',7,'HOLD','BUTCHERY SUNDAY','BUTSU',0,0,0,0,0,0,''],
 ['091987',1,'COMP','COSTCO SAT','COSTCO S',90,88,1034.40,969.20,0,0,'act'],
 ['091988',1,'COMP','TESCO FURTHER PRO SAT','TESCO FPSA',963,963,11877.20,10908.10,-3,0,'Act'],
 ['091989',1,'COMP','CWS SAT','CWS S',1584,1634,15546.64,16012.28,0,0,''],
 ['091990',1,'HOLD','WHOLESALE SAT KILL','WS SAT KIL',0,0,0,0,0,0,''],
 ['091991',1,'COMP','ICELAND SAT','ICELAND S',5,0,33.00,0,0,0,'Actual'],
 ['091992',1,'COMP','OCADO SATURDAY','OCADO S',1428,1468,8794.91,9403.24,0,0,''],
 ['091993',1,'HOLD','BULK WB SATURDAY','BULK WB SA',0,0,0,0,0,0,''],
 ['091994',1,'COMP','M and S Sat','M & S S',3302,3297,19392.54,20887.34,0,0,'Actual'],
 ['091995',1,'COMP','ASDA SAT','ASDA S',1248,1245,8040.57,8593.58,0,0,'Actual'],
 ['091996',1,'COMP','ALDI SAT','ALDI S',11724,11751,111065.60,115959.74,0,0,'Actual'],
 ['091997',1,'COMP','BOOTH SAT','BOOTH S',200,225,2262.90,2547.64,0,0,''],
 ['092012',2,'HOLD','FROZEN SAT','FROZEN S',20,0,322.00,0,0,0,''],
 ['092013',2,'HOLD','KFC SAT DEPOT','KFC SU',1003,0,15055.55,0,0,0,''],
 ['092014',2,'HOLD','KFC REJECT SAT','KFC REJ S',0,0,0,0,0,0,'']];
function mkLine(o){return Object.assign({prod:'',qty:0,units:'Case',carry:0,req:0,done:0,wexp:0,wdone:0,d:[0,0,0,10],desc:'',plu:'',value:0,byp:false,rej:false,asm:false},o)}
function seedOrders(){
  const out=[];
  const fromRow=(r,day,num,status,mode)=>{
    const [n,site,st,cust,ccode,boxes,done0,est,wd0,kill,pack,ins]=r;
    let done=done0,wd=wd0;
    if(mode==='past'){done=boxes;wd=+(est*1.03).toFixed(2)}else if(mode==='future'){done=0;wd=0}
    return {num:num||n,day:iso(dOff(day)),time:'00:00',site,status:status||st,cust,ccode,type:1,kill:iso(dOff(day+kill)),pack:iso(dOff(day+pack)),insched:true,ext:0,custord:'',instr:ins,printed:false,emailed:false,saved:false,src:mode?'assumed':'photo',
      lines:[mkLine({prod:'—',desc:'Order lines not photographed',req:boxes,done,wexp:est,wdone:wd,asm:true})]};
  };
  ROWS.forEach(r=>out.push(fromRow(r,0)));
  out.push({num:'093015',day:iso(T0),time:'00:00',site:1,status:'WIP',cust:'TEST',ccode:'TEST',type:1,kill:iso(T0),pack:iso(T0),insched:true,ext:0,custord:'',instr:'',printed:false,emailed:false,saved:false,src:'photo',
    lines:[mkLine({prod:'1CWB583A',desc:'OCADO M&S PSO RB WB 2.458KG X2 HWC',plu:'6759'}),
           mkLine({prod:'1CWB144A',desc:'OCADO M&S GARLIC&HERB RB WB 1.395KGX4 HV',plu:'6756'}),
           mkLine({prod:'1CWB649A',desc:'OCADO M&S ROTISSERIE RB 1.55KG X4 HWC',plu:'6758'}),
           mkLine({prod:'37C3T9R',desc:'THETFORD DRUM FLL UNCAL X15KG HWC 100%',plu:'9980'})]});
  /* other days: assumed, generated from the same customers */
  [-3,-2,-1,1,2,3,4].forEach(k=>{
    ROWS.forEach((r,i)=>{
      if(i%3===2&&k>0)return;
      const base=parseInt(r[0],10)+k*140;
      const st=k<0?(r[1]===3?'DESP':(r[5]?'COMP':'HOLD')):(k===1&&r[2]==='WIP'?'WIP':'HOLD');
      out.push(fromRow(r,k,String(base).padStart(6,'0'),st,k<0?'past':'future'));
    });
  });
  return out;
}
function seedTrans(){
  const W=[7.40,7.02,9.48,11.20,8.84,10.06,12.14,9.62,8.98,10.32,9.24,7.26];
  return W.map((w,i)=>{const t=new Date(T0);t.setHours(9,40+i*5,0,0);
    return {serial:'',run:505298+i,mach:'13',plu:'9980',net:w,tare:2.44,gross:+(w+2.44).toFixed(2),t:t.toISOString(),fo:'093015',lot:'0296',useby:iso(dOff(10)),kill:iso(T0),pallet:'0001',void:false,station:'CUTEOL:10241026',fmt:'MS-CASE@3',seed:true}}).map(t=>{t.serial=serialFor(t);return t});
}
function serialFor(t){return String(t.mach).padStart(2,'0')+String(t.run).slice(-6).padStart(6,'0')+t.plu+String(Math.round(t.net*100)).padStart(5,'0')+'640'}
function seed(){
  const products=seedProducts(),formats=seedFormats();
  const s={v:1,products,formats,termProducts:clone(products),termFormats:clone(formats),printerFormats:clone(formats),
    fmtHist:{},orders:seedOrders(),trans:seedTrans(),run:505309,mach:'13',codes:{cmd1:'',cmd0:'',setup:''},
    hotmap:{A:'7333',B:'7335',C:'6154',D:'6149',E:'6155',F:'3285',G:'3457'},hotActive:true,msgs:[],sentAt:null,dlAt:null,seededOn:iso(T0)};
  Object.values(formats).forEach(f=>s.fmtHist[f.id+'@'+f.ver]=clone(f));
  return s;
}
let S;
try{S=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){S=null}
if(!S||S.v!==1)S=seed();
let tasks=new Set();try{tasks=new Set(JSON.parse(localStorage.getItem(TKEY)||'[]'))}catch(e){}
const L=[];
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function emit(type,detail){save();L.forEach(f=>{try{f(type,detail)}catch(e){console.error(e)}})}

/* ---- queries ---- */
const order=num=>S.orders.find(o=>o.num===num);
const live=(fo,plu)=>S.trans.filter(t=>!t.void&&t.fo===fo&&(plu==null||t.plu===plu));
function lineTot(o,l){const tr=l.plu?live(o.num,l.plu):[];return{done:l.done+tr.length,wdone:+(l.wdone+tr.reduce((a,t)=>a+t.net,0)).toFixed(2)}}
function orderTot(o){let r={boxes:0,done:0,est:0,wdone:0};o.lines.forEach(l=>{const t=lineTot(o,l);r.boxes+=l.req;r.done+=t.done;r.est+=l.wexp;r.wdone+=t.wdone});r.wdone=+r.wdone.toFixed(2);r.est=+r.est.toFixed(2);return r}
function findOrder(plu){const today=iso(T0);
  const c=S.orders.filter(o=>o.status==='WIP'&&o.day===today&&o.lines.some(l=>l.plu===plu));
  return c.find(o=>o.num==='093015')||c[0]||null}
function labelData(p,t){
  const net=t?t.net:0,useby=t&&t.useby?t.useby:iso(dOff(p.life));
  const gtin=p.gtin,n6=String(Math.round(net*100)).padStart(6,'0');
  const pt=t&&t.t?new Date(t.t):new Date();
  return {supplier:p.supplier,name:p.label,plu:p.plu,code:p.code,t1:p.t[0],t2:p.t[1],t3:p.t[2],t4:p.t[3],t5:p.t[4],t6:p.t[5],
    tpnd:p.tpnd,twa:p.twa,tare:(t?t.tare:p.tare).toFixed(2),net:net.toFixed(2),gross:(t?t.gross:0).toFixed(2),
    useby:lab(useby),pack:p2(pt.getHours())+':'+p2(pt.getMinutes()),fo:t?t.fo||'------':'------',lot:t?t.lot:'0296',
    serial:t&&t.serial?t.serial:'',gtin,gs1:'01'+gtin+'17'+ymd(useby)+'3103'+n6,hri:'01 '+gtin+' 17 '+ymd(useby)}}
function fill(tpl,d){return String(tpl).replace(/\{(\w+)\}/g,(m,k)=>d[k]!=null?d[k]:m)}
function bars(str,w,h){
  let x=0,r='';const s=('#'+str+'#');
  for(const ch of s){const c=ch.charCodeAt(0);for(let k=0;k<3;k++){const bw=1+((c>>(k*2))&3);r+=`<rect x="${x}" y="0" width="${bw}" height="${h}" fill="#111"/>`;x+=bw+1+((c>>k)&1)}}
  return `<svg viewBox="0 0 ${x} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" aria-hidden="true">${r}</svg>`;
}
function renderLabel(f,d,px,opt){
  opt=opt||{};
  let h=`<div style="position:relative;width:${f.w*px}px;height:${f.h*px}px;background:#fff;color:#111;overflow:hidden;font-family:Arimo,Arial,sans-serif">`;
  f.els.forEach((e,i)=>{
    const sel=opt.sel===i?' on':'',da=opt.edit?` class="el${sel}" data-el="${i}"`:'';
    const pos=`position:absolute;left:${e.x*px}px;top:${e.y*px}px;`;
    if(e.t==='text'){const v=fill(e.v,d);h+=`<div${da} style="${pos}font-size:${e.s*px}px;font-weight:${e.b?700:400};line-height:1.08;white-space:pre">${esc(v)||(opt.edit?'&nbsp;':'')}</div>`}
    else if(e.t==='bc'){const v=fill(e.v,d);h+=`<div${da} style="${pos}width:${e.w*px}px;height:${e.h*px}px">${v&&!/\{/.test(v)?bars(v,e.w*px,e.h*px):`<div style="width:100%;height:100%;background:repeating-linear-gradient(90deg,#bbb 0 2px,#fff 2px 4px)"></div>`}</div>`}
    else if(e.t==='box'){h+=`<div${da} style="${pos}width:${e.w*px}px;height:${e.h*px}px;border:${Math.max(1,0.3*px)}px solid #111;box-sizing:border-box"></div>`}
  });
  return h+'</div>';
}
function decodeSerial(s){s=String(s).replace(/\D/g,'');if(s.length<20)return null;
  return {mach:s.slice(0,2),run:s.slice(2,8),plu:s.slice(8,12),net:(parseInt(s.slice(12,17),10)/100).toFixed(2),tail:s.slice(17)}}

/* ---- actions ---- */
function addTrans(t){
  S.run++;t.run=S.run;t.mach=S.mach;t.serial=serialFor(t);t.t=new Date().toISOString();t.void=false;t.station='CUTEOL:10241026';
  S.trans.push(t);emit('trans',t);return t}
function voidTrans(serial){const t=S.trans.find(x=>x.serial===serial);if(t){t.void=true;emit('trans',t)}}
function send(){S.termProducts=clone(S.products);S.termFormats=clone(S.formats);S.sentAt=new Date().toISOString();emit('send')}
function downloadFormats(){S.printerFormats=clone(S.termFormats);Object.values(S.printerFormats).forEach(f=>S.fmtHist[f.id+'@'+f.ver]=clone(f));S.dlAt=new Date().toISOString();emit('download')}
function pending(){return JSON.stringify(S.products)!==JSON.stringify(S.termProducts)||JSON.stringify(S.formats)!==JSON.stringify(S.termFormats)}
function reset(){S=seed();try{localStorage.removeItem(TKEY)}catch(e){}tasks=new Set();emit('reset')}
function done(id){if(tasks.has(id))return;tasks.add(id);try{localStorage.setItem(TKEY,JSON.stringify([...tasks]))}catch(e){}L.forEach(f=>{try{f('task',id)}catch(e){}})}
function taskList(el,list){el.innerHTML=list.map(([id,t])=>`<li class="${tasks.has(id)?'done':''}"><i>${tasks.has(id)?'✓':''}</i><span>${esc(t)}</span></li>`).join('')}
function clearTasks(ids){ids.forEach(i=>tasks.delete(i));try{localStorage.setItem(TKEY,JSON.stringify([...tasks]))}catch(e){}L.forEach(f=>{try{f('task')}catch(e){}})}
async function saveFile(name,text){
  try{if(window.claude&&window.claude.use){const dl=await window.claude.use('downloads');if(dl){await dl.save({filename:name,data:text});return 'saved'}}}catch(e){if(e&&e.code==='declined')return 'declined'}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),1500);return 'download'}catch(e){return 'failed'}
}
return {get S(){return S},on:f=>L.push(f),emit,save,clone,esc,p2,iso,fromIso,uk,lab,ymd,dOff,T0,DAYS,DAYL,MONL,MON,
  order,lineTot,orderTot,findOrder,labelData,fill,bars,renderLabel,decodeSerial,addTrans,voidTrans,send,downloadFormats,pending,reset,
  done,isDone:id=>tasks.has(id),taskList,clearTasks,saveFile,gtinFor,serialFor};
})();
