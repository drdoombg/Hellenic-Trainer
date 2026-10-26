/* ===== FOPSx Web – labels and traceability (designed, no photo) ===== */
(function(){
const $=s=>document.querySelector(s);
const esc=HX.esc,iso=HX.iso,uk=HX.uk,p2=HX.p2,done=HX.done;
const X={page:'labels',fmt:'MS-CASE',draft:null,sel:null,prev:'9980',prod:'9980',pd:null,q:'',hit:null,toast:'',toastT:0,px:4};
const TASKS=[
 ['fxedit','In the Label designer, move the USE BY date and save the format'],
 ['fxsend','Send products and formats to CUTEOL, then check the label on the scale'],
 ['fxdl','On the scale, CMD1 → Download Label Formats, so the printer prints the new version'],
 ['fxprod','Change PLU 9980 shelf life to 9 days, send it, and check the use-by on the scale'],
 ['fxtrace','Trace the box with serial 13505309998000726640']];
const FIELDS=[['supplier','Supplier code'],['name','Label name'],['t1','Text line 1'],['t2','Text line 2'],['t3','Text line 3'],['t4','Text line 4'],['t5','Text line 5'],['t6','Text line 6'],['useby','Use by date'],['pack','Pack time'],['net','Net weight'],['tare','Tare'],['gross','Gross'],['tpnd','TPND'],['twa','TWA code'],['plu','PLU'],['fo','Factory order'],['lot','Lot'],['serial','Serial (machine+run+PLU+weight)'],['gtin','GTIN'],['gs1','GS1-128 data'],['hri','GS1 human-readable']];
const PAGES=[['labels','Label formats'],['designer','Label designer'],['products','Products'],['terminals','Terminals'],['trace','Traceability']];
function toast(t){X.toast=t;X.toastT=Date.now()+3500;render();setTimeout(()=>{if(Date.now()>=X.toastT){X.toast='';render()}},3600)}
function sampleTrans(p){const t={plu:p.plu,net:7.26,tare:p.tare,gross:+(7.26+p.tare).toFixed(2),t:new Date().toISOString(),fo:'093015',lot:'0296',useby:iso(HX.dOff(p.life)),mach:HX.S.mach,run:HX.S.run+1};t.serial=HX.serialFor(t);return t}
const fmtStatus=id=>{const f=HX.S.formats[id],t=HX.S.termFormats[id],pr=HX.S.printerFormats[id];
  if(!t||JSON.stringify(t)!==JSON.stringify(f))return['wa','Not sent to terminals'];
  if(!pr||pr.ver!==f.ver||JSON.stringify(pr.els)!==JSON.stringify(f.els))return['wa','On terminal, not on printer'];return['ok','Up to date']};
const prodStatus=plu=>JSON.stringify(HX.S.products[plu])===JSON.stringify(HX.S.termProducts[plu])?['ok','Sent']:['wa','Changed – not sent'];

function render(){
  const app=$('#fxApp');const sx=window.scrollX,sy=window.scrollY;
  app.innerHTML=`<div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">fopsxweb/${X.page}</div></div>
  <div class="appbar"><div class="logo">FOPS<span>x</span> Web</div><nav aria-label="FOPSx Web">${PAGES.map(([k,n])=>`<button data-pg="${k}" ${X.page===k?'aria-current="page"':''}>${n}</button>`).join('')}</nav><div class="who">2SFG Scunthorpe · Lab Coord (trainer)</div></div>
  <div class="pg">${({labels:pgLabels,designer:pgDesigner,products:pgProducts,terminals:pgTerminals,trace:pgTrace})[X.page]()}${X.toast?`<div class="toast" role="status">${esc(X.toast)}</div>`:''}</div>`;
  if(X.page==='designer')drawCanvas();
  renderSide();
}
/* ---------- label formats ---------- */
function pgLabels(){
  const F=Object.values(HX.S.formats);
  return `<h2>Label formats</h2><p class="sub">Each product points to one format. Change a format in the designer, send it to the terminals, then download it to the printers from the scale.</p>
  <div class="tools2"><button class="fb pri" data-a="newfmt">New format</button></div>
  <div class="tw"><table><thead><tr><th>Format</th><th>Size</th><th>Version</th><th>Used by</th><th>Terminal</th><th>Printer</th><th>Status</th><th></th></tr></thead><tbody>
  ${F.map(f=>{const used=Object.values(HX.S.products).filter(p=>p.fmt===f.id).map(p=>p.plu);const st=fmtStatus(f.id);const t=HX.S.termFormats[f.id],pr=HX.S.printerFormats[f.id];
    return `<tr><td><b>${esc(f.name)}</b><div class="small" style="color:#5d6b78">${esc(f.id)}${f.from==='photo'?' · copied from your label photo':''}</div></td><td>${f.w} × ${f.h} mm</td><td class="n">v${f.ver}</td><td>${used.length?used.join(', '):'—'}</td><td>${t?'v'+t.ver:'—'}</td><td>${pr?'v'+pr.ver:'—'}</td><td><span class="b ${st[0]}">${st[1]}</span></td>
    <td><div class="row"><button class="fb" data-a="open" data-id="${f.id}">Open in designer</button><button class="fb" data-a="dup" data-id="${f.id}">Duplicate</button></div></td></tr>`}).join('')}</tbody></table></div>
  <div class="note">Assumed design: no photo of FOPSx Web yet. Hellenic call their label designer LDII; it holds up to 4,000 formats per file and uploads them to the terminals.</div>`;
}
/* ---------- designer ---------- */
function ensureDraft(){if(!X.draft||X.draft.id!==X.fmt)X.draft=HX.clone(HX.S.formats[X.fmt]);}
function pgDesigner(){
  ensureDraft();const f=X.draft,e=X.sel!=null?f.els[X.sel]:null;const dirty=JSON.stringify(f)!==JSON.stringify(HX.S.formats[f.id]);
  const prods=Object.values(HX.S.products);
  let props='<p class="small" style="color:#5d6b78">Click an item on the label to edit it. Drag to move it.</p>';
  if(e){props=`<div class="form" style="grid-template-columns:1fr 1fr">
    <label>Type<input value="${{text:'Text',bc:'Barcode',box:'Box'}[e.t]}" disabled></label><label>&nbsp;<button class="fb" data-a="delEl" style="color:#a12a2a">Delete item</button></label>
    <label>X (mm)<input type="number" step="0.5" data-p="x" value="${e.x}"></label><label>Y (mm)<input type="number" step="0.5" data-p="y" value="${e.y}"></label>
    ${e.t==='text'?`<label>Size (mm)<input type="number" step="0.1" data-p="s" value="${e.s}"></label><label>Bold<select data-p="b"><option value="0">No</option><option value="1" ${e.b?'selected':''}>Yes</option></select></label>`:''}
    ${e.t!=='text'?`<label>Width (mm)<input type="number" step="0.5" data-p="w" value="${e.w}"></label><label>Height (mm)<input type="number" step="0.5" data-p="h" value="${e.h}"></label>`:''}
    </div>${e.t!=='box'?`<label style="margin-top:8px">Content – fixed text and {fields}<textarea rows="3" data-p="v">${esc(e.v)}</textarea></label>
    <label style="margin-top:8px">Insert field<select data-a="ins"><option value="">Choose…</option>${FIELDS.map(([k,n])=>`<option value="${k}">{${k}} ${esc(n)}</option>`).join('')}</select></label>`:''}`}
  return `<h2>Label designer</h2><p class="sub">${esc(f.name)} · ${f.w} × ${f.h} mm · saved version v${HX.S.formats[f.id].ver}${dirty?' · <b style="color:#9a4b12">unsaved changes</b>':''}</p>
  <div class="tools2">
    <label style="display:flex;align-items:center;gap:6px">Format<select data-a="pickfmt">${Object.values(HX.S.formats).map(x=>`<option value="${x.id}" ${x.id===f.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
    <label style="display:flex;align-items:center;gap:6px">Preview with<select data-a="pickprev">${prods.map(p=>`<option value="${p.plu}" ${p.plu===X.prev?'selected':''}>${p.plu} ${esc(p.label)}</option>`).join('')}</select></label>
    <span style="flex:1"></span>
    <button class="fb" data-a="addText">Add text</button><button class="fb" data-a="addBc">Add barcode</button><button class="fb" data-a="addBox">Add box</button>
    <button class="fb" data-a="revert" ${dirty?'':'disabled'}>Revert</button><button class="fb pri" data-a="saveFmt" ${dirty?'':'disabled'}>Save format</button></div>
  <div class="split"><div class="canvasWrap" id="fxCanvasWrap"><div id="fxCanvas" style="width:fit-content;box-shadow:0 2px 10px rgba(0,0,0,.15)"></div></div>
  <div class="pane">${props}</div></div>
  <div class="note">Barcodes are drawn for looks only and cannot be scanned. Field names in {braces} are the trainer’s; the real designer will use its own field list.</div>`;
}
function drawCanvas(){
  const wrap=$('#fxCanvasWrap');if(!wrap)return;const f=X.draft;
  X.px=Math.max(2.2,Math.min(5,(wrap.clientWidth-30)/f.w));
  const p=HX.S.products[X.prev]||Object.values(HX.S.products)[0];
  $('#fxCanvas').innerHTML=HX.renderLabel(f,HX.labelData(p,sampleTrans(p)),X.px,{edit:true,sel:X.sel});
}
let drag=null;
function onDown(e){const el=e.target.closest('.el');if(!el||!$('#fxCanvas').contains(el))return;
  const i=+el.dataset.el;if(X.sel!==i){X.sel=i;render();}
  const node=$('#fxCanvas').querySelector(`[data-el="${i}"]`);const it=X.draft.els[i];
  drag={i,sx:e.clientX,sy:e.clientY,ox:it.x,oy:it.y,node,moved:false};node.setPointerCapture&&node.setPointerCapture(e.pointerId);e.preventDefault()}
function onMove(e){if(!drag)return;const dx=(e.clientX-drag.sx)/X.px,dy=(e.clientY-drag.sy)/X.px;const it=X.draft.els[drag.i],f=X.draft;
  it.x=Math.max(0,Math.min(f.w-2,Math.round((drag.ox+dx)*2)/2));it.y=Math.max(0,Math.min(f.h-2,Math.round((drag.oy+dy)*2)/2));drag.moved=true;
  drag.node.style.left=it.x*X.px+'px';drag.node.style.top=it.y*X.px+'px'}
function onUp(){if(!drag)return;const m=drag.moved;drag=null;if(m)render()}

/* ---------- products ---------- */
function pgProducts(){
  const P=Object.values(HX.S.products);
  if(!X.pd||X.pd.plu!==X.prod)X.pd=HX.clone(HX.S.products[X.prod]);const p=X.pd;
  return `<h2>Products</h2><p class="sub">The product master the terminals download: label name, texts, tare, weight limits, shelf life and label format.</p>
  <div class="tw"><table><thead><tr><th>PLU</th><th>Product code</th><th>Label name</th><th>Format</th><th class="n">Tare</th><th class="n">Min</th><th class="n">Max</th><th class="n">Life</th><th>Status</th></tr></thead><tbody>
  ${P.map(x=>{const st=prodStatus(x.plu);return `<tr class="click ${x.plu===X.prod?'sel':''}" data-prod="${x.plu}"><td>${x.plu}</td><td>${esc(x.code)}</td><td>${esc(x.label)}</td><td>${esc(x.fmt)}</td><td class="n">${x.tare.toFixed(2)}</td><td class="n">${x.min.toFixed(2)}</td><td class="n">${x.max.toFixed(2)}</td><td class="n">${x.life} d</td><td><span class="b ${st[0]}">${st[1]}</span></td></tr>`}).join('')}</tbody></table></div>
  <div class="pane" style="margin-top:14px"><h2 style="font-size:15px">PLU ${p.plu} · ${esc(p.desc)}</h2><p class="sub">Source: ${p.src==='photo'?'name and code from your FOPS 8 / label photos; weights partly assumed':'assumed – not on any photo'}</p>
  <div class="form">
    <label>Label name<input data-pf="label" value="${esc(p.label)}"></label>
    <label>Supplier code<input data-pf="supplier" value="${esc(p.supplier)}"></label>
    <label>GTIN<input data-pf="gtin" value="${esc(p.gtin)}"></label>
    <label>TPND<input data-pf="tpnd" value="${esc(p.tpnd)}"></label>
    <label>TWA code<input data-pf="twa" value="${esc(p.twa)}"></label>
    <label>Label format<select data-pf="fmt">${Object.values(HX.S.formats).map(f=>`<option value="${f.id}" ${p.fmt===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label>
    <label>Preset tare (kg)<input type="number" step="0.02" data-pf="tare" value="${p.tare}"></label>
    <label>Min net (kg)<input type="number" step="0.02" data-pf="min" value="${p.min}"></label>
    <label>Max net (kg)<input type="number" step="0.02" data-pf="max" value="${p.max}"></label>
    <label>Shelf life (days)<input type="number" step="1" data-pf="life" value="${p.life}"></label>
    ${[0,1,2,3,4,5].map(i=>`<label>Text line ${i+1}<input data-pt="${i}" value="${esc(p.t[i])}"></label>`).join('')}
  </div><div class="tools2" style="margin-top:12px;margin-bottom:0"><button class="fb pri" data-a="saveProd">Save product</button><button class="fb" data-a="go-terminals">Go to Terminals to send</button></div></div>`;
}
/* ---------- terminals ---------- */
function pgTerminals(){
  const pend=HX.pending();
  const fmts=Object.values(HX.S.printerFormats).map(f=>`${esc(f.name)} v${f.ver}`).join(', ');
  const OTHER=[['Line 2','KFC / offal'],['Line 3','Cutting'],['Line 4','3 pallets, big scale (you were unsure)'],['Line 5','Guns'],['Line 6','Phase 12'],['Line 7','Bulk line'],['FP1',''],['FP2',''],['Comms 1','Comms link']];
  return `<h2>Terminals</h2><p class="sub">Products and label formats go from here to each terminal. The terminal then sends formats to its printers when someone presses Download Label Formats.</p>
  <div class="tcards">
    <div class="pane"><div class="row" style="justify-content:space-between"><b>CUTEOL:10241026</b><span class="b ${pend?'wa':'ok'}">${pend?'Changes waiting':'Up to date'}</span></div>
      <dl class="kv" style="margin:10px 0"><dt>Line</dt><dd>Cutting, end of line (live in this trainer)</dd><dt>Machine ID</dt><dd>${esc(HX.S.mach)}</dd><dt>Run number</dt><dd>${String(HX.S.run).padStart(8,'0')}</dd>
      <dt>Last sent</dt><dd>${HX.S.sentAt?new Date(HX.S.sentAt).toLocaleTimeString():'at set-up'}</dd><dt>Printer 1 has</dt><dd>${fmts}</dd><dt>Printer download</dt><dd>${HX.S.dlAt?new Date(HX.S.dlAt).toLocaleTimeString():'at set-up'}</dd></dl>
      <button class="fb pri" data-a="send" ${pend?'':'disabled'}>Send products and formats</button></div>
    ${OTHER.map(([n,d])=>`<div class="pane" style="opacity:.6"><div class="row" style="justify-content:space-between"><b>${n}</b><span class="b">Not in trainer</span></div><p class="small" style="margin:8px 0 0;color:#5d6b78">${esc(d||'From your site notes')}</p></div>`).join('')}
  </div><div class="note">Line list comes from your own brain-dump notes. Terminal names other than CUTEOL are not known yet.</div>`;
}
/* ---------- traceability ---------- */
function search(q){
  q=q.trim();const T=HX.S.trans.slice().reverse();if(!q)return[];
  const dig=q.replace(/\D/g,'');
  if(dig.length>=18)return T.filter(t=>t.serial===dig||t.serial.startsWith(dig.slice(0,17)));
  if(/^\d{6}$/.test(q))return T.filter(t=>t.fo===q||String(t.run).endsWith(q));
  if(/^\d{4}$/.test(q))return T.filter(t=>t.plu===q);
  if(/^today$/i.test(q))return T.filter(t=>new Date(t.t)>=HX.T0);
  const u=q.toUpperCase();return T.filter(t=>((HX.S.products[t.plu]||{}).label||'').includes(u)||t.station.includes(u)||t.lot===q);
}
function pgTrace(){
  const R=X.q?search(X.q):[];const h=X.hit?HX.S.trans.find(t=>t.serial===X.hit):null;
  let detail='';
  if(h){const p=HX.S.products[h.plu]||{},o=HX.order(h.fo),d=HX.decodeSerial(h.serial),f=HX.S.fmtHist[h.fmt]||HX.S.formats[p.fmt];
    const fwd=!o?'Not on a factory order – went to stock':o.status==='DESP'?`Despatched with ${o.cust} (despatch D${o.num.slice(1)})`:o.status==='COMP'?'Order complete, waiting for despatch':'Order still in production ('+o.status+')';
    detail=`<div class="split" style="margin-top:14px"><div class="pane"><h2 style="font-size:15px">Box ${h.serial}</h2>
      <p class="sub">${esc(p.label||'')} · ${h.net.toFixed(2)} kg net · ${new Date(h.t).toLocaleString()}</p>
      <div style="overflow-x:auto">${f?`<div style="width:fit-content;border:1px solid #d9dfe5">${HX.renderLabel(f,HX.labelData(Object.assign({},p,{tare:h.tare}),h),Math.min(3.6,Math.max(2,($('#fxApp').clientWidth-420)/150)))}</div><p class="small" style="color:#5d6b78">Reprint preview with the format version the printer used (${esc(h.fmt)}).</p>`:''}</div>
      <dl class="kv"><dt>Machine</dt><dd>${d.mach}</dd><dt>Run</dt><dd>${d.run}</dd><dt>PLU</dt><dd>${d.plu}</dd><dt>Net in barcode</dt><dd>${d.net} kg</dd><dt>Last 3 digits</dt><dd>${d.tail} (meaning unknown)</dd><dt>Station</dt><dd>${h.station}</dd><dt>Tare / gross</dt><dd>${h.tare.toFixed(2)} / ${h.gross.toFixed(2)} kg</dd><dt>Lot / pallet</dt><dd>${h.lot} / ${h.pallet}</dd><dt>Use by</dt><dd>${HX.lab(h.useby)}</dd><dt>Status</dt><dd>${h.void?'Deleted at the scale':'Valid'}</dd></dl></div>
      <div class="chain"><div class="step"><b>Backward · where it came from</b>Kill date ${uk(h.kill,true)} · lot ${h.lot}</div>
        <div class="step asm"><b>Backward · intake</b>Bird intake, farm and supplier batch would show here. Not in the trainer.</div>
        <div class="step"><b>Made on</b>Factory order ${h.fo||'—'}${o?' · '+esc(o.cust)+' · site '+o.site:''}<br>${esc(p.desc||'')}</div>
        <div class="step"><b>Forward · where it went</b>Pallet ${h.pallet} · ${esc(fwd)}</div>
        <div class="step"><b>Same order</b>${o?HX.orderTot(o).done+' boxes, '+HX.orderTot(o).wdone.toFixed(2)+' kg so far':'—'}</div></div></div>`}
  return `<h2>Traceability</h2><p class="sub">Find any box by its serial barcode, run number, factory order, PLU, lot or “today”. Open a box to trace it back to the kill date and forward to despatch.</p>
  <form class="tools2" data-form="trace"><input id="fxq" value="${esc(X.q)}" placeholder="Serial, FO, PLU, lot or today" style="flex:1;min-width:200px" aria-label="Trace search"><button class="fb pri" type="submit">Search</button></form>
  <div class="tools2"><span class="small" style="color:#5d6b78">Try:</span>${['13505309998000726640','093015','9980','today'].map(s=>`<button class="fb" data-try="${s}">${s}</button>`).join('')}</div>
  ${X.q?`<div class="tw"><table><thead><tr><th>Time</th><th>Serial</th><th>PLU</th><th>Product</th><th class="n">Net kg</th><th>FO</th><th>Lot</th><th>Station</th><th></th></tr></thead><tbody>
  ${R.length?R.slice(0,60).map(t=>`<tr class="click ${X.hit===t.serial?'sel':''}" data-hit="${t.serial}"><td>${new Date(t.t).toTimeString().slice(0,5)}</td><td style="font-family:var(--f-mono);font-size:12px">${t.serial}</td><td>${t.plu}</td><td>${esc((HX.S.products[t.plu]||{}).label||'')}</td><td class="n">${t.net.toFixed(2)}</td><td>${t.fo||'—'}</td><td>${t.lot}</td><td>${t.station}</td><td>${t.void?'<span class="b no">Deleted</span>':''}</td></tr>`).join(''):'<tr><td colspan="9">Nothing found.</td></tr>'}</tbody></table></div>`:''}
  ${detail}`;
}

/* ---------- side ---------- */
function renderSide(){
  const N={labels:['Label formats','List of label layouts and where each version lives: here, on the terminal, on the printer.',['Label content and layout of the M&S format (your label close-up)'],['Whole web screen designed without a photo','Version numbers and status wording']],
   designer:['Label designer','Drag items to move them. Text uses {fields} that fill from the product and the weighing. Save, then send.',['Item positions copied from the 9980 label: supplier, serial barcode, name, X02/X01, TPND, TWA, tare, GS1 barcode, keep-refrigerated line, address, use by, pack time, net'],['Designer controls','Field names','GS1 content (01)+(17)+(3103) – the label shows only (01) and (17)']],
   products:['Products','The product master. Names and codes for 9980 and the three OCADO M&S lines come from your photos.',['PLU 9980 = 37C3T9R THETFORD DRUM / CHICKEN DRUMSTICKS HWC, GTIN 05063942535479, TPND 49786049','6759, 6756, 6758 codes and descriptions (FOPS 8 order lines)'],['Weights, tare and shelf life for the OCADO lines','Hotkey PLU names']],
   terminals:['Terminals','Sending moves products and formats to the terminal. The printer only changes after Download Label Formats on the scale.',['Station CUTEOL:10241026, machine 13, run 00505309'],['Screen design','Other line names from your notes']],
   trace:['Traceability','Every box label has a serial barcode. In the photo it reads 13 505309 9980 00726 640: machine 13, run 505309, PLU 9980, 7.26 kg.',['Serial barcode digits and the 12 boxes / 111.56 kg on FO 093015'],['Intake and despatch links','Meaning of the last 3 digits','The other 11 weights on 093015 are made up to add to 111.56 kg']]}[X.page];
  $('#fxNotes').innerHTML=`<h2>This screen</h2><h3>${esc(N[0])}</h3><p>${esc(N[1])}</p><div class="tags">${N[2].map(t=>`<div class="tag r"><b>From photo:</b> ${esc(t)}</div>`).join('')}${N[3].map(t=>`<div class="tag a"><b>Assumed:</b> ${esc(t)}</div>`).join('')}</div>`;
  HX.taskList($('#fxTasks'),TASKS);
}

/* ---------- events ---------- */
const app=$('#fxApp');
app.addEventListener('click',e=>{
  const t=e.target.closest('[data-pg],[data-a],[data-prod],[data-try],[data-hit],.el');if(!t)return;const d=t.dataset;
  if(d.pg){X.page=d.pg;X.sel=null;render();return}
  if(d.prod){X.prod=d.prod;X.pd=null;render();return}
  if(d.try){X.q=d.try;X.hit=null;render();return}
  if(d.hit){X.hit=d.hit;if(d.hit==='13505309998000726640'||HX.S.trans.find(x=>x.serial===d.hit&&x.seed&&x.net===7.26))done('fxtrace');render();return}
  if(t.classList.contains('el'))return;
  switch(d.a){
    case 'open':X.fmt=d.id;X.draft=null;X.sel=null;X.page='designer';render();return;
    case 'dup':{const f=HX.clone(HX.S.formats[d.id]);let n=1;while(HX.S.formats[d.id+'-'+n])n++;f.id=d.id+'-'+n;f.name=f.name+' (copy '+n+')';f.ver=1;f.from='trainer';HX.S.formats[f.id]=f;HX.emit('edit');toast('Duplicated as '+f.id);return}
    case 'newfmt':{let n=1;while(HX.S.formats['NEW-'+n])n++;const f={id:'NEW-'+n,name:'New format '+n,w:150,h:80,ver:1,from:'trainer',els:[{t:'text',x:6,y:6,s:6,b:1,v:'{name}'},{t:'text',x:6,y:18,s:3,v:'Net {net} kg   Use by {useby}'}]};HX.S.formats[f.id]=f;HX.emit('edit');X.fmt=f.id;X.draft=null;X.page='designer';render();return}
    case 'addText':X.draft.els.push({t:'text',x:10,y:10,s:4,b:0,v:'New text'});X.sel=X.draft.els.length-1;render();return;
    case 'addBc':X.draft.els.push({t:'bc',x:10,y:10,w:60,h:12,v:'{serial}'});X.sel=X.draft.els.length-1;render();return;
    case 'addBox':X.draft.els.push({t:'box',x:5,y:5,w:40,h:20});X.sel=X.draft.els.length-1;render();return;
    case 'delEl':X.draft.els.splice(X.sel,1);X.sel=null;render();return;
    case 'revert':X.draft=null;X.sel=null;render();return;
    case 'saveFmt':{const old=HX.S.formats[X.draft.id];const f=HX.clone(X.draft);f.ver=old.ver+1;
      const ub=f.els.find(x=>x.v==='{useby}'),ou=old.els.find(x=>x.v==='{useby}');if(ub&&ou&&(ub.x!==ou.x||ub.y!==ou.y))done('fxedit');
      HX.S.formats[f.id]=f;HX.S.fmtHist[f.id+'@'+f.ver]=HX.clone(f);X.draft=HX.clone(f);HX.emit('edit');toast('Saved as version '+f.ver+'. Send it to the terminals next.');return}
    case 'saveProd':{const p=X.pd;if(!(p.min<p.max)){toast('Min must be below max');return}HX.S.products[p.plu]=HX.clone(p);HX.emit('edit');toast('PLU '+p.plu+' saved. Send it to the terminals next.');return}
    case 'go-terminals':X.page='terminals';render();return;
    case 'send':HX.send();done('fxsend');if(HX.S.termProducts['9980']&&HX.S.termProducts['9980'].life===9)done('fxprod');toast('Sent to CUTEOL:10241026');return;
  }
});
app.addEventListener('change',e=>{const t=e.target,d=t.dataset;
  if(d.a==='pickfmt'){X.fmt=t.value;X.draft=null;X.sel=null;render();return}
  if(d.a==='pickprev'){X.prev=t.value;drawCanvas();return}
  if(d.a==='ins'&&t.value&&X.sel!=null){const it=X.draft.els[X.sel];it.v=(it.v||'')+'{'+t.value+'}';render();return}
  if(d.p&&X.sel!=null){const it=X.draft.els[X.sel];it[d.p]=d.p==='v'?t.value:d.p==='b'?+t.value:parseFloat(t.value)||0;render();return}
  if(d.pf){const p=X.pd;p[d.pf]=['tare','min','max'].includes(d.pf)?parseFloat(t.value)||0:d.pf==='life'?parseInt(t.value,10)||0:d.pf==='gtin'?t.value.replace(/\D/g,''):t.value.toUpperCase();return}
  if(d.pt!=null){X.pd.t[+d.pt]=t.value.toUpperCase();return}
});
app.addEventListener('input',e=>{const d=e.target.dataset;if(d.p==='v'&&X.sel!=null){X.draft.els[X.sel].v=e.target.value;drawCanvas()}});
app.addEventListener('submit',e=>{e.preventDefault();if(e.target.dataset.form==='trace'){X.q=$('#fxq').value;X.hit=null;const r=search(X.q);if(r.length===1)X.hit=r[0].serial;if(X.hit==='13505309998000726640')done('fxtrace');render()}});
app.addEventListener('pointerdown',onDown);window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp);
window.addEventListener('resize',()=>{if(!$('#app-fopsx').hidden&&X.page==='designer')drawCanvas()});
HX.on(type=>{if(type==='task')HX.taskList($('#fxTasks'),TASKS);if(type==='reset'){X.draft=null;X.pd=null;X.sel=null;X.hit=null}
  if(!$('#app-fopsx').hidden&&['send','download','trans','reset','edit'].includes(type)&&!drag&&type!=='edit')render()});
window.HXfopsx={show:render};
})();

/* ===== app switcher ===== */
(function(){
const tabs=[...document.querySelectorAll('.apps [data-app]')];
function show(a){
  tabs.forEach(t=>{const on=t.dataset.app===a;t.setAttribute('aria-selected',on);document.getElementById('app-'+t.dataset.app).hidden=!on});
  try{localStorage.setItem('hellenic-suite-tab',a)}catch(e){}
  if(a==='scale')window.HXscaleFit&&window.HXscaleFit();
  if(a==='fops8')window.HXfops8.show();
  if(a==='fopsx')window.HXfopsx.show();
}
tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.app)));
document.querySelector('.apps').addEventListener('keydown',e=>{const i=tabs.indexOf(document.activeElement);if(i<0)return;
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const j=(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;tabs[j].focus();show(tabs[j].dataset.app);e.preventDefault()}});
const btn=document.getElementById('resetAll');let armed=false;
btn.addEventListener('click',()=>{if(!armed){armed=true;btn.textContent='Tap again to reset everything';setTimeout(()=>{armed=false;btn.textContent='Reset all trainer data'},4000);return}
  armed=false;btn.textContent='Reset all trainer data';HX.reset();document.getElementById('resetMsg').textContent='Trainer data reset.'});
let start='scale';const h=(location.hash||'').slice(1);
if(['scale','fops8','fopsx'].includes(h))start=h;else{try{start=localStorage.getItem('hellenic-suite-tab')||'scale'}catch(e){}}
show(start);
})();
