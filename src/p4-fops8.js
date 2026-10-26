/* ===== FOPS 8 – Factory Scheduler ===== */
(function(){
const $=s=>document.querySelector(s);
const esc=HX.esc,p2=HX.p2,iso=HX.iso,uk=HX.uk;
const ST=['HOLD','WIP','COMP','DESP'];
const F={view:'factory',day:iso(HX.T0),range:null,sel:null,snap:null,snapAt:null,auto:false,timer:null,
  f:{active:false,site:'',status:'',product:'',contact:''},plus:20,minus:0,dlg:null,menu:null,tab:'lines',lsel:null,toast:''};
const TASKS=[
 ['f8day','Look at another day’s orders with “Fetch Orders For Day”'],
 ['f8sel','Select order 093015 TEST and read its order lines'],
 ['f8ref','Weigh a box of PLU 9980 on the scale, then press Refresh here and watch Done go up'],
 ['f8status','Move order 091990 WHOLESALE SAT KILL from HOLD to WIP with Status +'],
 ['f8ins','Insert a new factory order with a line for PLU 6759'],
 ['f8msg','Send a message from the scale (CMD0) and read it under Info'],
 ['f8csv','Export the grid with CSV Export']];
const done=HX.done;

function snapNow(){F.snap=HX.clone({orders:HX.S.orders,trans:HX.S.trans});F.snapAt=new Date();}
const sOrders=()=>F.snap.orders;
function lineT(o,l){const tr=l.plu?F.snap.trans.filter(t=>!t.void&&t.fo===o.num&&t.plu===l.plu):[];return{done:l.done+tr.length,wdone:+(l.wdone+tr.reduce((a,t)=>a+t.net,0)).toFixed(2)}}
function ordT(o){const r={boxes:0,done:0,est:0,wdone:0};o.lines.forEach(l=>{const t=lineT(o,l);r.boxes+=l.req;r.done+=t.done;r.est+=l.wexp;r.wdone+=t.wdone});return r}
const n2=v=>(+v).toFixed(2);
function dayLabel(d){return HX.DAYS[d.getDay()]+' '+uk(d,true)}
function visible(){
  let L=sOrders();
  if(F.range){const a=iso(HX.dOff(-F.minus)),b=iso(HX.dOff(F.plus));L=L.filter(o=>o.day>=a&&o.day<=b)}else L=L.filter(o=>o.day===F.day);
  const f=F.f;
  if(f.active)L=L.filter(o=>o.status==='WIP'||o.status==='HOLD');
  if(f.site)L=L.filter(o=>String(o.site)===f.site);
  if(f.status)L=L.filter(o=>o.status===f.status);
  if(f.product)L=L.filter(o=>o.lines.some(l=>(l.plu+' '+l.prod+' '+l.desc).toUpperCase().includes(f.product.toUpperCase())));
  if(f.contact)L=L.filter(o=>(o.cust+' '+o.ccode).toUpperCase().includes(f.contact.toUpperCase()));
  return L.slice().sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:a.num<b.num?-1:1);
}
function title(){
  if(F.view!=='factory'){const n={despatch:'Despatch Orders',returns:'Returns Orders',purchase:'Purchase Orders'}[F.view];const d=HX.fromIso(F.day);return n+' for '+HX.DAYL[d.getDay()]+' '+d.getDate()+' '+HX.MONL[d.getMonth()]+' '+d.getFullYear()}
  if(F.range)return 'Factory Orders from '+uk(HX.dOff(-F.minus),true)+' to '+uk(HX.dOff(F.plus),true);
  const d=HX.fromIso(F.day);return 'Factory Orders for '+HX.DAYL[d.getDay()]+' '+d.getDate()+' '+HX.MONL[d.getMonth()]+' '+d.getFullYear()}

const IC={
 print:'<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z" fill="none" stroke="#3a5f8f" stroke-width="1.6"/>',
 output:'<path d="M4 4h10l4 4v12H4z" fill="#fff" stroke="#3a5f8f" stroke-width="1.6"/><path d="M8 12h8M8 16h6" stroke="#3a5f8f" stroke-width="1.6"/>',
 csv:'<rect x="4" y="3" width="16" height="18" fill="#e9f6ec" stroke="#2c8a4b" stroke-width="1.6"/><path d="M8 8h8M8 12h8M8 16h8" stroke="#2c8a4b" stroke-width="1.4"/>',
 insert:'<rect x="5" y="4" width="14" height="16" fill="#fff" stroke="#3a5f8f" stroke-width="1.6"/><path d="M12 8v8M8 12h8" stroke="#2c8a4b" stroke-width="2"/>',
 change:'<path d="M5 19l1-4L16 5l3 3L9 18z" fill="#fff4cc" stroke="#9a6b00" stroke-width="1.6"/>',
 view:'<circle cx="10" cy="10" r="6" fill="#fff" stroke="#3a5f8f" stroke-width="1.8"/><path d="M14.5 14.5L20 20" stroke="#3a5f8f" stroke-width="2.2"/>',
 del:'<path d="M6 6l12 12M18 6L6 18" stroke="#c62828" stroke-width="2.4"/>',
 copy:'<rect x="4" y="7" width="11" height="13" fill="#fff" stroke="#3a5f8f" stroke-width="1.6"/><rect x="9" y="3" width="11" height="13" fill="#eef4fb" stroke="#3a5f8f" stroke-width="1.6"/>',
 minus:'<path d="M5 12h14" stroke="#1d2a38" stroke-width="3"/>',
 plus:'<path d="M12 5v14M5 12h14" stroke="#1d2a38" stroke-width="3"/>',
 refresh:'<path d="M19 12a7 7 0 1 1-2-5M19 4v4h-4" fill="none" stroke="#2c6fc0" stroke-width="2"/>',
 find:'<circle cx="8" cy="12" r="4" fill="#1d2a38"/><circle cx="16" cy="12" r="4" fill="#1d2a38"/><path d="M8 8l2-4h4l2 4" fill="none" stroke="#1d2a38" stroke-width="1.6"/>'};
const svg=k=>`<svg viewBox="0 0 24 24">${IC[k]}</svg>`;

function render(){
  const g=$('#f8Grid'),gs=g?[g.scrollTop,g.scrollLeft]:[0,0];
  const msgs=HX.S.msgs.filter(m=>!m.read).length;
  let h=`<div class="f8" id="f8win">
  <div class="tb"><svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="#2d6fc4"/><path d="M4 4h8v2H6v2h5v2H6v2H4z" fill="#fff"/></svg><span>2SFG SCUNTHORPE - Factory Scheduler</span><span class="wbtn"><span>–</span><span>▢</span><span>✕</span></span></div>
  <div class="mn">${['File','View','Search','Options','Reports','Order','User','Info'].map(m=>`<span data-menu="${m}" class="${F.menu===m?'on':''}">${m}</span>`).join('')}</div>
  <div class="tools">
    <button data-t="print">${svg('print')}Print</button><button data-t="output">${svg('output')}Output</button><button data-t="csv">${svg('csv')}CSV Export</button><span class="sep"></span>
    <button data-t="insert">${svg('insert')}Insert</button><button data-t="change">${svg('change')}Change</button><button data-t="view">${svg('view')}View</button><button data-t="delete">${svg('del')}Delete</button><button data-t="copy">${svg('copy')}Copy Order</button><span class="sep"></span>
    <button data-t="sminus">${svg('minus')}Status</button><button data-t="splus">${svg('plus')}Status</button><span class="sep"></span>
    <button data-t="refresh">${svg('refresh')}Refresh</button><button data-t="find">${svg('find')}Find Order</button>
  </div>
  <div class="body">${leftHTML()}<div class="main">${F.view==='factory'?factoryHTML():otherHTML()}</div></div>
  <div class="sb"><span>Current Value 0.00</span><span>Data as at ${F.snapAt.toTimeString().slice(0,8)}</span>${msgs?`<b>${msgs} message${msgs>1?'s':''} from terminals – Info menu</b>`:''}<span style="margin-left:auto">${esc(F.toast)}</span></div>
  ${menuHTML()}${dlgHTML()}</div>`;
  $('#f8Inner').innerHTML=h;
  const g2=$('#f8Grid');if(g2){g2.scrollTop=gs[0];g2.scrollLeft=gs[1]}
  renderSide();fit();
}
function leftHTML(){
  const days=[];for(let k=-3;k<=4;k++){const d=HX.dOff(k);days.push([iso(d),k===0?HX.DAYS[d.getDay()]+' Today':dayLabel(d)])}
  const sites=[...new Set(HX.S.orders.map(o=>String(o.site)))].sort();
  return `<div class="left"><div class="lh"><span>Factory Orders</span><span>⇔</span></div>
  <div class="grp"><div class="gt">Date Range</div>
    <div class="lrow"><label>Today +</label><input type="number" id="f8plus" min="0" max="60" value="${F.plus}" style="width:52px"></div>
    <div class="lrow"><label>Today -</label><input type="number" id="f8minus" min="0" max="60" value="${F.minus}" style="width:52px"></div>
    <button class="lbtn" data-t="range">Fetch Orders in Range</button>
    <label class="lrow" style="gap:6px"><input type="checkbox" id="f8auto" ${F.auto?'checked':''}> Refresh (300)</label></div>
  <div class="grp"><div class="gt">Fetch Orders For Day</div><div class="days">${days.map(([d,l])=>`<div data-day="${d}" class="${!F.range&&F.day===d?'on':''}">${l}</div>`).join('')}</div></div>
  <div class="grp"><div class="gt">Filters</div>
    <label class="lrow" style="gap:6px"><input type="checkbox" id="f8fa" ${F.f.active?'checked':''}> Active</label>
    <div class="lrow"><label for="f8fc">Contact</label><input type="text" id="f8fc" value="${esc(F.f.contact)}" style="width:110px"></div>
    <div class="lrow"><label for="f8fs">Site</label><select id="f8fs" style="width:110px"><option value="">(all)</option>${sites.map(s=>`<option ${F.f.site===s?'selected':''}>${s}</option>`).join('')}</select></div>
    <div class="lrow"><label for="f8fst">Status</label><select id="f8fst" style="width:110px"><option value="">(all)</option>${ST.map(s=>`<option ${F.f.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
    <div class="lrow"><label for="f8fp">Product</label><input type="text" id="f8fp" value="${esc(F.f.product)}" style="width:110px" placeholder="PLU or code"></div></div>
  <div class="nav">${[['despatch','Dispatch Orders','#2c8a4b'],['returns','Returns Orders','#c62828'],['factory','Factory Orders','#e3a008'],['purchase','Purchase Orders','#2d6fc4']].map(([v,n,c])=>`<div data-nav="${v}" class="${F.view===v?'on':''}"><i style="background:${c}"></i>${n}</div>`).join('')}</div></div>`;
}
const COLS=['Schedule date','Time','Site','Number','Status','Customer name','Boxes','Done','Est Weight','','Weight Done','SOP ref','Printed','EMailed','Saved','Order type','Kill date','Pack Date','In schedule','Customer code','Order number extn','Cust order number','Instruction'];
const cb=on=>`<span class="cb ${on?'on':''}"></span>`;
function factoryHTML(){
  const L=visible();
  let rows=L.map(o=>{const t=ordT(o),d=HX.fromIso(o.day);return `<tr data-o="${o.num}" class="${F.sel===o.num?'sel':''}">
    <td class="sd">${uk(d)} ${HX.DAYS[d.getDay()]}</td><td>${o.time}</td><td class="n">${o.site}</td><td>${o.num}</td><td class="st${o.status}">${o.status}</td><td>${esc(o.cust)}</td>
    <td class="n">${t.boxes}</td><td class="n">${t.done}</td><td class="n">${n2(t.est)}</td><td>kg</td><td class="n">${n2(t.wdone)}</td><td></td>
    <td>${cb(o.printed)}</td><td>${cb(o.emailed)}</td><td>${cb(o.saved)}</td><td class="n">${o.type}</td><td>${uk(o.kill,true)}</td><td>${uk(o.pack,true)}</td><td>${cb(o.insched)}</td><td>${esc(o.ccode)}</td><td class="n">${o.ext}</td><td>${esc(o.custord)}</td><td>${esc(o.instr)}</td></tr>`}).join('');
  if(!L.length)rows=`<tr><td colspan="${COLS.length}" style="color:#666;padding:8px">No factory orders match.</td></tr>`;
  const o=F.sel?sOrders().find(x=>x.num===F.sel):null;
  return `<div class="gtitle"><span>${esc(title())}</span><span style="font-weight:400">${L.length} orders</span></div>
  <div class="grid" id="f8Grid"><table><thead><tr>${COLS.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
  <div class="lines"><div class="lt"><span data-tab="lines" class="${F.tab==='lines'?'on':''}">Order Lines</span><span data-tab="trans" class="${F.tab==='trans'?'on':''}">Transactions</span>${o?`<span style="cursor:default">${o.num} ${esc(o.cust)}</span>`:''}</div>
  <div class="grid" style="flex:1">${o?(F.tab==='lines'?linesTable(o):transTable(o)):'<div style="padding:8px;color:#666">Select an order to see its lines.</div>'}</div></div>`;
}
function linesTable(o){
  const C=['Product','Quantity','Units','Carry qty','Boxes Req','Boxes Done','Boxes Rem','Wt. Expected','Weight Done','Wt. Remaining','Date 1','Date 2','Date 3','Date 4','Description','PLU','Value','Byproduct','Rejected input'];
  return `<table><thead><tr>${C.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${o.lines.map((l,i)=>{const t=lineT(o,l),dd=l.d.map(k=>uk(HX.dOff(k,HX.fromIso(o.day))));
    return `<tr><td>${esc(l.prod)}</td><td class="n">${n2(l.qty)}</td><td>${l.units}</td><td class="n">${n2(l.carry)}</td><td class="n">${l.req}</td><td class="n">${t.done}</td><td class="n">${l.req-t.done}</td><td class="n">${n2(l.wexp)}</td><td class="n" style="${t.wdone?'background:#d8e8fb':''}">${n2(t.wdone)}</td><td class="n">${n2(l.wexp-t.wdone)}</td><td>${dd[0]}</td><td>${dd[1]}</td><td>${dd[2]}</td><td>${dd[3]}</td><td>${esc(l.desc)}${l.asm?' <span class="asm">(trainer)</span>':''}</td><td>${esc(l.plu)}</td><td class="n">${n2(l.value)}</td><td>${cb(l.byp)}</td><td>${cb(l.rej)}</td></tr>`}).join('')}</tbody></table>`;
}
function transTable(o){
  const T=F.snap.trans.filter(t=>t.fo===o.num).slice().reverse();
  if(!T.length)return '<div style="padding:8px;color:#666">No weighings recorded against this order yet. <span class="asm">(This tab is a trainer addition.)</span></div>';
  return `<table><thead><tr>${['Time','Serial','Run','PLU','Net kg','Tare','Station','Lot','Pallet','Deleted'].map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${T.map(t=>`<tr><td>${new Date(t.t).toTimeString().slice(0,8)}</td><td>${t.serial}</td><td>${t.run}</td><td>${t.plu}</td><td class="n">${n2(t.net)}</td><td class="n">${n2(t.tare)}</td><td>${t.station}</td><td>${t.lot}</td><td>${t.pallet}</td><td>${cb(t.void)}</td></tr>`).join('')}</tbody></table>`;
}
function otherHTML(){
  const day=sOrders().filter(o=>o.day===F.day);let C=[],R=[];
  if(F.view==='despatch'){C=['Despatch no','Customer','Factory order','Boxes','Weight kg','Pallets','Vehicle','Status'];
    R=day.filter(o=>o.status==='DESP'||o.status==='COMP').map(o=>{const t=ordT(o);return['D'+o.num.slice(1),o.cust,o.num,t.done,n2(t.wdone),Math.ceil(t.done/60),'—',o.status==='DESP'?'Despatched':'Ready']})}
  else if(F.view==='purchase'){C=['PO number','Supplier','Material','Qty','Unit','Due','Status'];
    R=[['P10'+F.day.slice(8)+'1','Live bird intake','Whole birds','24000','birds',uk(HX.dOff(-1,HX.fromIso(F.day))),'Received'],['P10'+F.day.slice(8)+'2','Packaging supplier','Case 600x400','3000','each',uk(F.day),'Open'],['P10'+F.day.slice(8)+'3','Label supplier','80x150 DT labels','40','rolls',uk(F.day),'Open']]}
  else{C=['Return no','Customer','Reason','Boxes','Status'];R=[]}
  return `<div class="gtitle"><span>${esc(title())}</span><span style="font-weight:400">trainer guess – not photographed</span></div>
  <div class="grid"><table><thead><tr>${C.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${R.length?R.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${C.length}" style="color:#666;padding:8px">No ${F.view} orders for this day.</td></tr>`}</tbody></table></div>`;
}
const MENUS={File:[['Print','print'],['CSV Export','csv'],['Exit','',1]],View:[['Refresh','refresh'],['Order lines','tabLines'],['Transactions','tabTrans']],Search:[['Find Order…','find']],
  Options:[['Auto refresh on/off','auto']],Reports:[['Production by site','repSite'],['Order progress (selected)','repOrder'],['Scale transactions today','repTrans']],
  Order:[['Insert','insert'],['Change','change'],['View','view'],['Delete','delete'],['Copy Order','copy'],['Status +','splus'],['Status −','sminus']],
  User:[['Signed in: LAB COORD (trainer)','',1],['Change password','',1]],Info:[['Messages from terminals','msgs'],['About FOPS','about']]};
function menuHTML(){if(!F.menu)return '';const x={File:4,View:36,Search:76,Options:124,Reports:178,Order:236,User:282,Info:322}[F.menu];
  return `<div class="menu-dd" style="left:${x}px;top:50px">${MENUS[F.menu].map(([n,a,d])=>`<div class="${d?'dis':''}" ${d?'':`data-t="${a}"`}>${esc(n)}</div>`).join('')}</div>`}

/* ---------- dialogs ---------- */
function dlgHTML(){
  const d=F.dlg;if(!d)return '';
  const wrap=(t,body,btns,w)=>`<div class="dlg"><div class="w" style="${w?'width:'+w+'px':''}"><div class="wt"><span>${esc(t)}</span><span data-d="cancel" style="cursor:pointer">✕</span></div><div class="wb2">${body}</div><div class="ft">${btns}</div></div></div>`;
  if(d.kind==='confirm')return wrap(d.title||'FOPS',`<div style="white-space:pre-line">${esc(d.text)}</div>`,`<button class="def" data-d="yes">Yes</button><button data-d="cancel">No</button>`);
  if(d.kind==='info')return wrap(d.title||'FOPS',d.html||`<div style="white-space:pre-line">${esc(d.text)}</div>`,`<button class="def" data-d="cancel">OK</button>`,d.w);
  if(d.kind==='find')return wrap('Find Order',`<label>Order number <input type="text" id="f8find" value="${esc(d.val||'')}" style="width:120px"></label>${d.err?`<div style="color:#c62828">${esc(d.err)}</div>`:''}`,`<button class="def" data-d="find">OK</button><button data-d="cancel">Cancel</button>`);
  if(d.kind==='order'){const o=d.o,ro=d.mode==='view',dis=ro?'disabled':'';
    const days=[];for(let k=-3;k<=4;k++)days.push(iso(HX.dOff(k)));if(!days.includes(o.day))days.unshift(o.day);
    const prods=Object.values(HX.S.products);
    const body=`<div class="asm">Dialog layout is a trainer design – the real Insert/Change screen has not been photographed.</div>
    <div class="fgrid">
      <span>Number</span><input type="text" value="${o.num}" disabled>
      <span>Status</span><select id="od-status" ${dis}>${ST.map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select>
      <span>Customer name</span><input type="text" id="od-cust" value="${esc(o.cust)}" ${dis}>
      <span>Customer code</span><input type="text" id="od-ccode" value="${esc(o.ccode)}" ${dis}>
      <span>Schedule date</span><select id="od-day" ${dis}>${days.map(x=>`<option value="${x}" ${o.day===x?'selected':''}>${dayLabel(HX.fromIso(x))}</option>`).join('')}</select>
      <span>Site</span><select id="od-site" ${dis}>${[1,2,3,4,5,6,7].map(s=>`<option ${o.site==s?'selected':''}>${s}</option>`).join('')}</select>
      <span>Kill date</span><input type="date" id="od-kill" value="${o.kill}" ${dis}>
      <span>Pack date</span><input type="date" id="od-pack" value="${o.pack}" ${dis}>
      <span>Order type</span><input type="number" id="od-type" value="${o.type}" ${dis} style="width:60px">
      <span>In schedule</span><label><input type="checkbox" id="od-ins" ${o.insched?'checked':''} ${dis}></label>
      <span>Cust order no</span><input type="text" id="od-co" value="${esc(o.custord)}" ${dis}>
      <span>Instruction</span><input type="text" id="od-ins2" value="${esc(o.instr)}" ${dis}>
    </div>
    <div style="font-weight:700;margin-top:4px">Order lines</div>
    <div style="max-height:200px;overflow:auto;border:1px solid #c9d3de;background:#fff"><table><thead><tr><th>Product (PLU)</th><th>Description</th><th>Boxes Req</th><th>Wt. Expected</th><th>Done</th>${ro?'':'<th></th>'}</tr></thead><tbody>
    ${o.lines.map((l,i)=>`<tr><td>${ro||l.asm?esc(l.plu||l.prod):`<select data-lp="${i}">${prods.map(p=>`<option value="${p.plu}" ${l.plu===p.plu?'selected':''}>${p.plu} ${esc(p.code)}</option>`).join('')}</select>`}</td><td>${esc(l.desc)}</td>
      <td>${ro?l.req:`<input type="number" data-lr="${i}" value="${l.req}" style="width:60px">`}</td><td>${ro?n2(l.wexp):`<input type="number" step="0.01" data-lw="${i}" value="${l.wexp}" style="width:80px">`}</td><td class="n">${lineT(o,l).done}</td>${ro?'':`<td><button data-ld="${i}" style="min-width:0">✕</button></td>`}</tr>`).join('')}
    </tbody></table></div>${ro?'':'<div><button data-d="addline">Add line</button></div>'}${d.err?`<div style="color:#c62828">${esc(d.err)}</div>`:''}`;
    return wrap((d.mode==='insert'?'Insert':d.mode==='change'?'Change':'View')+' Factory Order '+o.num,body,ro?`<button class="def" data-d="cancel">Close</button>`:`<button class="def" data-d="saveOrder">OK</button><button data-d="cancel">Cancel</button>`,720)}
  return '';
}
function readOrderForm(){
  const o=F.dlg.o,v=id=>$('#'+id);
  o.status=v('od-status').value;o.cust=v('od-cust').value.toUpperCase();o.ccode=v('od-ccode').value.toUpperCase();o.day=v('od-day').value;o.site=+v('od-site').value;
  o.kill=v('od-kill').value||o.kill;o.pack=v('od-pack').value||o.pack;o.type=+v('od-type').value||1;o.insched=v('od-ins').checked;o.custord=v('od-co').value;o.instr=v('od-ins2').value;
  document.querySelectorAll('[data-lp]').forEach(s=>{const l=o.lines[+s.dataset.lp],p=HX.S.products[s.value];if(p&&l.plu!==p.plu){l.plu=p.plu;l.prod=p.code;l.desc=p.desc;l.d=[0,0,0,p.life]}});
  document.querySelectorAll('[data-lr]').forEach(s=>o.lines[+s.dataset.lr].req=Math.max(0,parseInt(s.value||'0',10)));
  document.querySelectorAll('[data-lw]').forEach(s=>o.lines[+s.dataset.lw].wexp=Math.max(0,parseFloat(s.value||'0')));
}
function newLine(plu){const p=HX.S.products[plu]||Object.values(HX.S.products)[0];return{prod:p.code,qty:0,units:'Case',carry:0,req:0,done:0,wexp:0,wdone:0,d:[0,0,0,p.life],desc:p.desc,plu:p.plu,value:0,byp:false,rej:false,asm:false}}
function nextNum(){return String(Math.max(...HX.S.orders.map(o=>parseInt(o.num,10)))+1).padStart(6,'0')}
function liveOrder(num){return HX.S.orders.find(o=>o.num===num)}
function commit(msg,sel){HX.emit('orders');snapNow();if(sel)F.sel=sel;F.toast=msg||'';F.dlg=null;render()}

/* ---------- actions ---------- */
function act(a){
  F.menu=null;
  const o=F.sel?liveOrder(F.sel):null;
  const need=()=>{if(!o){F.dlg={kind:'info',text:'Select an order first.'};render();return false}return true};
  switch(a){
    case 'refresh':snapNow();F.toast='Refreshed';if(F.sel==='093015'&&F.snap.trans.some(t=>t.fo==='093015'&&!t.seed&&!t.void))done('f8ref');render();return;
    case 'range':F.plus=Math.max(0,parseInt($('#f8plus').value||'0',10));F.minus=Math.max(0,parseInt($('#f8minus').value||'0',10));F.range=true;F.view='factory';render();return;
    case 'insert':{const n={num:nextNum(),day:F.range?iso(HX.T0):F.day,time:'00:00',site:1,status:'HOLD',cust:'NEW ORDER',ccode:'NEW',type:1,kill:F.day,pack:F.day,insched:true,ext:0,custord:'',instr:'',printed:false,emailed:false,saved:false,src:'trainer',lines:[newLine('6759')]};
      F.dlg={kind:'order',mode:'insert',o:n};render();return}
    case 'change':if(!need())return;F.dlg={kind:'order',mode:'change',o:HX.clone(o)};render();return;
    case 'view':if(!need())return;F.dlg={kind:'order',mode:'view',o:HX.clone(F.snap.orders.find(x=>x.num===o.num)||o)};render();return;
    case 'delete':if(!need())return;{const t=HX.orderTot(o);
      if(t.done>0){F.dlg={kind:'info',text:`Order ${o.num} has ${t.done} boxes recorded against it and cannot be deleted.`};render();return}
      F.dlg={kind:'confirm',text:`Delete factory order ${o.num} ${o.cust}?`,yes(){HX.S.orders=HX.S.orders.filter(x=>x.num!==o.num);F.sel=null;commit('Order deleted')}};render();return}
    case 'copy':if(!need())return;{const c=HX.clone(o);c.num=nextNum();c.status='HOLD';c.src='trainer';c.lines.forEach(l=>{l.done=0;l.wdone=0});HX.S.orders.push(c);commit('Copied to '+c.num,c.num);return}
    case 'splus':case 'sminus':if(!need())return;{const i=ST.indexOf(o.status),j=Math.max(0,Math.min(ST.length-1,i+(a==='splus'?1:-1)));
      if(i===j){F.toast='Status already '+o.status;render();return}
      o.status=ST[j];if(o.num==='091990'&&o.status==='WIP')done('f8status');commit(o.num+' → '+o.status);return}
    case 'find':F.dlg={kind:'find'};render();setTimeout(()=>{const i=$('#f8find');i&&i.focus()},30);return;
    case 'csv':{const L=F.view==='factory'?visible():[];const rows=[COLS.filter(Boolean).concat(['Unit'])].concat(L.map(o=>{const t=ordT(o);return[uk(o.day),o.time,o.site,o.num,o.status,o.cust,t.boxes,t.done,n2(t.est),n2(t.wdone),'',o.printed?1:0,o.emailed?1:0,o.saved?1:0,o.type,uk(o.kill,true),uk(o.pack,true),o.insched?1:0,o.ccode,o.ext,o.custord,o.instr,'kg']}));
      const csv=rows.map(r=>r.map(v=>{v=String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(',')).join('\r\n');
      HX.saveFile('factory-orders-'+F.day+'.csv',csv).then(r=>{F.toast=r==='saved'?'CSV saved':r==='download'?'CSV download started':r==='declined'?'Save cancelled':'Could not save CSV';if(r==='saved'||r==='download')done('f8csv');render()});return}
    case 'print':case 'output':F.dlg={kind:'info',title:a==='print'?'Print':'Output',text:'Printing goes to the office printer on site. In the trainer, use Reports to see a printout on screen.'};render();return;
    case 'auto':F.auto=!F.auto;setAuto();render();return;
    case 'tabLines':F.tab='lines';render();return;case 'tabTrans':F.tab='trans';render();return;
    case 'repSite':{const L=sOrders().filter(x=>x.day===F.day);const by={};L.forEach(x=>{const t=ordT(x),b=by[x.site]||(by[x.site]={n:0,req:0,done:0,kg:0});b.n++;b.req+=t.boxes;b.done+=t.done;b.kg+=t.wdone});
      F.dlg={kind:'info',title:'Production by site',w:520,html:`<pre>${esc('PRODUCTION BY SITE   '+uk(F.day,true)+'\n\nSite  Orders   Boxes req  Boxes done    Weight kg\n'+Object.keys(by).sort().map(s=>`${s.padEnd(6)}${String(by[s].n).padStart(6)}${String(by[s].req).padStart(12)}${String(by[s].done).padStart(12)}${by[s].kg.toFixed(2).padStart(13)}`).join('\n')+'\n\n(Report layout is a trainer design)')}</pre>`};render();return}
    case 'repOrder':if(!need())return;{const so=F.snap.orders.find(x=>x.num===o.num)||o;const t=ordT(so);F.dlg={kind:'info',title:'Order progress',w:560,html:`<pre>${esc(`ORDER ${so.num}  ${so.cust}  status ${so.status}\nSchedule ${uk(so.day,true)}  kill ${uk(so.kill,true)}  pack ${uk(so.pack,true)}\n\n`+so.lines.map(l=>{const x=lineT(so,l);return `${(l.plu||l.prod).padEnd(8)} req ${String(l.req).padStart(5)}  done ${String(x.done).padStart(5)}  ${x.wdone.toFixed(2).padStart(10)} kg  ${l.desc.slice(0,30)}`}).join('\n')+`\n\nTOTAL boxes ${t.done}/${t.boxes}   weight ${t.wdone.toFixed(2)} kg`)}</pre>`};render();return}
    case 'repTrans':{const T=F.snap.trans.filter(t=>t.t.slice(0,10)===iso(HX.T0)||new Date(t.t)>=HX.T0);F.dlg={kind:'info',title:'Scale transactions today',w:620,html:`<pre>${esc('TIME      STATION           RUN     PLU   NET kg   FO\n'+T.map(t=>`${new Date(t.t).toTimeString().slice(0,8)}  ${t.station.padEnd(16)}  ${t.run}  ${t.plu}  ${t.net.toFixed(2).padStart(6)}  ${t.fo||'-'}${t.void?'  DELETED':''}`).join('\n'))}</pre>`};render();return}
    case 'msgs':{const M=HX.S.msgs;M.forEach(m=>m.read=true);HX.emit('msgread');if(M.length)done('f8msg');
      F.dlg={kind:'info',title:'Messages from terminals',w:520,html:M.length?`<pre>${esc(M.map(m=>`${new Date(m.t).toTimeString().slice(0,5)}  ${m.from}\n   ${m.text}`).join('\n\n'))}</pre>`:'<div>No messages. Send one from the scale: CMD0 → Send a Message to FOPS.</div>'};render();return}
    case 'about':F.dlg={kind:'info',title:'About',text:'FOPS 8 – Factory Order Processing System (Hellenic Systems).\nServer database: Actian Zen (Pervasive) with MS-SQL for FOPS8web, per Hellenic’s brochure.\n\nThis window is a trainer replica of the Factory Scheduler.'};render();return;
  }
}
function setAuto(){clearInterval(F.timer);if(F.auto)F.timer=setInterval(()=>{if(!$('#app-fops8').hidden&&!F.dlg){snapNow();F.toast='Auto refresh';render()}},5000)}

/* ---------- side cards ---------- */
function renderSide(){
  const T=HX.S.trans.filter(t=>!t.seed),since=HX.S.trans.length-F.snap.trans.length;
  const n=F.dlg&&F.dlg.kind==='order'?['Order dialog','Header and lines for one factory order. Lines are what the scale weighs against: the scale picks the WIP order for today that has its PLU on a line.',[],['Whole dialog is a trainer design','Insert puts new orders on HOLD','Wt. Expected is typed by hand here']]
   :F.view!=='factory'?['Other order types','The navigator at the bottom left switches between Dispatch, Returns, Factory and Purchase orders.',['The four navigator buttons and their colours'],['Everything in these grids is invented for practice']]
   :['Factory Scheduler','The planning team’s list of factory orders (FOs) for a day. Each FO is a customer order the factory must produce. Select one to see its lines; Done and Weight Done fill from the scales.',['Window title, menus, toolbar, Date Range, Refresh (300), day list, filters, navigator','All columns and the 30 orders for 24 Oct 2026, with boxes, done and weights','Order lines for 093015 TEST: 3 OCADO M&S lines and 37C3T9R THETFORD DRUM, PLU 9980, 12 boxes, 111.56 kg','Site numbers 1, 2, 3, 7 (2 = KFC orders, 7 = bulk/butchery, matching your line notes)'],
     ['Other days’ orders are generated from the same customers','Status +/− order HOLD → WIP → COMP → DESP','The screen only updates on Refresh (or every 300 s when ticked; 5 s here)','Transactions tab, Reports and Info menus','Colours of the status text']];
  $('#f8Notes').innerHTML=`<h2>This screen</h2><h3>${esc(n[0])}</h3><p>${esc(n[1])}</p><div class="tags">${n[2].map(t=>`<div class="tag r"><b>From photo:</b> ${esc(t)}</div>`).join('')}${n[3].map(t=>`<div class="tag a"><b>Assumed:</b> ${esc(t)}</div>`).join('')}</div>`;
  $('#f8Live').innerHTML=`<h2>Link to the scale</h2><p>${since>0?`<b>${since} new weighing${since>1?'s':''}</b> on the scale since this screen was refreshed. Press Refresh to see ${since>1?'them':'it'}.`:'This screen is up to date with the scale.'}</p>
   <p class="small">Labels printed in the trainer: ${T.length}. FO for PLU 9980 today: ${HX.findOrder('9980')?HX.findOrder('9980').num:'none in WIP'}.</p>`;
  HX.taskList($('#f8Tasks'),TASKS);
}

/* ---------- events ---------- */
const root=$('#f8Inner');
root.addEventListener('click',e=>{
  const t=e.target.closest('[data-t],[data-menu],[data-day],[data-o],[data-nav],[data-tab],[data-d],[data-ld]');
  if(!t){if(F.menu){F.menu=null;render()}return}
  const d=t.dataset;
  if(d.menu){F.menu=F.menu===d.menu?null:d.menu;render();return}
  if(d.d){const D=F.dlg;
    if(d.d==='cancel'){F.dlg=null;render();return}
    if(d.d==='yes'){F.dlg=null;D.yes&&D.yes();render();return}
    if(d.d==='find'){const v=$('#f8find').value.trim().padStart(6,'0');const o=HX.S.orders.find(x=>x.num===v);
      if(!o){D.val=v;D.err='Order '+v+' not found';render();return}
      F.view='factory';F.range=null;F.day=o.day;F.sel=o.num;F.dlg=null;F.f={active:false,site:'',status:'',product:'',contact:''};if(o.num==='093015')done('f8sel');render();
      const r=root.querySelector(`tr[data-o="${o.num}"]`);r&&r.scrollIntoView({block:'center'});return}
    if(d.d==='addline'){readOrderForm();D.o.lines.push(newLine('6759'));render();return}
    if(d.d==='saveOrder'){readOrderForm();const o=D.o;
      if(!o.cust.trim()){D.err='Customer name is needed';render();return}
      if(D.mode==='insert'){HX.S.orders.push(o)}else{const i=HX.S.orders.findIndex(x=>x.num===o.num);HX.S.orders[i]=o}
      if(D.mode==='insert'&&o.lines.some(l=>l.plu==='6759'))done('f8ins');
      if(o.num==='091990'&&o.status==='WIP')done('f8status');
      F.view='factory';F.range=null;F.day=o.day;commit((D.mode==='insert'?'Inserted ':'Saved ')+o.num,o.num);return}
    return}
  if(d.ld!=null){readOrderForm();F.dlg.o.lines.splice(+d.ld,1);render();return}
  if(d.t){act(d.t);return}
  if(d.day){F.day=d.day;F.range=null;F.view=F.view==='factory'?'factory':F.view;F.sel=null;if(d.day!==iso(HX.T0))done('f8day');render();return}
  if(d.nav){F.view=d.nav;F.range=null;render();return}
  if(d.tab){F.tab=d.tab;render();return}
  if(d.o){F.sel=d.o;if(d.o==='093015')done('f8sel');render();return}
});
root.addEventListener('dblclick',e=>{const r=e.target.closest('[data-o]');if(r){F.sel=r.dataset.o;act('change')}});
root.addEventListener('change',e=>{const id=e.target.id;
  if(id==='f8auto'){F.auto=e.target.checked;setAuto();render();return}
  if(id==='f8fa'){F.f.active=e.target.checked;render();return}
  if(id==='f8fs'){F.f.site=e.target.value;render();return}
  if(id==='f8fst'){F.f.status=e.target.value;render();return}
  if(id==='f8fc'){F.f.contact=e.target.value;render();return}
  if(id==='f8fp'){F.f.product=e.target.value;render();return}
});
root.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='f8find'){e.preventDefault();root.querySelector('[data-d="find"]').click()}
  if(e.key==='Enter'&&['f8fc','f8fp'].includes(e.target.id)){e.target.dispatchEvent(new Event('change',{bubbles:true}))}});

function fit(){const box=$('#f8Box'),inner=$('#f8Inner');if(!box.clientWidth)return;const s=Math.max(0.55,Math.min(1,box.clientWidth/1202));
  inner.style.transform=`scale(${s})`;inner.style.width='1202px';box.style.height=(782*s)+'px';box.style.overflowX=1202*s>box.clientWidth+1?'auto':'hidden';
  let sz=$('#f8Sizer');if(!sz){sz=document.createElement('div');sz.id='f8Sizer';sz.style.height='1px';box.appendChild(sz)}sz.style.width=(1202*s)+'px';inner.style.position='absolute';inner.style.left='0';inner.style.top='0'}
window.addEventListener('resize',()=>{if(!$('#app-fops8').hidden)fit()});
HX.on(type=>{if(type==='task')HX.taskList($('#f8Tasks'),TASKS);
  if(type==='reset'){snapNow();F.sel=null;F.dlg=null;render()}
  if((type==='trans'||type==='msg'||type==='send')&&!$('#app-fops8').hidden){renderSide();if(type==='msg')render()}});
window.HXfops8={show(){if(!F.snap)snapNow();render()},fit};
snapNow();
})();
