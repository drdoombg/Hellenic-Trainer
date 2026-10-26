/* ===== SCALE TERMINAL ===== */
(function(){
const $=s=>document.querySelector(s);
const esc=HX.esc,p2=HX.p2,iso=HX.iso;
const MAX=60,E=0.02,MINW=0.40;
const dstr=d=>HX.lab(d);
const addDays=n=>HX.dOff(n,new Date());
const rnd=v=>Math.round(v/E)*E;
const fmt=v=>rnd(v).toFixed(2);
function mod10(s){const d=s.replace(/\D/g,'').split('').reverse();let t=0;d.forEach((c,i)=>t+=(+c)*(i%2===0?3:1));return String((10-t%10)%10)}

/* ---------- products held by the terminal (copied from FOPSx on Send) ---------- */
const PR={};
const HOT='ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
function loadPR(){
  Object.keys(PR).forEach(k=>delete PR[k]);
  Object.values(HX.S.termProducts).forEach(p=>{PR[p.plu]={plu:p.plu,name:p.label,code:p.supplier,prodCode:p.code,desc:p.desc,tare:p.tare,min:p.min,max:p.max,life:p.life,gtin:p.gtin,sub:p.sub,fmt:p.fmt,t:p.t.slice(),test:p.plu==='9980'?'9TESTBIR':''}});
}
function hotPlu(L){if(!HX.S.hotActive)return null;const plu=HX.S.hotmap[L];return plu&&PR[plu]?PR[plu]:null}

const DEFAULT_BC='(01)*FB0014(3103)*WTN62(17)*DT2Y';
const SHIFTMAP={A:'*',B:'/',C:'-',D:'.',E:':',F:'+',G:'#',H:'(',I:')',J:'%',K:'&',L:'=',M:'_',N:'@',O:'!',P:'?',Q:'"',R:"'"};

const S={screen:'boot',stack:[],gross:0.06,target:0.06,debris:0.06,zero:0,tare:0,
  stableSince:0,jiggle:0,plu:null,entry:'',items:0,lot:'0296',fo:'',pallet:1,
  labelMode:'auto',armed:true,wState:'',trans:[],totals:{},contrast:1,shift:false,msg:'',msgT:0,
  modal:null,lastScan:'',dateAdj:0,dl:null,log:[],ncName:'',lvl:{cmd1:false,cmd0:false},
  sec:null,rs:null,nf:null,prStage:0,prNo:1,hl:null,menus:{},lockT:0,lblKey:'',
  cfg:{ip:{ip:'192.168.16.67',mask:'255.255.254.0',gw:'192.168.16.1',port:'22156',udp:'Y',on:true},
    pr:[0,1,2].map(i=>({prev:'Y',type:'P43',dir:'0',w:'80.0',l:'150.0',x:'+0.0',y:'+0.0',rot:'0',en:i===0})),
    dest:{n:Array(9).fill(''),c:Array.from({length:9},()=>Array(10).fill('')),off:'00',ms:'1'},
    bc:['Default','',''],dateLimit:0,ser:'252892',respec:'05.00',defPlu:'0000',
    codes:{date:'',prefix:'0',k0:['NYNN','NNNN','NNNN','NNYN','NNNY','NNNN'],k1:['NNNY','NNNN','NNYN','YNNN','NNNN','NNNN'],f:['NNNNNNNNNN','NNNNYNNNNN']},
    uid:Array(20).fill(''),uact:'N',
    p43:{contrast:'+8%',start:'-130',stop:'+55',xs:'0',w:'824',len:'2600',media:'Media With Gaps',speed:'300',method:'No Ribbon (DT)',dpi:'200',dark:'55',lts:'0',ltsOn:false}},
  draft:null,fkey:null,fresh:true};
S.cfg.dest.n[0]='MENU1';
const FORMS=['ip','printers','dest','barcode','machine','userid','codes','textrec','p43','msg'];
const clone=HX.clone;
function logEv(t){const d=new Date();S.log.unshift(p2(d.getHours())+':'+p2(d.getMinutes())+':'+p2(d.getSeconds())+'  '+t);S.log.length=Math.min(S.log.length,40)}
function toast(t,ms){S.msg=t;S.msgT=Date.now()+(ms||2600);render()}

/* ---------- tasks ---------- */
const TASKS=[
 ['mode','Choose the operation mode “Add to stock, With Factory Orders”'],
 ['code','Set a practice CMD1 code (card on the right), then open COMMAND Menu 1 with it'],
 ['nocode','Open CMD1 with a wrong code and see which buttons stay switched on'],
 ['zero','Zero the scale while there is debris on the plate'],
 ['plu','Select PLU 6149 from the hotkeys or the keypad'],
 ['label','Weigh a crate inside the limits so a label prints'],
 ['reject','Put an overweight crate on and see the terminal refuse it'],
 ['del','Delete the last transaction'],
 ['hot','In Edit Hotshots, put PLU 9980 on hotkey H, then EXIT'],
 ['keyen','In Edit Codes, press MENU on a key-enable field to see which CMD1 buttons it switches on'],
 ['printer','Set Printer 1 label length to 100 mm, then press MENU to save'],
 ['p43','Press MENU again on the printer screen to reach the P43 printer settings'],
 ['barcode','In User Barcode Set-up, write a line that outputs PLU + net weight (5 digits, 2 dp), then save'],
 ['download','Download label formats to the printers']];
const done=HX.done;
function renderTasks(){HX.taskList($('#tasks'),TASKS)}

/* ---------- scale physics ---------- */
const netW=()=>S.gross-S.zero-S.tare;
const stable=()=>S.stableSince&&Date.now()-S.stableSince>600&&Date.now()>S.jiggle;
function tick(){
  const diff=S.target-S.gross;
  if(Math.abs(diff)>0.004||Date.now()<S.jiggle){S.gross+=diff*0.3+(Date.now()<S.jiggle?(Math.random()-.5)*0.18:0);S.stableSince=0}
  else{S.gross=S.target;if(!S.stableSince)S.stableSince=Date.now()}
  if(S.msg&&Date.now()>S.msgT){S.msg='';const m=$('#msgl');if(m)m.textContent=''}
  if(S.screen==='lock'){const left=Math.ceil((S.lockT-Date.now())/1000);const el=$('#lockN');if(el)el.textContent=Math.max(0,left);if(left<=0){back()}}
  if(S.screen==='weigh'&&!S.modal&&PR[S.plu]){
    const p=PR[S.plu],n=netW(),st=stable();
    if(n<=0.2&&!S.armed){S.armed=true;S.wState=''}
    if(n<=0.2&&(S.wState==='UNDER'||S.wState==='OVER'))S.wState='';
    if(st&&S.armed&&n>=MINW){
      if(n<p.min-1e-9)S.wState='UNDER';
      else if(n>p.max+1e-9){S.wState='OVER';done('reject')}
      else if(S.labelMode==='auto')printLabel();
      else S.wState='READY';
    }
    updWeigh();
  }
  updWB();
}
function updWB(){
  const st=stable(),n=S.gross-S.zero-S.tare;
  const s=$('#wSt');
  if(!st){s.style.background='#e2532e';s.innerHTML='MOTION'}else{s.style.background='#3dbd4a';s.innerHTML='SET<br><br>ZERO'}
  $('#wGm').textContent=S.tare>0?'NET':'GROSS';
  $('#wVal').textContent=fmt(n)+' kg';
  $('#wPg').style.width=Math.max(0,Math.min(100,(S.gross-S.zero)/MAX*100))+'%';
  const t=$('#wTb');
  if(S.tare>0){t.style.background='#e2532e';t.innerHTML='Cancel<br>TARE'}else{t.style.background='#e6e03a';t.innerHTML='Semi-auto<br>TARE'}
  $('#simRead').textContent=`gross ${S.gross.toFixed(3)} kg · zero ${S.zero.toFixed(2)} · tare ${S.tare.toFixed(2)} · ${st?'stable':'in motion'}`;
}
function setTarget(v){S.target=Math.max(0,Math.min(MAX+2,v));S.stableSince=0;$('#slider').value=S.target}

/* ---------- barcode evaluator (User Barcode Set-up) ---------- */
function pickDate(c){const life=(PR[S.plu]||{life:10}).life;
  if(c==='1'||c==='P'||c==='T')return addDays(0);
  if(c==='2'||c==='B')return addDays(life+S.dateAdj);
  if(c==='3'||c==='K')return addDays(0);
  return addDays(life+S.dateAdj)}
function fmtDate(d,m){const y=d.getFullYear(),yy=String(y).slice(2),mm=p2(d.getMonth()+1),dd=p2(d.getDate());
  if(m==='D')return dd+mm+yy;if(m==='Y')return yy+mm+dd;if(m==='Z')return y+mm+dd;
  const doy=Math.floor((d-new Date(y,0,0))/864e5);return yy+String(doy).padStart(3,'0')}
function wtStr(v,l,d){v=Math.max(0,v);return String(Math.round(rnd(v)*Math.pow(10,+d))).padStart(+l,'0').slice(-l)}
function evalBC(f,t){
  if(!f||!f.trim())return{out:'',err:[]};
  if(f.trim().toUpperCase()==='DEFAULT')f=DEFAULT_BC;
  const R=[
   [/^FB(\d\d)(\d\d)/,m=>t.gtin.substr(+m[1],+m[2])],
   [/^BC(\d\d)(\d\d)/,m=>(t.scan||'').substr(+m[1],+m[2])],
   [/^DT([1234PKBMXT])([DYZJ])/,m=>fmtDate(pickDate(m[1]),m[2])],
   [/^BA(\d)/,m=>t.batch.slice(-m[1])],
   [/^WT([NGT])(\d)(\d)/,m=>wtStr(t[{N:'net',G:'gross',T:'tare'}[m[1]]],m[2],m[3])],
   [/^WT(\d)(\d)/,m=>wtStr(t.net,m[1],m[2])],
   [/^MN(\d)/,m=>String(HX.S.mach).padStart(+m[1],'0').slice(-m[1])],
   [/^SN(\d)/,m=>S.cfg.ser.padStart(+m[1],'0').slice(-m[1])],
   [/^RN/,()=>String(HX.S.run).padStart(8,'0')],
   [/^LT(\d)/,m=>t.lot.slice(0,+m[1])],
   [/^PC(\d)/,m=>t.code.slice(0,+m[1])],
   [/^PP/,()=>t.plu],
   [/^PS/,()=>String(t.n).padStart(6,'0')],
   [/^TT/,()=>'01'],
   [/^TX(\d\d)/,m=>t.name.slice(0,+m[1])],
   [/^IT(\d)/,m=>String(t.items).padStart(+m[1],'0').slice(-m[1])],
   [/^FN([1-4])/,m=>'‹FNC'+m[1]+'›'],
   [/^CD([0-3])/,(m,out)=>m[1]==='0'?'':mod10(out.replace(/‹FNC\d›/g,''))],
   [/^DO/,()=>'000000'],[/^FO/,()=>S.fo||'000000'],[/^PA/,()=>String(S.pallet).padStart(4,'0')]];
  let out='',i=0;const err=[];
  while(i<f.length){
    if(f[i]!=='*'){out+=f[i++];continue}
    const rest=f.slice(i+1);let hit=false;
    for(const [re,fn] of R){const m=rest.match(re);if(m){out+=fn(m,out);i+=1+m[0].length;hit=true;break}}
    if(!hit){err.push('Unknown command at “*'+rest.slice(0,4)+'”');out+='*';i++}
  }
  return{out,err};
}
function curTrans(){const p=PR[S.plu]||PR['9980']||Object.values(PR)[0];return{plu:p.plu,code:p.code,name:p.name,gtin:p.gtin,net:netW(),gross:S.gross-S.zero,tare:S.tare,lot:S.lot,batch:S.lot,items:S.items+1,n:S.trans.length+1,scan:S.lastScan}}

/* ---------- labels: format from FOPSx (terminal copy for preview, printer copy for print) ---------- */
function prodFor(plu){const tp=HX.S.termProducts[plu]||{};const p=PR[plu];return Object.assign({},tp,{label:p.name,supplier:p.code,t:p.t,tare:S.tare||p.tare,gtin:p.gtin,life:p.life,plu})}
function previewTrans(){const p=PR[S.plu];const n=Math.max(0,rnd(netW()));
  const t={plu:p.plu,net:n,tare:S.tare,gross:rnd(S.gross-S.zero),t:new Date().toISOString(),fo:S.fo,lot:S.lot,useby:iso(addDays(p.life+S.dateAdj)),mach:HX.S.mach,run:HX.S.run+1};
  t.serial=HX.serialFor(t);return t}
function fmtOf(store,id){return store[id]||store['GEN-CASE']||Object.values(store)[0]}
function labelPreview(){const p=PR[S.plu];const f=fmtOf(HX.S.termFormats,p.fmt);
  const html=HX.renderLabel(f,HX.labelData(prodFor(p.plu),previewTrans()),3.6);
  return `<div style="transform:scale(1,${(208/(f.h*3.6)).toFixed(4)});transform-origin:top left">${html}</div>`}
function printLabel(){
  const p=PR[S.plu],n=rnd(netW()),pf=fmtOf(HX.S.printerFormats,p.fmt);
  const o=S.fo?HX.order(S.fo):null;
  const t=HX.addTrans({plu:p.plu,net:n,tare:S.tare,gross:rnd(S.gross-S.zero),fo:S.fo||'',lot:S.lot,useby:iso(addDays(p.life+S.dateAdj)),kill:o?o.kill:iso(HX.T0),pallet:String(S.pallet).padStart(4,'0'),fmt:pf.id+'@'+pf.ver});
  const tr={n:S.trans.length+1,plu:p.plu,name:p.name,net:n,tare:S.tare,serial:t.serial,void:false,fmtKey:t.fmt,data:HX.labelData(prodFor(p.plu),t)};
  S.trans.unshift(tr);S.items++;
  const T=S.totals[p.plu]||(S.totals[p.plu]={n:0,kg:0});T.n++;T.kg+=n;
  S.armed=false;S.wState='LABELLED';done('label');logEv(`LABEL PLU ${p.plu} ${n.toFixed(2)}kg RUN ${t.run}`);
  feed({type:'label',tr,fmt:pf});render();
}

/* ---------- printer feed ---------- */
const FEED=[];
function feed(x){FEED.unshift(x);FEED.length=Math.min(FEED.length,20);renderFeed()}
function renderFeed(){
  if(!FEED.length){$('#feed').innerHTML='<p class="small">Labels and reports the terminal prints will appear here.</p>';return}
  $('#feed').innerHTML=FEED.map(x=>{
    if(x.type==='label'){const t=x.tr;return `<div><div class="plabel ${t.void?'void':''}">${HX.renderLabel(x.fmt,t.data,2.1)}</div><div class="small" style="margin-top:3px">${t.void?'Deleted · ':''}${esc(x.fmt.name)} v${x.fmt.ver} · run ${esc(t.serial.slice(2,8))} · ${t.net.toFixed(2)} kg</div></div>`}
    return `<div class="ticket">${esc(x.text)}</div>`}).join('');
}
function report(title,lines){feed({type:'rep',text:'*** '+title+' ***\n'+lines.join('\n')+'\n'+dstr(new Date())+' '+new Date().toTimeString().slice(0,5)})}

/* ---------- navigation ---------- */
function go(scr){S.stack.push(S.screen);S.screen=scr;enter();render()}
function replace(scr){S.screen=scr;enter();render()}
function back(){S.screen=S.stack.pop()||'plu';S.modal=null;enter(true);render()}
function enter(returning){
  S.shift=false;S.prStage=0;
  if(S.screen==='plu'){S.lvl={cmd1:false,cmd0:false};S.fo='';}
  if(FORMS.includes(S.screen)){
    if(!returning||!S.draft||S.draftFor!==S.screen){
      S.draft=clone(S.cfg);S.draft.mach=String(HX.S.mach);S.draft.run=String(HX.S.run).padStart(8,'0');
      S.draft.tx=S.recPlu&&PR[S.recPlu]?PR[S.recPlu].t.slice():['','','','','',''];S.draft.msg={text:''};S.draftFor=S.screen}
    S.fkey=fieldOrder()[0]||null;S.fresh=true;
    if(S.screen==='p43')done('p43');
  }else{S.fkey=null;}
  if(S.screen==='hotshots'&&!returning){const h={};HOT.forEach(L=>h[L]=HX.S.hotmap[L]||'0000');S.hs={map:h,act:HX.S.hotActive,sel:'A',fresh:true}}
  if(S.screen==='weigh'&&!returning){const p=PR[S.plu];S.tare=p.tare;S.armed=true;S.wState='';S.dateAdj=0;const o=HX.findOrder(p.plu);S.fo=o?o.num:'';S.lblKey=''}
}
function fieldOrder(){
  switch(S.screen){
    case 'ip':return['ip.ip','ip.mask','ip.gw','ip.port','ip.udp'];
    case 'printers':{const a=[];['prev','type','dir','w','l','x','y','rot'].forEach(f=>[0,1,2].forEach(i=>a.push('pr.'+i+'.'+f)));return a}
    case 'dest':return[...Array(9)].map((_,i)=>'dest.n.'+i).concat(['dest.off','dest.ms']);
    case 'barcode':return['bc.0','bc.1','bc.2'];
    case 'machine':return['mach','run'];
    case 'userid':return[...Array(20)].map((_,i)=>'uid.'+i).concat(['uact']);
    case 'codes':{const a=['codes.date','codes.prefix'];for(let r=0;r<6;r++)a.push('codes.k0.'+r,'codes.k1.'+r);return a.concat(['codes.f.0','codes.f.1'])}
    case 'textrec':return[0,1,2,3,4,5].map(i=>'tx.'+i);
    case 'p43':return['p43.contrast','p43.start','p43.stop','p43.xs','p43.w','p43.len','p43.speed','p43.dark','p43.lts'];
    case 'msg':return['msg.text'];
  }return[];
}
const gp=k=>k.split('.').reduce((o,p)=>o==null?o:o[p],S.draft);
function sp(k,v){const a=k.split('.'),l=a.pop();a.reduce((o,p)=>o[p],S.draft)[l]=v}
function maxLen(k){if(/^ip\.(ip|mask|gw)/.test(k))return 15;if(k==='ip.port')return 5;if(/udp|prev|dir|\.ms$|uact/.test(k))return 1;
  if(/^pr/.test(k))return 6;if(/^dest\.n/.test(k))return 8;if(/^dest\.c/.test(k))return 2;if(k==='dest.off')return 2;if(/^bc/.test(k))return 40;
  if(k==='mach')return 2;if(k==='run')return 8;if(k==='codes.date')return 6;if(k==='codes.prefix')return 1;if(/codes\.k/.test(k))return 4;if(/codes\.f/.test(k))return 10;
  if(/^uid/.test(k))return 6;if(/^tx/.test(k))return 24;if(/^p43/.test(k))return 6;if(k==='msg.text')return 30;return 10}
const isYN=k=>/codes\.[kf]|uact|udp|prev/.test(k);
const isNum=k=>/^(mach|run|codes\.prefix)$/.test(k);
function nextField(d){const o=fieldOrder();if(!o.length)return;
  if(S.screen==='msg'&&d>0){sendMsg();return}
  let i=o.indexOf(S.fkey);i=(i+d+o.length)%o.length;S.fkey=o[i];S.fresh=true;render()}

/* ---------- security code prompt ---------- */
function askCode(kind,then){S.sec={kind,val:'',then};go('sec');updHint()}
function secKey(k){
  const s=S.sec;if(!s)return;
  if(k==='ESC'){S.sec=null;back();updHint();return}
  if(k==='DEL'){s.val=s.val.slice(0,-1)}
  else if(k==='ENTER'){secCheck();return}
  else if(k==='↑'){S.shift=!S.shift}
  else if(k.length===1&&/[A-Z0-9]/.test(k)&&s.val.length<8){s.val+=k}
  render();
}
function secCheck(){
  const s=S.sec;const code=(HX.S.codes[s.kind.toLowerCase()]||'').toUpperCase();
  const ok=!!code&&s.val===code;S.sec=null;
  if(s.kind==='CMD1'||s.kind==='CMD0'){
    S.lvl[s.kind.toLowerCase()]=ok;logEv(s.kind+(ok?' CODE OK':' CODE NOT ACCEPTED'));
    if(s.kind==='CMD1')done(ok?'code':'nocode');
    replace(s.kind.toLowerCase());
  }else{
    if(ok){logEv('SETUP CODE OK');S.ncName=s.then;replace('nc')}else{logEv('SETUP CODE NOT ACCEPTED');back()}
  }
  updHint();
}
let helpTimer=null;
function helpEnter(){
  if(S.screen!=='sec'||!S.sec)return;
  const code=(HX.S.codes[S.sec.kind.toLowerCase()]||'').toUpperCase();
  if(!code){$('#codeHint').textContent='No '+S.sec.kind+' code is set yet. Type one in the box above and press Save codes.';return}
  clearTimeout(helpTimer);S.sec.val='';let i=0;
  const step=()=>{if(S.screen!=='sec'||!S.sec){S.hl=null;return}
    if(i<code.length){S.hl=code[i];S.sec.val+=code[i];i++;render();helpTimer=setTimeout(step,650)}
    else if(i===code.length){S.hl='ENTER';i++;render();helpTimer=setTimeout(step,700)}
    else{S.hl=null;secCheck()}};
  step();
}
function updHint(){
  const b=$('#helpEnter'),h=$('#codeHint');
  if(S.screen==='sec'&&S.sec){b.hidden=false;const set=!!HX.S.codes[S.sec.kind.toLowerCase()];
    h.textContent=set?`The terminal is asking for the ${S.sec.kind} code. Type it on the on-screen keys (or your keyboard) and press ENTER. “Help me enter it” types it for you, one key at a time.`
      :`No ${S.sec.kind} code is set, so any entry counts as wrong. Set one above first.`}
  else{b.hidden=true;h.textContent=S.lvl.cmd1?'CMD1 is open with full access.':'A wrong code still opens CMD1 and CMD0, but only the buttons switched on in Edit Codes (CMD0/1 Key Enables) work.'}
}

/* ---------- record selector: Edit Products / Texts / Menus ---------- */
function openRec(kind){S.rs={kind,val:kind==='MENU'?'000':'0000',stage:'num'};go('recsel')}
function rsKey(k){
  const r=S.rs;if(!r)return;
  if(r.stage==='num'){
    if(/^\d$/.test(k)){r.val=(r.val+k).slice(-r.val.length)}
    else if(k==='DEL'){r.val=('0'+r.val).slice(0,r.val.length)}
    else if(k==='ESC'){back();return}
    else if(k==='ENTER'){
      if(r.kind==='MENU'){r.stage=S.menus[r.val]?'ask':'create'}
      else r.stage=PR[r.val]?'ask':'missing';
    }
  }else if(r.stage==='ask'){
    if(k==='E'){S.recPlu=r.val;if(r.kind==='PLU')go('prodrec');else if(r.kind==='TEXT')go('textrec');else{S.ncName='Menu editor';go('nc')}return}
    if(k==='R'){S.modal={kind:'confirm',text:`Remove ${r.kind==='PLU'?'PLU':r.kind==='TEXT'?'text':'menu'} ${r.val} from this terminal?`,yes(){
      if(r.kind==='PLU'){delete PR[r.val];logEv('PLU '+r.val+' REMOVED')}else if(r.kind==='TEXT'){if(PR[r.val])PR[r.val].t=['','','','','',''];logEv('TEXT '+r.val+' REMOVED')}else{delete S.menus[r.val]}
      r.stage='num';toast('Removed')}};}
    if(k==='ESC'||k==='N')r.stage='num';
  }else if(r.stage==='create'||r.stage==='missing'){
    if(k==='Y'){if(r.kind==='MENU'){S.menus[r.val]=[];logEv('MENU '+r.val+' CREATED');r.stage='ask';toast('Menu '+r.val+' created')}else{toast('New PLUs come from FOPSx Web in this trainer');r.stage='num'}}
    else if(k==='N'||k==='ESC')r.stage='num';
  }
  render();
}

/* ---------- numeric single-value screens ---------- */
function openNum(label,val,ok,id){S.nf={label,val,ok,id};go('numf')}
function nfKey(k){const n=S.nf;if(!n)return;
  const digits=n.val.replace(/\D/g,'');const put=d=>{let i=0;n.val=n.val.replace(/\d/g,()=>d[i++])};
  if(/^\d$/.test(k))put((digits+k).slice(-digits.length));
  else if(k==='DEL')put(('0'+digits).slice(0,digits.length));
  else if(k==='ENTER'){n.ok(n.val);back();toast('Saved');return}
  render()}

/* ---------- hotshot map ---------- */
function hsKey(k){const h=S.hs;if(!h)return;
  if(/^\d$/.test(k)){const v=h.fresh?'000'+k:(h.map[h.sel]+k).slice(-4);h.map[h.sel]=v.slice(-4);h.fresh=false}
  else if(k==='DEL'){h.map[h.sel]=('0'+h.map[h.sel]).slice(0,4);h.fresh=false}
  else if(k==='ENTER'){const i=HOT.indexOf(h.sel);h.sel=HOT[(i+1)%HOT.length];h.fresh=true}
  else if(k==='ACT'){h.act=!h.act}
  else if(k==='EXIT'){
    const m={};HOT.forEach(L=>{if(h.map[L]&&h.map[L]!=='0000')m[L]=h.map[L]});
    const bad=Object.values(m).filter(p=>!PR[p]);
    HX.S.hotmap=m;HX.S.hotActive=h.act;HX.emit('hot');
    if(m.H==='9980')done('hot');logEv('HOTSHOT MAP SAVED');back();toast(bad.length?'Saved. Not on file: PLU '+bad.join(', '):'Hotshot map saved');return}
  render()}

/* ---------- input handling ---------- */
function alphaKey(k){
  if(S.modal)return;
  if(S.screen==='sec'){secKey(k);return}
  if(S.screen==='recsel'){rsKey(k);return}
  if(S.screen==='interr'||S.screen==='lock')return;
  if(k==='↑'){S.shift=!S.shift;render();return}
  if(!S.fkey)return;
  S.prStage=0;
  if(k==='ENTER'||k==='>'){nextField(1);return}
  if(k==='<'){nextField(-1);return}
  let v=String(gp(S.fkey)??'');
  if(k==='ESC'){const src=Object.assign(clone(S.cfg),{mach:String(HX.S.mach),run:String(HX.S.run).padStart(8,'0'),tx:S.recPlu&&PR[S.recPlu]?PR[S.recPlu].t:[],msg:{text:''}});sp(S.fkey,String(S.fkey.split('.').reduce((o,p)=>o==null?o:o[p],src)??''));S.fresh=true;render();return}
  if(k==='DEL'){v=S.fresh?'':v.slice(0,-1)}
  else{let ch=k==='SPACE'?' ':k;if(S.shift&&SHIFTMAP[ch]){ch=SHIFTMAP[ch];S.shift=false}
    if(isYN(S.fkey)&&!/^[YN]$/.test(ch))return;
    if(isNum(S.fkey)&&!/^\d$/.test(ch))return;
    if(S.fresh)v='';if(v.length<maxLen(S.fkey))v+=ch}
  S.fresh=false;sp(S.fkey,v);render();
}
function pluKey(k){
  if(S.modal)return;
  if(S.screen==='numf'){if(!/CMD/.test(k))nfKey(k);return}
  if(S.screen==='hotshots'){hsKey(k);return}
  if(/^\d$/.test(k)){S.entry=(S.entry+k).slice(-4)}
  else if(k==='DEL')S.entry=S.entry.slice(0,-1);
  else if(k==='ENTER'){selectPlu(S.entry.padStart(4,'0'));return}
  else if(k==='CMD1'){askCode('CMD1');return}
  else if(k==='CMD0'){askCode('CMD0');return}
  render();
}
function selectPlu(plu){
  if(!PR[plu]){toast('PLU '+plu+' not found');S.entry='';return}
  S.plu=plu;S.entry='';if(plu==='6149')done('plu');logEv('PLU SELECT '+plu);go('weigh');
}
function modalKey(k){
  const m=S.modal;if(!m)return;
  if(m.kind==='confirm'||m.kind==='info'){S.modal=null;if(k==='YES')m.yes&&m.yes();else m.no&&m.no();render();return}
  if(k==='ESC'){S.modal=null;render();return}
  if(k==='DEL'){m.val=m.val.slice(0,-1)}
  else if(k==='±'){m.val=m.val.startsWith('-')?m.val.slice(1):'-'+m.val}
  else if(k==='.'){if(!m.val.includes('.'))m.val+='.'}
  else if(k==='ENTER'){const r=m.ok(m.val);if(r!==false)S.modal=null}
  else if(m.val.replace('-','').length<(m.max||6))m.val+=k;
  render();
}
function snap(scr,o){switch(scr){case 'ip':return o.ip;case 'printers':return o.pr;case 'dest':return o.dest;case 'barcode':return o.bc;case 'userid':return[o.uid,o.uact];case 'codes':return o.codes;case 'p43':return o.p43;
  case 'machine':return o===S.draft?[o.mach,o.run]:[String(HX.S.mach),String(HX.S.run).padStart(8,'0')];case 'textrec':return o===S.draft?o.tx:(PR[S.recPlu]||{}).t;}return null}
const changed=()=>FORMS.includes(S.screen)&&S.screen!=='msg'&&JSON.stringify(snap(S.screen,S.draft))!==JSON.stringify(snap(S.screen,S.cfg));
function act(a){
  if(a==='C+'){S.contrast=Math.min(1.5,S.contrast+0.1);applyContrast();return}
  if(a==='C-'){S.contrast=Math.max(0.6,S.contrast-0.1);applyContrast();return}
  if(S.screen==='lock')return;
  if(a==='ZERO'){
    if(!stable()){toast('Scale in motion – cannot zero');return}
    const g=S.gross;if(Math.abs(g)<=0.02*MAX){const was=Math.abs(g-S.zero);S.zero=g;if(was>=0.02)done('zero');logEv('ZERO SET');toast('Zero set')}
    else toast('Outside zero range (±1.20 kg)');return}
  if(a==='TARE'){
    if(S.tare>0){S.tare=0;logEv('TARE CANCELLED');render();return}
    if(!stable()){toast('Scale in motion – cannot tare');return}
    const g=S.gross-S.zero;if(g<=0){toast('Nothing on the plate to tare');return}
    S.tare=rnd(g);logEv('SEMI-AUTO TARE '+S.tare.toFixed(2));render();return}
  if(a==='MENU'){
    if(S.modal)return;
    if(S.screen==='printers'){printersMenu();return}
    if(S.screen==='codes'){codesMenu();return}
    if(S.screen==='msg'){sendMsg();return}
    if(FORMS.includes(S.screen)){save();return}
    return}
  if(a==='RETURN'){
    if(S.modal){S.modal=null;render();return}
    if(['boot','download','mode','interr'].includes(S.screen))return;
    if(S.screen==='sec'){S.sec=null;back();updHint();return}
    if(S.screen==='codes'&&changed()){S.modal={kind:'confirm',text:'Save changes to Edit Codes?',yes(){save()},no(){back()}};render();return}
    if(changed()){S.msg='Changes not saved';S.msgT=Date.now()+2200}
    if(S.screen==='weigh'){S.tare=0}
    if(S.screen==='hotshots'){S.msg='Hotshot map not saved – press EXIT to save';S.msgT=Date.now()+2600}
    back();return}
  if(a==='NEXT'){if(S.screen==='cmd1'){S.ncName='COMMAND Menu 1, page 2';go('nc')}return}
  if(a==='PREV'){if(S.screen==='nc'&&/page 2/.test(S.ncName))back();return}
}
function save(){
  const d=S.draft;
  switch(S.screen){
    case 'machine':HX.S.mach=d.mach.padStart(2,'0');HX.S.run=parseInt(d.run||'0',10);HX.emit('cfg');break;
    case 'userid':S.cfg.uid=d.uid.slice();S.cfg.uact=d.uact;break;
    case 'codes':S.cfg.codes=clone(d.codes);break;
    case 'textrec':if(PR[S.recPlu])PR[S.recPlu].t=d.tx.slice();break;
    case 'p43':S.cfg.p43=clone(d.p43);break;
    default:{const k={ip:'ip',printers:'pr',dest:'dest',barcode:'bc'}[S.screen];if(k)S.cfg[k]=clone(d[k])}
  }
  if(S.screen==='barcode'&&S.cfg.bc.some(l=>/\*PP/i.test(l)&&/\*WTN?52/i.test(l)))done('barcode');
  logEv('SAVED '+S.screen.toUpperCase());S.msg='Saved';S.msgT=Date.now()+2000;
  if(S.screen==='p43'){render();return}
  back();
}
function printersMenu(){
  if(S.prStage===1){const no=S.prNo,pr=S.cfg.pr[no-1];
    if(!pr.en){S.prStage=0;toast('Printer '+no+' is disabled');return}
    S.stack.push(S.screen);S.screen='interr';S.prStage=0;render();
    setTimeout(()=>{if(S.screen==='interr')replace('p43')},1500);return}
  const wasChanged=changed();
  S.cfg.pr=clone(S.draft.pr);
  if(parseFloat(S.cfg.pr[0].l)===100)done('printer');
  if(wasChanged)logEv('SAVED PRINTERS');
  S.prNo=S.fkey?(+S.fkey.split('.')[1]+1):1;S.prStage=1;render();
}
function codesMenu(){
  const k=S.fkey||'';
  if(/codes\.k([01])/.test(k)){S.prev={menu:'cmd'+k.match(/codes\.k([01])/)[1],rows:clone(S.draft.codes['k'+k.match(/codes\.k([01])/)[1]])};done('keyen');go('keyprev');return}
  if(/codes\.f/.test(k)){S.prev={menu:'fn',f:clone(S.draft.codes.f)};go('keyprev');return}
  save();
}
function sendMsg(){const t=(S.draft.msg.text||'').trim();if(!t){toast('Type a message first');return}
  HX.S.msgs.push({t:new Date().toISOString(),from:'CUTEOL:10241026',text:t,read:false});HX.emit('msg');logEv('MESSAGE TO FOPS');back();toast('Message sent to FOPS')}
function applyContrast(){$('#scr').style.filter=`contrast(${S.contrast}) brightness(${1+(S.contrast-1)*-0.25})`}

/* ---------- command handlers ---------- */
function cmd(id,name){
  const nc=()=>{S.ncName=name.replace(/\n/g,' ');go('nc')};
  switch(id){
    case 'printers':case 'more':case 'dest':case 'barcode':case 'ip':case 'machine':case 'utility':case 'userid':case 'codes':case 'hotshots':go(id);return;
    case 'recPLU':openRec('PLU');return;case 'recText':openRec('TEXT');return;case 'recMenu':openRec('MENU');return;
    case 'setup':askCode('SETUP','Set-up Menu');return;case 'backup':askCode('SETUP','Backup Management');return;
    case 'respec':openNum('Enter Allowable Error Margin (%) :',S.cfg.respec,v=>{S.cfg.respec=v;logEv('RESPEC MARGIN '+v)});return;
    case 'kdl':openNum('Enter Kill Date Adjust Limit :',String(S.cfg.dateLimit).padStart(2,'0'),v=>{S.cfg.dateLimit=parseInt(v,10);logEv('KILL DATE ADJUST LIMIT '+v)});return;
    case 'defplu':openNum('Enter Default PLU :',S.cfg.defPlu,v=>{S.cfg.defPlu=v;logEv('DEFAULT PLU '+v)});return;
    case 'printTotals':S.modal={kind:'confirm',text:'Print PLU totals and zero them?',yes(){
      const ks=Object.keys(S.totals);report('PLU TOTALS',ks.length?ks.map(k=>`PLU ${k}  ${String(S.totals[k].n).padStart(4)} items  ${S.totals[k].kg.toFixed(2).padStart(9)} kg`):['No totals']);S.totals={};logEv('PLU TOTALS ZEROED');toast('Totals printed and zeroed')}};render();return;
    case 'printPlu':report('PLU DATA',Object.values(PR).map(p=>`${p.plu} ${p.code} ${p.name.slice(0,18).padEnd(18)} T${p.tare.toFixed(2)} ${p.min}-${p.max}kg L${p.life}`));toast('Printing PLU data');return;
    case 'printText':report('TEXT DATA',Object.values(PR).filter(p=>p.t.some(Boolean)).map(p=>`${p.plu}: ${p.t.filter(Boolean).join(' | ')}`));toast('Printing text data');return;
    case 'printSetup':report('CURRENT SET-UP',[`Machine ${HX.S.mach}  Run ${String(HX.S.run).padStart(8,'0')}`,`IP ${S.cfg.ip.ip}  Port ${S.cfg.ip.port}`,`Labelling ${S.labelMode.toUpperCase()}`,`Kill date adjust limit ${S.cfg.dateLimit}`,`Respec margin ${S.cfg.respec}%`,...S.cfg.pr.map((p,i)=>`Printer ${i+1} ${p.en?'ON ':'OFF'} ${p.type} ${p.w}x${p.l}mm`)]);toast('Printing set-up');return;
    case 'download':startDownload('Printer');return;
    case 'fastdrv':startDownload('FASTDRV');return;
    case 'clearBuf':S.modal={kind:'confirm',text:'Clear the transaction buffer?',yes(){S.trans=[];logEv('TRANSACTION BUFFER CLEARED');toast('Transaction buffer cleared')}};render();return;
    case 'printYield':{const kg=S.trans.filter(t=>!t.void).reduce((a,t)=>a+t.net,0);report('YIELD INFORMATION',[`Labels ${S.trans.filter(t=>!t.void).length}`,`Net output ${kg.toFixed(2)} kg`,'Input weight: not recorded on this station']);toast('Printing yield');return}
    case 'toggleMode':S.labelMode=S.labelMode==='auto'?'manual':'auto';logEv('LABELLING MODE '+S.labelMode.toUpperCase());toast('Labelling mode: '+S.labelMode.toUpperCase());return;
    case 'log':go('log');return;
    case 'printBc':report('USER BARCODE SET-UP',S.cfg.bc.map((l,i)=>`${i+1}. ${l||'(blank)'}`));toast('Printing barcode set-up');return;
    case 'unlock':logEv('SCALE UNLOCK');toast('Scale unlocked');return;
    case 'restart':S.stack=[];S.screen='boot';boot();return;
    /* CMD0 */
    case 'delLabel':delLast();return;
    case 'batch':S.modal={kind:'num',title:'Batch Number',val:S.lot,max:4,ok(v){S.lot=v.padStart(4,'0');logEv('BATCH '+S.lot)}};render();return;
    case 'lot':S.modal={kind:'num',title:'Lot Number',val:S.lot,max:4,ok(v){S.lot=v.padStart(4,'0');logEv('LOT '+S.lot)}};render();return;
    case 'showTare':S.modal={kind:'info',text:`Current tare ${S.tare.toFixed(2)} kg`};render();return;
    case 'clearLabels':S.modal={kind:'confirm',text:'Clear the label buffer?',yes(){logEv('LABEL BUFFER CLEARED');toast('Label buffer cleared')}};render();return;
    case 'endPallets':S.modal={kind:'confirm',text:'End all pallets?',yes(){S.pallet++;logEv('ALL PALLETS ENDED');toast('Pallet '+String(S.pallet).padStart(4,'0'))}};render();return;
    case 'zeroTotals':S.modal={kind:'confirm',text:'Zero all totals?',yes(){S.totals={};S.items=0;logEv('ALL TOTALS ZEROED');toast('Totals zeroed')}};render();return;
    case 'lockClean':S.lockT=Date.now()+20000;go('lock');return;
    case 'p43':S.prNo=1;S.stack.push(S.screen);S.screen='interr';render();setTimeout(()=>{if(S.screen==='interr')replace('p43')},1500);return;
    case 'msg':go('msg');return;
    /* Utility */
    case 'bcTest':go('bctest');return;
    case 'node':S.modal={kind:'info',text:'Network node\nName     CUTEOL\nAddress  10241026\nIP       '+S.cfg.ip.ip};render();return;
    case 'build':S.modal={kind:'info',text:'Software build information\nnot photographed yet.\nOS: Requiem v9 (datasheet)'};render();return;
    case 'wc2':S.modal={kind:'info',text:'WC2 comms test\nFOPS 8 server: reply OK\n(trainer simulation)'};render();return;
    case 'beep':try{const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator();o.frequency.value=880;o.connect(a.destination);o.start();setTimeout(()=>{o.stop();a.close()},350)}catch(e){}toast('Beep');return;
    default:nc();
  }
}
function delLast(){const t=S.trans.find(x=>!x.void);if(!t){toast('No transaction to delete');return}
  S.modal={kind:'confirm',text:`Delete transaction #${t.n}?\nPLU ${t.plu}  ${t.net.toFixed(2)} kg`,yes(){t.void=true;S.items=Math.max(0,S.items-1);const T=S.totals[t.plu];if(T){T.n--;T.kg-=t.net}HX.voidTrans(t.serial);logEv('DELETE TRANS #'+t.n);done('del');renderFeed()}};render()}
function startDownload(kind){
  const list=kind==='FASTDRV'?[1]:S.cfg.pr.map((p,i)=>p.en?i+1:0).filter(Boolean);
  S.dl={kind,list,i:0};go('download');
  const step=()=>{if(S.screen!=='download')return;S.dl.i++;if(S.dl.i>=S.dl.list.length){
      if(kind!=='FASTDRV'){HX.downloadFormats();done('download');done('fxdl');logEv('LABEL FORMATS DOWNLOADED')}else logEv('FASTDRV.PRG DOWNLOADED');
      back();toast(kind==='FASTDRV'?'FASTDRV.PRG downloaded':'Download complete');return}render();setTimeout(step,1600)};
  setTimeout(step,1600);
}
function wfn(id,name){
  const p=PR[S.plu];
  switch(id){
    case 'lot':S.modal={kind:'num',title:'Lot No',val:S.lot,max:4,ok(v){S.lot=v.padStart(4,'0');logEv('LOT '+S.lot)}};break;
    case 'countClear':S.modal={kind:'confirm',text:'Clear the item count?',yes(){S.items=0;logEv('COUNT CLEAR')}};break;
    case 'pluTotals':{const T=S.totals[p.plu]||{n:0,kg:0};S.modal={kind:'info',text:`PLU ${p.plu} totals\n${T.n} items · ${T.kg.toFixed(2)} kg`};break}
    case 'dateAdj':S.modal={kind:'num',title:`Date adjust in days (limit ${S.cfg.dateLimit})`,val:String(S.dateAdj),signed:true,max:2,ok(v){const n=parseInt(v||'0',10);if(Math.abs(n)>S.cfg.dateLimit){toast(S.cfg.dateLimit?'Outside date adjust limit':'Date adjust limit is 00 – change it in CMD1');return false}S.dateAdj=n;logEv('DATE ADJUST '+n)}};break;
    case 'tareAdj':S.modal={kind:'num',title:'Tare (kg)',val:S.tare.toFixed(2),dec:true,max:5,ok(v){const n=parseFloat(v);if(isNaN(n)||n<0||n>MAX)return false;S.tare=rnd(n);logEv('TARE ADJUST '+S.tare.toFixed(2))}};break;
    case 'delTrans':delLast();return;
    case 'order':{const o=S.fo&&HX.order(S.fo);const l=o&&o.lines.find(x=>x.plu===p.plu);const tt=l?HX.lineTot(o,l):null;
      S.modal={kind:'info',text:o?`Factory order ${o.num}  ${o.cust}\nPLU ${p.plu}  Req ${l.req}  Done ${tt.done}\nWeight done ${tt.wdone.toFixed(2)} kg`:`No WIP factory order for PLU ${p.plu}\nLabels go to stock without an order`};break}
    case 'pallet':S.pallet++;logEv('PALLET CHANGE '+S.pallet);toast('Pallet '+String(S.pallet).padStart(4,'0'));return;
    default:S.ncName=name;go('nc');return;
  }
  render();
}

/* ---------- screen templates ---------- */
const AL=[['A','B','C','D','E','F','G','H','I','9','8','7','6','<','>'],['J','K','L','M','N','O','P','Q','R','5','4','3','2','DEL','ESC'],['S','T','U','V','W','X','Y','Z','↑','1','0','SPACE','ENTER']];
function alphaKB(top){
  let h=`<div style="position:absolute;left:84px;top:${top}px;width:520px">`;
  AL.forEach((row,r)=>{let x=0;row.forEach((k,c)=>{const wide=k==='SPACE'||k==='ENTER';const w=wide?68:34;if(c===9)x+=8;
    const lab=S.shift&&SHIFTMAP[k]?SHIFTMAP[k]:k;const small=k.length>1&&k!=='↑';
    h+=`<div class="k${S.hl===k?' hl':''}" data-ak="${k}" style="position:absolute;left:${x}px;top:${r*40}px;width:${w}px;height:40px;font-size:${small?15:30}px;${k==='↑'&&S.shift?'background:#1e2226;color:#fff':''}">${esc(lab)}</div>`;x+=w});});
  return h+'</div>';
}
const KP=[['9','8','7','6','5','CMD0','CMD1'],['4','3','2','1','0','DEL','ENTER']];
function keypad(top,last){let h='';KP.forEach((r,ri)=>r.map((k,ci)=>last&&ri===0&&ci>=5?last[ci-5]:k).forEach((k,ci)=>{
  const id=k==='HOTSHOTS'?'ACT':k;h+=`<div class="k" data-pk="${id}" style="position:absolute;left:${52+ci*88}px;top:${top+ri*60}px;width:88px;height:60px;font-size:${k.length>1?(k==='HOTSHOTS'?12:28):48}px;${k==='HOTSHOTS'?'flex-direction:column;gap:4px':''}">${k==='HOTSHOTS'?`HOTSHOTS<span style="background:${S.hs&&S.hs.act?'#d9532c':'#9aa4ae'};color:#fff;padding:1px 6px;font-size:12px">${S.hs&&S.hs.act?'ACTIVE':'OFF'}</span>`:k}</div>`}));return h}
const F=(k,txt,w)=>{const v=gp(k);const on=S.fkey===k;return `<span class="fld ${on?'on':''}" data-f="${k}" style="${w?'display:inline-block;min-width:'+w+'px':''}">${esc(txt!=null?txt:(v===''?' ':v))||'&nbsp;'}</span>`};

function modalHTML(){
  const m=S.modal;if(!m)return'';
  if(m.kind==='confirm'||m.kind==='info')return `<div class="modal"><div class="mbox"><div style="font-size:20px;white-space:pre-line;margin-bottom:14px">${esc(m.text)}</div>
    <div style="display:flex;gap:10px;justify-content:flex-end">${m.kind==='confirm'?'<div class="mb" style="width:110px" data-mk="YES">YES</div><div class="mb" style="width:110px" data-mk="NO">NO</div>':'<div class="mb" style="width:110px" data-mk="NO">OK</div>'}</div></div></div>`;
  const keys=['7','8','9','4','5','6','1','2','3',m.signed?'±':(m.dec?'.':''),'0','DEL'];
  return `<div class="modal"><div class="mbox"><div style="font-size:18px">${esc(m.title)}</div>
    <div style="font-size:34px;margin:6px 0 10px"><span class="fld on">${esc(m.val||' ')}</span></div>
    <div style="display:grid;grid-template-columns:repeat(3,70px) 90px;gap:4px">${keys.map((k,i)=>`<div class="k" data-mk="${k}" style="height:46px;font-size:${k.length>1?16:26}px;${k?'':'visibility:hidden'}">${k}</div>${i===2?'<div class="k" data-mk="ESC" style="height:46px;font-size:16px">ESC</div>':i===5?'<div class="k" data-mk="ENTER" style="height:96px;grid-row:span 2;font-size:16px">ENTER</div>':''}`).join('')}</div></div></div>`;
}
function menuGrid(title,L,menuId,rows,preview){
  const full=menuId&&S.lvl[menuId]&&!preview;
  return `<div class="title">${esc(title)}</div><div class="mgrid">${L.map(([n,id,dim],i)=>{
    let on=!dim;if(menuId&&!full){const r=rows||S.cfg.codes[menuId==='cmd1'?'k1':'k0'];on=on&&(r[Math.floor(i/4)]||'')[i%4]==='Y'}
    return `<div class="mb ${on?'':'dim'}" ${on&&!preview?`data-cmd="${id||''}" data-cn="${esc(n)}"`:''}>${esc(n)}</div>`}).join('')}</div>`;
}
function scrHTML(){
  const s=S.screen;
  if(s==='boot')return `<div style="padding:40px 30px;font-size:18px;line-height:1.7;color:#4c5a68">Requiem v9<br>Hellenic ARM board · starting terminal application<br>Loading config.ini … OK<br>Network ${esc(S.cfg.ip.ip)} … OK<br>Scale indicator … OK</div>`;
  if(s==='mode')return `<div class="title" style="margin-top:6px">Select Operation Mode</div>
    <div data-go="mode" style="position:absolute;left:24px;top:56px;width:640px;height:404px;background:#1a7be6;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:Arimo,Arial,sans-serif;font-size:19px;cursor:pointer">Add to stock, With Factory Orders</div>`;
  if(s==='plu'){
    const ent=S.entry.padStart(4,'0');
    let h=`<div style="position:absolute;left:14px;top:10px;font-size:30px;white-space:nowrap">Enter PLU : <span class="fld on">${ent}</span> Or Scan Barcode</div>`;
    HOT.forEach((L,i)=>{let col,row;if(i<21){col=i%7;row=Math.floor(i/7)}else{col=i-21+2;row=3}
      const p=hotPlu(L);
      h+=`<div class="hk" data-hot="${L}" style="position:absolute;left:${24+col*88}px;top:${56+row*68}px;width:88px;height:68px;padding-top:6px">
      <span style="font-size:15px;color:#4c5a68">${L}</span>${p?`<span style="font-size:24px;margin-top:2px">${p.plu}</span><span style="font-size:12px;color:#3a63a8;font-family:Arimo,Arial,sans-serif">${dstr(new Date())}</span><span style="font-size:10px;color:#3a63a8;align-self:flex-end;padding-right:6px">${p.sub||''}</span>`:''}</div>`});
    return h+keypad(346);
  }
  if(s==='weigh'){
    const p=PR[S.plu],o=S.fo?HX.order(S.fo):null,l=o?o.lines.find(x=>x.plu===p.plu):null,tt=l?HX.lineTot(o,l):null;
    const fk1=[['Items',S.items,'items'],['Lot No',S.lot,'lot'],['Force Qty','','x'],['Count Clear','','countClear'],['Work Group','','x'],['User Texts','','x'],['Prod Barcode','','x'],['Batch Number','','x'],['Change Scale','','x']];
    const fk2=[['PLU Totals','','pluTotals'],['Date Adjust','','dateAdj'],['Tare Adjust','','tareAdj'],['Delete Trans','','delTrans'],['Order Enquiry','','order'],['Pallet Change','','pallet'],['Pallet Label','','x'],['Down Time','','x'],['Fixed Weight','','x']];
    let h=`<div style="position:absolute;left:12px;top:6px;font-size:17px;width:540px;color:#3d4247">
      <div>PLU : ${p.plu}${p.test?'%g ('+p.test+')':''}<span style="position:absolute;left:310px">FO ${S.fo||'------'} Req.</span><span style="position:absolute;right:0">${(l?l.req:0).toFixed(2)}</span></div>
      <div style="position:relative"><span style="position:absolute;left:390px">Done</span><span id="wDone" style="position:absolute;right:0">${(tt?tt.done:S.items).toFixed(2)}</span>&nbsp;</div></div>
    <div class="lbl" data-wl="1" id="wLbl" style="left:12px;top:46px;width:540px;height:208px"></div>
    <div id="wZero" style="position:absolute;left:12px;top:262px;width:96px;height:26px;border:1px solid #555;font-size:20px;text-align:center;line-height:26px">ZERO</div>
    <div id="wNet" style="position:absolute;left:250px;top:258px;font-size:26px"></div>
    <div style="position:absolute;left:236px;top:286px;font-size:12px">Preset Tare ${S.tare.toFixed(2)}kg</div>
    <div style="position:absolute;left:392px;top:284px;background:#1e2226;color:#fff;font-size:13px;padding:0 6px">Net Weight</div>
    <div id="wState" style="position:absolute;left:124px;top:262px;font-size:13px;font-family:Arimo,Arial,sans-serif;font-weight:700"></div>
    <div style="position:absolute;left:12px;top:302px;width:540px;height:16px;border:1px solid #888;box-sizing:border-box;background:#fff">
      <div style="position:absolute;left:${barX(p.min)}px;width:${barX(p.max)-barX(p.min)}px;top:0;bottom:0;background:#e6df2c"></div>
      <div id="wFill" style="position:absolute;left:0;top:0;bottom:0;width:0"></div>
      <div id="wAve" style="position:absolute;top:-3px;width:2px;height:20px;background:#555"></div>
    </div>
    <div style="position:absolute;left:12px;top:320px;width:540px;font-size:12px;height:14px">
      <span style="position:absolute;left:${barX(p.min)-16}px">${p.min.toFixed(2)}</span><span id="wAveT" style="position:absolute;left:250px"></span><span style="position:absolute;left:${barX(p.max)-16}px">${p.max.toFixed(2)}</span></div>`;
    [fk1,fk2].forEach((row,ri)=>row.forEach(([n,v,id],ci)=>{h+=`<div class="fk" data-wf="${id}" data-wn="${esc(n)}" style="position:absolute;left:${12+ci*60}px;top:${342+ri*64}px;width:60px;height:64px">${esc(n).replace(' ','<br>')}${v!==''?`<b>${esc(v)}</b>`:''}</div>`}));
    const last=S.trans.filter(x=>!x.void).slice(0,18);
    for(let i=0;i<18;i++){const r=i%9,c=Math.floor(i/9);const t=last[i];
      h+=`<div style="position:absolute;left:${568+c*58}px;top:${18+r*48}px;width:58px;height:48px;border:1px solid #6d93c9;box-sizing:border-box;font-size:12px;display:flex;flex-direction:column;align-items:center;justify-content:center">${t?`<span>${t.net.toFixed(2)}</span><span style="font-size:9px;color:#888">#${t.n}</span>`:''}</div>`}
    return h;
  }
  if(s==='cmd1')return menuGrid('COMMAND Menu 1',CMD1,'cmd1');
  if(s==='cmd0')return menuGrid('COMMAND Menu 0',CMD0,'cmd0');
  if(s==='more')return menuGrid('More Set-up',MORE);
  if(s==='utility')return menuGrid('UTILITY Menu',UTIL);
  if(s==='keyprev'){const P=S.prev;
    if(P.menu==='fn'){const all=(P.f[0]+P.f[1]).split('');const names=['Items','Lot No','Force Qty','Count Clear','Work Group','User Texts','Prod Barcode','Batch Number','Change Scale','PLU Totals','Date Adjust','Tare Adjust','Delete Trans','Order Enquiry','Pallet Change','Pallet Label','Down Time','Fixed Weight','(spare)','(spare)'];
      return `<div class="title" style="font-size:22px">PLU Functions preview</div><div style="position:absolute;left:30px;top:56px;font-size:13px;font-family:Arimo,Arial,sans-serif;color:#b4531b">Trainer view. The meaning of Y/N here is a guess – see the notes.</div>
      <div style="position:absolute;left:30px;top:84px;display:grid;grid-template-columns:repeat(5,124px);gap:6px">${names.map((n,i)=>`<div class="mb ${all[i]==='Y'?'':'dim'}" style="height:44px;font-size:12.5px">${esc(n)}<br>${all[i]||'-'}</div>`).join('')}</div>`}
    return `<div style="position:absolute;left:14px;top:4px;font-size:13px;font-family:Arimo,Arial,sans-serif;color:#2a6fcb">Key enable preview – bright buttons work without the code</div>`+menuGrid(P.menu==='cmd1'?'COMMAND Menu 1':'COMMAND Menu 0',P.menu==='cmd1'?CMD1:CMD0,P.menu,P.rows,true)}
  if(s==='sec'){const v=S.sec?S.sec.val:'';
    return `<div style="position:absolute;left:0;right:0;top:118px;text-align:center;font-family:Arimo,Arial,sans-serif;font-size:19px;color:#555c63">Enter ${esc(S.sec?S.sec.kind:'')} Security Code</div>
    <div style="position:absolute;left:304px;top:176px;width:96px;height:22px;background:#1e2226;color:#fff;font-size:18px;line-height:22px;padding-left:4px;overflow:hidden;white-space:nowrap">${'*'.repeat(v.length)}<span style="background:#fff;color:#1e2226">${v.length<8?'X':''}</span></div>`+alphaKB(262)}
  if(s==='recsel'){const r=S.rs,big=r.kind==='TEXT';
    const lbl={PLU:'Edit PLU',TEXT:'Edit Text No.',MENU:'Edit Menu'}[r.kind];
    const q={ask:'(E)dit or (R)emove?',create:'No menu, Create?',missing:'No PLU on file, Create?'}[r.stage]||'';
    return `<div style="position:absolute;left:14px;top:${big?50:6}px;font-size:${big?19:15}px;color:#3d4247;white-space:pre">${lbl} : <span class="fld ${r.stage==='num'?'on':''}">${r.val}</span>${!big&&q?'   '+q:''}</div>${big&&q?`<div style="position:absolute;left:14px;top:120px;font-size:19px;color:#3d4247">${q}</div>`:''}`+alphaKB(320)}
  if(s==='prodrec'){const p=PR[S.recPlu];
    return `<div style="position:absolute;left:14px;top:8px;font-size:17px">Edit PLU : <span class="fld on">${p.plu}</span></div>
    <div style="position:absolute;left:40px;top:44px;font-size:17px;line-height:1.7;color:#3d4247;white-space:pre">Product code  ${esc(p.prodCode)}
Description   ${esc((p.desc||'').slice(0,34))}
Label name    ${esc(p.name)}
Supplier      ${esc(p.code)}
Preset tare   ${p.tare.toFixed(2)} kg
Min / Max     ${p.min.toFixed(2)} / ${p.max.toFixed(2)} kg
Shelf life    ${p.life} days
Label format  ${esc(p.fmt)}
GTIN          ${p.gtin}</div>
    <div style="position:absolute;left:40px;bottom:16px;font-size:14px;color:#b4531b;font-family:Arimo,Arial,sans-serif">Layout assumed – photograph the pages after (E)dit. In this trainer, change products in FOPSx Web.</div>`}
  if(s==='textrec')return `<div style="position:absolute;left:14px;top:8px;font-size:17px">Edit Text No. : ${esc(S.recPlu)}</div>
    <div style="position:absolute;left:40px;top:44px;font-size:18px;line-height:36px;white-space:pre">${[0,1,2,3,4,5].map(i=>`Line ${i+1}  ${F('tx.'+i,null,300)}`).join('\n')}</div>
    <div style="position:absolute;left:40px;top:270px;font-size:13px;color:#b4531b;font-family:Arimo,Arial,sans-serif">Layout assumed. MENU saves. Lines feed the label text fields t1–t6.</div>`+alphaKB(320);
  if(s==='hotshots'){const h=S.hs;
    let x=`<div style="position:absolute;left:14px;top:4px;font-size:19px;color:#3d4247">Edit Hotshot Map</div>`;
    HOT.forEach((L,i)=>{let col,row;if(i<21){col=i%7;row=Math.floor(i/7)}else{col=i-21+2;row=3}
      x+=`<div class="hk" data-hs="${L}" style="position:absolute;left:${24+col*88}px;top:${34+row*72}px;width:88px;height:72px;justify-content:center;gap:8px"><span style="font-size:14px;color:#4c5a68">${L}</span><span class="fld ${h.sel===L?'on':''}" style="font-size:22px">${h.map[L]}</span></div>`});
    return x+keypad(346,['HOTSHOTS','EXIT'])}
  if(s==='userid'){let x=`<div style="position:absolute;left:14px;top:4px;font-size:19px;color:#3d4247">Edit User ID Map</div>`;
    for(let i=0;i<20;i++){const r=Math.floor(i/5),c=i%5;x+=`<div style="position:absolute;left:${30+c*112}px;top:${44+r*32}px;font-size:16px">${F('uid.'+i,null,78)}</div>`}
    return x+`<div style="position:absolute;left:30px;top:186px;font-size:17px">Active? ${F('uact')}</div>
    <div style="position:absolute;left:30px;top:228px;font-size:13px;color:#b4531b;font-family:Arimo,Arial,sans-serif">Practice only – do not type real staff names or IDs. MENU saves (assumed).</div>`+alphaKB(320)}
  if(s==='codes'){const c=S.draft.codes;
    let x=`<div style="position:absolute;left:250px;top:6px"><span class="inv" style="font-size:20px">Edit Codes</span></div>
    <div style="position:absolute;left:16px;top:42px;font-size:16px;letter-spacing:1px;line-height:24px;white-space:pre;color:#3d4247">Enter Date Code   : ${F('codes.date',null,70)}
Enter PLU Prefix  : ${F('codes.prefix')}</div>
    <div style="position:absolute;left:16px;top:98px;font-size:16px;letter-spacing:1px;color:#3d4247">CMD0/1 Key Enables:</div>
    <div style="position:absolute;left:16px;top:118px;font-size:10px;color:#6d7a87;font-family:Arimo,Arial,sans-serif;line-height:1.3">(Select a Field and Press MENU<br>to Display CMD0/1 Menu)</div>
    <div style="position:absolute;left:230px;top:98px;font-size:14px;line-height:17px">`;
    for(let r=0;r<6;r++)x+=`<div>${F('codes.k0.'+r,null,44)}&nbsp;&nbsp;${F('codes.k1.'+r,null,44)}</div>`;
    x+=`</div><div style="position:absolute;left:16px;top:212px;font-size:16px;letter-spacing:1px;color:#3d4247">PLU Functions     :</div>
    <div style="position:absolute;left:16px;top:232px;font-size:10px;color:#6d7a87;font-family:Arimo,Arial,sans-serif;line-height:1.3">(Select a Field and Press MENU<br>to Display PLU Menu)</div>
    <div style="position:absolute;left:230px;top:212px;font-size:14px;line-height:17px"><div>${F('codes.f.0',null,100)}</div><div>${F('codes.f.1',null,100)}</div></div>
    <div style="position:absolute;left:420px;top:98px;width:250px;font-size:11px;font-family:Arimo,Arial,sans-serif;color:#2a6fcb;line-height:1.35">Left column = CMD0, right = CMD1.<br>Each row = one row of 4 menu buttons.<br>Y = works without the code.</div>`;
    return x+alphaKB(318)}
  if(s==='numf'){const n=S.nf;
    return `<div style="position:absolute;left:14px;top:96px;font-size:19px;color:#3d4247">${esc(n.label)}</div>
    <div style="position:absolute;left:30px;top:126px;font-size:19px"><span class="fld on">${esc(n.val)}</span></div>`+keypad(346)}
  if(s==='ip'){const d=S.draft.ip;
    return `<div style="position:absolute;left:96px;top:14px"><span class="inv">IP Network Configuration</span></div>
    <div style="position:absolute;right:6px;top:16px;background:#e9e04a;border:1px solid #b9b032;border-radius:6px;font-family:Arimo,Arial,sans-serif;font-size:12px;padding:3px 8px">Save and Exit →</div>
    <div style="position:absolute;left:60px;top:66px;font-size:21px;line-height:38px;white-space:pre">IP Address        ${F('ip.ip')}
Subnet Mask       ${F('ip.mask')}
Default Gateway   ${F('ip.gw')}

Win Comms Port    ${F('ip.port')}  UDP (Y/N) ${F('ip.udp')}</div>
    <div class="mb" data-ping="ip" style="position:absolute;left:520px;top:66px;width:96px;height:30px;background:#2a7be6;color:#fff;border-color:#1f62bd">Ping Test</div>
    <div class="mb" data-ping="gw" style="position:absolute;left:520px;top:142px;width:96px;height:30px;background:#2a7be6;color:#fff;border-color:#1f62bd">Ping Test</div>
    <div style="position:absolute;left:330px;top:250px;background:#e9e04a;border:1px solid #b9b032;border-radius:6px;font-family:Arimo,Arial,sans-serif;font-size:12px;padding:4px 10px">↖ Set to 0 for default</div>
    <div class="mb" data-ipen="1" style="position:absolute;left:66px;top:288px;width:92px;height:52px;background:#2a7be6;color:#fff;border-color:#1f62bd">${d.on?'Disable\nIP':'Enable\nIP'}</div>`+alphaKB(360)}
  if(s==='printers'){
    const rows=[['Preview on','prev'],['Printer type','type'],['Direction','dir'],null,['Width  (mm)','w'],['Length (mm)','l'],['Xoffset(mm)','x'],['Yoffset(mm)','y'],['Label Rotate','rot']];
    let h=`<div style="position:absolute;left:14px;top:8px"><span class="inv">Label Printer/Preview Configuration</span></div>
    <div style="position:absolute;left:30px;top:52px;font-size:17px;line-height:21px;width:640px">
    <div style="display:grid;grid-template-columns:200px repeat(3,140px);color:#9aa4ae;font-size:13px"><span></span><span style="text-align:right">Printer 1</span><span style="text-align:right">Printer 2</span><span style="text-align:right">Printer 3</span></div>`;
    rows.forEach(r=>{if(!r){h+='<div style="margin-top:6px;color:#9aa4ae">Label dimensions</div>';return}
      h+=`<div style="display:grid;grid-template-columns:200px repeat(3,140px)"><span>${r[0]}</span>${[0,1,2].map(i=>`<span style="text-align:right">${F('pr.'+i+'.'+r[1])}</span>`).join('')}</div>`});
    if(S.prStage===1)h+=`<div style="margin-top:10px;font-size:17px">Press 'MENU' to configure printer ${S.prNo}</div></div>`;
    else h+=`<div style="display:grid;grid-template-columns:200px repeat(3,140px);margin-top:8px"><span></span>${[0,1,2].map(i=>{const en=S.draft.pr[i].en;return `<span style="display:flex;justify-content:flex-end"><span data-pen="${i}" style="cursor:pointer;font-family:Arimo,Arial,sans-serif;font-size:13px;color:#fff;padding:4px 14px;border-radius:5px;background:${en?'#3dbd4a':'#d7552e'}">${en?'Enabled':'Disabled'}</span></span>`}).join('')}</div></div>`;
    return h+alphaKB(320)}
  if(s==='interr')return `<div style="position:absolute;left:40px;top:288px;font-size:15px;color:#3d4247">Interrogating printer...</div>`+alphaKB(320);
  if(s==='p43'){const d=S.draft.p43;
    const L=[['Serial number',null,'0352••••••••'],['HSL licence key',null,'L5500Z•••'],['Contrast','p43.contrast'],['Start Adjust','p43.start'],['Stop Adjust','p43.stop'],['X Start','p43.xs'],['Width','p43.w'],['Length','p43.len'],['Media Type',null,d.media],['Print Speed','p43.speed'],['Print Method',null,d.method],['Dpi',null,d.dpi],['Darkness','p43.dark'],['LTS Sensitivity','p43.lts']];
    let h=`<div style="position:absolute;left:100px;top:6px"><span class="inv" style="font-size:20px">P${esc(S.cfg.pr[S.prNo-1].type.replace(/^P/,''))} Printer Configuration</span></div>
    <div style="position:absolute;left:30px;top:38px;width:470px;font-size:14px;line-height:17.5px">${L.map(([n,k,v])=>`<div style="display:flex;justify-content:space-between"><span>${n}</span><span>${k?F(k):`<span class="dimtxt">${esc(v)}</span>`}</span></div>`).join('')}</div>`;
    const B=[['Test feed','feed','#2f7de1'],['Save Media','saveMedia','#2f7de1'],['Edit Media','editMedia','#2f7de1'],['Calibrate Media','calib','#2f7de1'],['Enable LTS','ltsOn',d.ltsOn?'#1d5fb8':'#6ea3e8'],['Disable LTS','ltsOff',d.ltsOn?'#e5926e':'#d7552e']];
    B.forEach(([n,id,c],i)=>h+=`<div class="bluebtn" data-p43="${id}" style="left:520px;top:${10+i*44}px;width:100px;height:34px;background:${c}">${n}</div>`);
    return h+alphaKB(320)}
  if(s==='machine')return `<div style="position:absolute;left:0;right:0;top:10px;text-align:center;font-family:Arimo,Arial,sans-serif;font-size:21px;color:#666d74">Edit Machine Id and Serial Number</div>
    <div style="position:absolute;left:70px;top:48px;width:520px;height:190px;background:#fff;border:1px solid #c9d1d9;border-radius:6px">
      <div style="text-align:center;font-family:Arimo,Arial,sans-serif;font-size:11px;color:#555;margin-top:16px">Use this screen to set terminal identity.</div>
      <div style="position:absolute;left:56px;top:44px;font-size:24px;line-height:44px;white-space:pre">Machine ID  :${F('mach')}
Run Number  :${F('run')}</div>
      <div style="position:absolute;left:0;right:0;bottom:16px;text-align:center;font-family:Arimo,Arial,sans-serif;font-size:11px;color:#555">Machine ID is 2 digits and Run Number is 8 digits</div></div>`+alphaKB(320);
  if(s==='dest'){const d=S.draft.dest;
    let h=`<div style="position:absolute;left:170px;top:2px"><span class="inv" style="font-size:20px">DESTINATION CHECKING</span></div>
    <div style="position:absolute;left:30px;top:36px;font-size:16px">`;
    h+=`<div style="position:absolute;left:130px;top:0;font-size:13px;color:#6d7a87">Destination</div>`;
    h+=`<div style="position:absolute;left:32px;top:18px;width:98px;font-size:15px">Menu Name</div>`;
    for(let c=0;c<10;c++)h+=`<div style="position:absolute;left:${130+c*52}px;top:16px;width:52px;height:22px;border:1px solid #6d93c9;box-sizing:border-box;text-align:center">${c+1}</div>`;
    for(let r=0;r<9;r++){h+=`<div style="position:absolute;left:0;top:${40+r*31}px;width:30px;text-align:center">${r+1}</div><div style="position:absolute;left:32px;top:${40+r*31}px;width:96px;height:31px;border-bottom:1px dotted #9db">${F('dest.n.'+r,null,90)}</div>`;
      for(let c=0;c<10;c++)h+=`<div data-f="dest.c.${r}.${c}" class="fld ${S.fkey==='dest.c.'+r+'.'+c?'on':''}" style="position:absolute;left:${130+c*52}px;top:${40+r*31}px;width:52px;height:31px;border-left:1px solid #6d93c9;border-right:1px solid #6d93c9;box-sizing:border-box;text-align:center;line-height:31px">${esc(d.c[r][c])}</div>`}
    h+=`</div><div style="position:absolute;left:30px;top:322px;font-size:17px">DEST. OFFSET: ${F('dest.off')}    MENU SELECT: ${F('dest.ms')}</div>`;
    return h+alphaKB(350)}
  if(s==='barcode'){
    return `<div style="position:absolute;left:236px;top:14px"><span class="inv">User Barcode Set-up</span></div>
    <div style="position:absolute;left:30px;top:56px;font-size:17px;line-height:40px">
      <div>1. ${F('bc.0')}</div><div>2. ${F('bc.1')}</div><div>3. ${F('bc.2')}</div></div>
    <div style="position:absolute;left:52px;top:182px;width:580px;border:1px solid #c7cfd7;border-radius:4px;background:rgba(255,255,255,.6);font-family:Arimo,Arial,sans-serif;font-size:9.2px;line-height:1.38;color:#555;padding:4px 8px;text-align:center">
      Currently supported '*' commands are as follows: &nbsp;&nbsp; '()' Human readable formatting controls<br>
      *FBssll Insert fixed barcode field (offset ss, length ll), *BCssll Insert scanned barcode (offset ss, length ll),<br>
      *DTdm Insert date, d=(1,2,3,4 P-ack,K-ill,B-arcode,M-inma,X,T-oday), m=(D-ddmmyy,Y-yymmdd,Z-yyyymmdd,J-yyddd)<br>
      *BAn Insert n least significant digits of batch number, *WTld Insert net weight, number of digits l, decimal places d<br>
      *MNn Insert n least significant digits of Machine Number (MN), *SNn Insert n least significant digits of Serial Number (SN)<br>
      *RN Insert 8 digit Run Number, *LTn Insert n first characters of lot number, *PCn Insert first n characters of Product Code<br>
      *PP Insert PLU number, *PS Insert current product specific serial number, *TT Insert tray type, *TXll Label text, length ll<br>
      *ITn Insert last n digits of items, *FNn Insert code 128 function code 1..4, *CDn Insert check digit mode 0..3<br>
      *DO Despatch order, *FO Factory order, *PA Pallet number, *WTNld Net, *WTGld Gross, *WTTld Tare</div>`+alphaKB(350)}
  if(s==='msg')return `<div style="position:absolute;left:160px;top:14px"><span class="inv">Send a Message to FOPS</span></div>
    <div style="position:absolute;left:40px;top:90px;font-size:19px">Message: ${F('msg.text',null,420)}</div>
    <div style="position:absolute;left:40px;top:140px;font-size:13px;color:#b4531b;font-family:Arimo,Arial,sans-serif">Layout assumed. ENTER or MENU sends. It shows in FOPS 8 under Info.</div>`+alphaKB(320);
  if(s==='bctest')return `<div style="position:absolute;left:220px;top:14px"><span class="inv">Barcode Scanner Test</span></div>
    <div style="position:absolute;left:40px;top:90px;font-size:19px;line-height:1.6">Scan a barcode now.<br>Last scan: <span class="fld on">${esc(S.lastScan||'none')}</span><br>Length: ${S.lastScan.length}</div>
    <div style="position:absolute;left:40px;top:220px;font-size:13px;color:#b4531b;font-family:Arimo,Arial,sans-serif">Layout assumed. Use the Scan box in the trainer card.</div>`;
  if(s==='lock')return `<div style="position:absolute;inset:0;background:#1e2226;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:Arimo,Arial,sans-serif"><div style="font-size:26px">Screen locked for cleaning</div><div style="font-size:60px" id="lockN">20</div><div style="font-size:13px;color:#aab">Trainer guess at this screen</div></div>`;
  if(s==='download'){const d=S.dl;const cur=d.list[Math.min(d.i,d.list.length-1)];
    return `<div style="position:absolute;left:14px;top:10px;font-size:17px;color:#4c5a68">${d.kind==='FASTDRV'?"Downloading 'FASTDRV.PRG' please wait..":'Downloading Printer(s)please wait..'}</div>
    <div style="position:absolute;left:40px;top:248px;font-size:24px">Downloading Printer ${cur||1}</div>`}
  if(s==='log')return `<div style="position:absolute;left:250px;top:14px"><span class="inv">View Log File</span></div>
    <div style="position:absolute;left:30px;top:60px;right:20px;bottom:10px;overflow:auto;font-size:15px;line-height:1.5;white-space:pre">${S.log.length?S.log.map(esc).join('\n'):'Log empty'}</div>`;
  if(s==='nc')return `<div style="position:absolute;left:30px;top:20px"><span class="inv">${esc(S.ncName)}</span></div>
    <div style="position:absolute;left:30px;top:90px;right:30px;font-size:19px;line-height:1.6;color:#4c5a68">This screen is not in the trainer yet.<br>Photograph it on the terminal and send the photo, and it will be added.<br><br>Press RETURN to go back.</div>`;
  return '';
}
function barX(v){return Math.max(0,Math.min(538,v/18*538))}
const CMD1=[['Edit Products','recPLU'],['Edit Texts','recText'],['Edit Menus','recMenu'],['Edit Hotshots','hotshots'],['Edit User ID','userid'],['Edit Codes','codes'],['Print PLU Totals\n(Zero totals)','printTotals'],['Print PLU Data','printPlu'],['Print Text Data','printText'],['Print Current Set-up','printSetup'],['Download Label\nFormats','download'],['Set-up Menu','setup'],['Printer/Preview\nConfiguration','printers'],['Clear Transaction\nBuffer','clearBuf'],['Utility Menu','utility'],['More Set-up','more'],['Destination\nChecking','dest'],['Respec Error Margin','respec'],['Date Adjust Limit','kdl'],['Plu lock, default PLU','defplu'],['Print Yield\nInformation','printYield'],['Backup\nManagement','backup'],['Edit Machine Id and\nSerial Number','machine']];
const CMD0=[['Print Total Data'],['Delete Label','delLabel'],['Set Batch Number','batch'],['Display Tare Weight','showTare'],['Enter User ID'],['Send a Message to\nFOPS','msg'],['Global Date'],['Label Zero Print'],['Set Lot Numbers /\nSupplier Codes','lot'],['Set Work Grade'],['Clear Label Buffer','clearLabels'],['Set Line Speed'],['End All Pallets','endPallets'],['Check Weight\nSamples'],['Unlock Scale','unlock'],['Zero All Totals','zeroTotals'],['Force Down-time\nReason'],['Update WC2 dump\ndata'],['Lock Screen for\nCleaning','lockClean'],['Change Media\n(PM43 Only)','p43'],['Destination\nOverride'],['Combine'],['Display Unused\nLabels']];
const MORE=[['Edit Key Sequence'],['User Barcode Set-up','barcode'],['IP Configuration','ip'],['Swissdig 3900\nProtocol Test','',1],['RF Tag\nReader/Writer Test','',1],["Download\n'FASTDRV.PRG'",'fastdrv'],['Configure Barcode\nVerifier'],['Change Master\nPassword'],['Toggle Auto/Manual\nLabelling Mode','toggleMode'],['View Log File','log'],['Print User Barcode\nSet-up','printBc'],['Clone Terminal'],['Command Line'],['Colour Test','',1],['Read from\nMicrocontroller','',1],['Add program\nMicrocontroller','',1],['Unlock Scale','unlock'],['Test I/O Board(s)'],['SPI Test','',1],['Key Sequence\nPresets'],['Update ROM'],['Edit config.ini'],['Restart terminal','restart']];
const UTIL=[['Network Terminal'],['Barcode Scanner\nTest','bcTest'],['APL Terminal'],['Modem Test','',1],['WMS Issue Set-up'],['Transponder Yield\nSystem Set-up'],['Vector Touch Screen'],['Test Touch Screen\nAccuracy'],['Serial Loop Back\nTest'],['Test Input/Output\nPorts'],['Flash Tally Roll\nRecall'],['Auto-Weigh Capture\nControl'],['Loudspeaker Audio\nTest','beep'],['Label Scaling Test'],['Network Node\nAddress & Name','node'],['(greyed)','',1],['UDP Connections\nConfig'],['CSW Config'],['Software Build Info','build'],['WC2 Comms Test','wc2'],['Line Set-up'],['Camera Test'],['RF Id Test']];

function updWeigh(){
  const p=PR[S.plu];if(!p)return;const n=netW(),el=$('#wNet');if(!el)return;
  el.textContent=fmt(n)+'kg';
  const fill=$('#wFill'),inR=n>=p.min-1e-9&&n<=p.max+1e-9;
  fill.style.width=barX(Math.max(0,n))+'px';fill.style.background=inR?'#3dbd4a':'#d9532c';
  const tr=S.trans.filter(t=>!t.void&&t.plu===p.plu);const ave=tr.length?tr.reduce((a,t)=>a+t.net,0)/tr.length:(p.min+p.max)/2;
  $('#wAve').style.left=barX(ave)+'px';$('#wAveT').textContent='Ave: '+ave.toFixed(2);$('#wAveT').style.left=(barX(ave)-30)+'px';
  const z=$('#wZero');const inZero=Math.abs(S.gross-S.zero)<0.01;z.style.background=inZero?'#1e2226':'transparent';z.style.color=inZero?'#fff':'#2b2f33';
  const st=$('#wState');const map={UNDER:['UNDERWEIGHT – no label','#c3462f'],OVER:['OVERWEIGHT – no label','#c3462f'],LABELLED:['Label printed – remove crate','#2c8a4b'],READY:['Manual mode – tap the label to print','#1c5aa6']};
  const m=map[S.wState];st.textContent=m?m[0]:'';st.style.color=m?m[1]:'';
  const key=fmt(n)+'|'+S.tare+'|'+S.dateAdj+'|'+HX.S.run+'|'+JSON.stringify(HX.S.termFormats[p.fmt]||'');
  if(key!==S.lblKey){S.lblKey=key;$('#wLbl').innerHTML=labelPreview()}
}

/* ---------- render ---------- */
function render(){
  $('#scr').innerHTML=`<div class="msgline" id="msgl">${esc(S.msg)}</div>`+scrHTML()+modalHTML();
  $('#hMode').textContent=S.screen==='boot'||S.screen==='mode'?'Requiem v9':'Add to stock';
  if(S.screen==='weigh'){S.lblKey='';updWeigh()}
  updWB();renderNotes();renderBC();updHint();
}
const NOTES={
 boot:['Start-up','The terminal boots its own operating system (Requiem v9, per the Auto-OCM datasheet) and then the Hellenic application.',['Header shows “Requiem v9” on the mode screen'],['Boot text is invented; real start-up lines not photographed']],
 mode:['Select Operation Mode','This station has one mode: Add to stock, with Factory Orders. Tap the blue tile.',['Mode name and blue tile layout'],['Other stations may list more modes']],
 plu:['Enter PLU (default screen)','Pick the product: tap a hotkey, type the PLU and ENTER, or scan. CMD1 and CMD0 ask for a security code. Pressing MENU here changes nothing.',['Hotkeys A–G with PLUs 7333–3457, date line, keypad with CMD0/CMD1','MENU on this screen does nothing visible (your photo 01)','Typed PLU fills the 0000 box (your extra photo E1)'],['What the small number under each date means','Product names for the hotkey PLUs']],
 weigh:['Weighing screen','After ENTER the label for the PLU loads (your photo E2). The terminal labels a crate when the weight is steady and inside the limits. “Done” counts boxes on the factory order.',['Header: PLU, FO 093015, Req. and Done (11.00 → 12.00 boxes)','Label preview, preset tare 2.44 kg, ZERO box, NET + Cancel TARE','Limits bar: yellow band = limits; fill turns red when under or over, green when inside','Function key grid with Delete Trans'],['Label is drawn from the FOPSx format sent to the terminal','Under/over wording is the trainer’s','The FO is the WIP order in FOPS 8 that has this PLU on a line','Barcodes are drawn for looks and cannot be scanned']],
 sec:['Security code','CMD1, CMD0 and the SETUP items ask for a code first. The field shows a black box.',['“Enter CMD1 Security Code” / “Enter SETUP Security Code” with the full keyboard','A wrong code shows no message and still opens the menu with limited buttons (your notes 04 and 08)'],['Characters shown as * while typing','Whether there is a lock-out after several wrong tries']],
 cmd1:['COMMAND Menu 1','Supervisor menu. With the right code every button works. With a wrong code only the buttons switched on in Edit Codes work: Edit Hotshots, Download Label Formats and Printer/Preview Configuration.',['All 23 button names and order','Wrong-code view: those 3 buttons bright, the rest greyed (photo 04)','Edit Codes right-hand column NNNY / NNNN / NNYN / YNNN / NNNN / NNNN matches exactly'],['>> page 2 not photographed','In your full-access photo a few buttons looked faint; the trainer treats them as on']],
 cmd0:['COMMAND Menu 0','Operator menu. With a wrong code only Delete Label, Unlock Scale and Change Media (PM43 Only) work.',['Layout, 23 buttons, the 3 bright ones (photo 08)','Edit Codes left-hand column NYNN / NNNN / NNNN / NNYN / NNNY / NNNN matches'],['Greyed names are best readings of a faint photo: Print Total Data, Display Tare Weight, Enter User ID, Global Date, Label Zero Print, Set Work Grade, Set Line Speed, End All Pallets, Check Weight Samples, Zero All Totals, Force Down-time Reason, Update WC2 dump data, Destination Override, Combine, Display Unused Labels','What each greyed button does']],
 keyprev:['Key enable preview','Shows which buttons the key-enable row you selected switches on. RETURN goes back to Edit Codes.',['“Select a Field and Press MENU to Display CMD0/1 Menu” (photo 16)'],['Preview drawing is the trainer’s','PLU Functions Y/N meaning is a guess: shown here as which weighing function keys work']],
 codes:['Edit Codes','Date code, PLU prefix, the CMD0/1 key enables and PLU functions. Select a key-enable field and press MENU to see its menu. RETURN asks to save.',['All labels and the Y/N values from photo 16'],['MENU saving the date/prefix fields','Typing replaces the whole Y/N string']],
 more:['More Set-up','Engineering settings: barcode format, network, labelling mode, logs, restart.',['All 23 button names; greyed items match an earlier photo'],['“Swissdig 3900” name is a best reading']],
 utility:['UTILITY Menu','Tests and set-up for the terminal hardware and network.',['All button names and layout (photo 21)'],['Two greyed names unreadable (shown as Modem Test and “(greyed)”)','Only Barcode Scanner Test, Loudspeaker, Network Node, Software Build and WC2 Comms do anything here']],
 recsel:['Edit Products / Texts / Menus','Type the number, ENTER, then E to edit or R to remove. Menus that do not exist ask “No menu, Create?”.',['“Edit PLU : 9980 (E)dit or (R)emove?” (09), “Edit Text No. : 9980 / (E)dit or (R)emove?” (14), “Edit Menu : 555 No menu, Create?” (15)'],['Screens after (E)dit are not photographed yet']],
 prodrec:['Product record','Shows what the terminal holds for this PLU.',[],['Whole layout assumed – photograph the pages after (E)dit']],
 textrec:['Edit Text','Six text lines used on the label (X02, X01, X05, X06, customer line, pack line for 9980).',['Text lines as printed on the 9980 label'],['Screen layout assumed']],
 hotshots:['Edit Hotshot Map','The PLU on each hotkey of the Enter PLU screen. Tap a key box, type the PLU, ENTER for the next one. EXIT saves. HOTSHOTS ACTIVE turns the whole map on or off.',['Grid A–X with 7333…3457, HOTSHOTS ACTIVE, EXIT, DEL, ENTER (photo 17)','“EXIT is like save” – your note'],['What OFF does: the trainer hides all hotkeys']],
 userid:['Edit User ID Map','20 user ID boxes and an Active flag.',['Layout and “Active? N” (photo 18)'],['How IDs are used (log-in per operator?)','MENU saves']],
 numf:['Single-value setting','Type with the keypad, ENTER saves.',['Respec Error Margin 05.00 %, Kill Date Adjust Limit 00, Default PLU 0000 (photos 23–25)'],['Respec = tolerance for a re-specified pack (guess)','Default PLU loads straight after start-up (guess)']],
 machine:['Machine Id and Run Number','Machine ID 13 and Run Number 00505309. Both go into the serial barcode on every label.',['Screen text and values (photo 27)','Label serial 13 505309 9980 00726… = machine, run, PLU, net weight'],['MENU saves','Last 3 digits of the serial barcode unknown']],
 ip:['IP Network Configuration','Terminal address on the factory network. MENU saves and exits (yellow callout). Win Comms Port is how FOPS talks to the terminal.',['Field names, Ping Test, Disable IP, callouts, port 22156 UDP'],['IP addresses replaced with example values','Ping results simulated']],
 printers:['Label Printer/Preview Configuration','Three printer slots. MENU once saves and shows “Press ‘MENU’ to configure printer 1”. MENU again talks to that printer.',['Rows, values, Enabled/Disabled (E3)','MENU → prompt (E4) → “Interrogating printer...” (E5)'],['Direction and rotate codes unknown']],
 interr:['Interrogating printer','The terminal reads the printer’s own settings.',['Text and keyboard (E5)'],['Time taken']],
 p43:['P43 Printer Configuration','Settings stored in the Honeywell PM43 itself: contrast, start/stop adjust, media type, speed, darkness, label-taken sensor (LTS).',['All rows and the six blue/red buttons (E6)'],['Serial number and licence key hidden on purpose','What Calibrate and Edit Media do here']],
 dest:['Destination Checking','Grid of 9 menus × 10 destinations, used to check a product goes to the right place.',['Table layout, DEST. OFFSET, MENU SELECT'],['What a cell value means – ask Hellenic or IT']],
 barcode:['User Barcode Set-up','Build barcode strings from * commands. Line 1 “Default” is the built-in format. The live result is shown in the panel below.',['Command list copied from the help box'],['Default format content','↑ gives symbols (* / - . : etc) – on a PC you can type * directly']],
 msg:['Send a Message to FOPS','Free text sent to the FOPS 8 office.',['Button name on CMD0'],['Whole screen assumed']],
 bctest:['Barcode Scanner Test','Shows what the scanner read.',['Button name on UTILITY'],['Screen assumed']],
 lock:['Lock Screen for Cleaning','Touches are ignored while you wipe the screen.',['Button name on CMD0'],['Countdown screen assumed']],
 download:['Downloading','Label formats go from the terminal to each enabled printer. Until you do this the printer keeps printing the old format.',['“Downloading Printer(s)please wait..” and “Downloading Printer 1”'],['Timing simulated']],
 log:['View Log File','Events the terminal records.',[],['Log format assumed']],
 nc:['Not captured yet','This button exists on the real terminal, but its screen has not been photographed.',[],[]]
};
function renderNotes(){
  const n=NOTES[S.screen]||['','',[],[]];
  $('#notes').innerHTML=`<h2>This screen</h2><h3>${esc(n[0])}</h3><p>${esc(n[1])}</p>
  <div class="small">Labelling ${S.labelMode.toUpperCase()} · Items ${S.items} · Lot ${esc(S.lot)} · Run ${String(HX.S.run).padStart(8,'0')}${HX.pending()?' · FOPSx has unsent changes':''}</div>
  <div class="tags">${n[2].map(t=>`<div class="tag r"><b>From photo:</b> ${esc(t)}</div>`).join('')}${n[3].map(t=>`<div class="tag a"><b>Assumed:</b> ${esc(t)}</div>`).join('')}</div>`;
}
function renderBC(){
  const box=$('#bcPanel');
  if(S.screen!=='barcode'&&S.screen!=='weigh'){box.hidden=true;return}
  box.hidden=false;
  const t=S.plu&&PR[S.plu]?curTrans():Object.assign(curTrans(),{net:8.48,gross:10.92,tare:2.44});
  const lines=S.screen==='barcode'?S.draft.bc:[S.cfg.bc[0]];
  let h=`<h2>Barcode preview</h2><p class="small">Using PLU ${t.plu}, net ${fmt(t.net)} kg, lot ${esc(t.lot)}${S.screen==='barcode'?' (example values)':''}.</p>`+
  lines.map((l,i)=>{if(!l)return'';const r=evalBC(l,t);return `<div style="margin-top:8px"><div class="small">User barcode line ${i+1}: <code>${esc(l)}</code></div><div class="bcout">${esc(r.out)||'&nbsp;'}</div>${r.err.map(e=>`<div class="err">${esc(e)}</div>`).join('')}</div>`}).join('');
  if(S.screen==='weigh'){const pt=previewTrans(),d=HX.decodeSerial(pt.serial);h+=`<div style="margin-top:10px"><div class="small">Serial barcode on the label (top)</div><div class="bcout">${pt.serial}</div><div class="small" style="margin-top:4px">${d.mach} machine · ${d.run} run · ${d.plu} PLU · ${String(Math.round(pt.net*100)).padStart(5,'0')} net · ${d.tail.slice(-3)} unknown</div></div>`}
  box.innerHTML=h;
}

/* ---------- events ---------- */
$('#term').addEventListener('click',e=>{
  const el=e.target.closest('[data-act],[data-go],[data-hot],[data-pk],[data-ak],[data-cmd],[data-f],[data-mk],[data-wf],[data-wl],[data-pen],[data-ping],[data-ipen],[data-hs],[data-p43]');
  if(!el)return;const d=el.dataset;
  if(d.mk!=null){modalKey(d.mk);return}
  if(S.modal&&d.act!=='RETURN')return;
  if(S.screen==='lock')return;
  if(d.act){act(d.act);return}
  if(d.go==='mode'){done('mode');const dp=S.cfg.defPlu;go('plu');if(dp!=='0000'&&PR[dp])selectPlu(dp);return}
  if(d.hot){const p=hotPlu(d.hot);if(p)selectPlu(p.plu);return}
  if(d.pk){pluKey(d.pk);return}
  if(d.ak){alphaKey(d.ak);return}
  if(d.cmd!=null){cmd(d.cmd,d.cn);return}
  if(d.hs){S.hs.sel=d.hs;S.hs.fresh=true;render();return}
  if(d.f){S.fkey=d.f;S.fresh=true;S.prStage=0;render();return}
  if(d.wf){wfn(d.wf,d.wn);return}
  if(d.wl){if(S.labelMode==='manual'){const p=PR[S.plu],n=netW();if(stable()&&S.armed&&n>=p.min&&n<=p.max)printLabel();else toast('Not ready to print')}return}
  if(d.pen){S.draft.pr[+d.pen].en=!S.draft.pr[+d.pen].en;render();return}
  if(d.ping){const ip=d.ping==='ip'?S.draft.ip.ip:S.draft.ip.gw;toast(S.draft.ip.on?'Reply from '+ip+' time<1ms':'IP disabled');return}
  if(d.ipen){S.draft.ip.on=!S.draft.ip.on;render();return}
  if(d.p43){const x=S.draft.p43;switch(d.p43){
    case 'feed':feed({type:'rep',text:'(blank label fed – test feed)'});toast('Test feed');return;
    case 'saveMedia':save();toast('Media settings saved');return;
    case 'editMedia':S.fkey='p43.contrast';S.fresh=true;render();return;
    case 'calib':toast('Calibrating media… done');return;
    case 'ltsOn':x.ltsOn=true;render();return;case 'ltsOff':x.ltsOn=false;render();return}}
});
$('#term').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset.act){e.preventDefault();act(e.target.dataset.act)}});
document.addEventListener('keydown',e=>{
  if($('#app-scale').hidden)return;
  if(e.target.closest('input,textarea,button,select,[tabindex]'))return;
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  let k=e.key;
  if(k==='Backspace')k='DEL';else if(k==='Escape')k='ESC';else if(k==='Enter')k='ENTER';else if(k===' ')k='SPACE';
  else if(k==='ArrowLeft')k='<';else if(k==='ArrowRight')k='>';
  else if(k.length===1)k=/[a-z]/i.test(k)?k.toUpperCase():k;else return;
  e.preventDefault();
  if(S.modal){if(/^[\d.]$/.test(k)||['DEL','ESC','ENTER'].includes(k))modalKey(k);else if(k==='-')modalKey('±');else if(k==='Y')modalKey('YES');else if(k==='N')modalKey('NO');return}
  if(S.screen==='plu'){if(/^\d$/.test(k)||k==='DEL'||k==='ENTER')pluKey(k);else if(HOT.includes(k)){const p=hotPlu(k);if(p)selectPlu(p.plu)}return}
  if(S.screen==='numf'||S.screen==='hotshots'){if(/^\d$/.test(k)||k==='DEL'||k==='ENTER')pluKey(k);return}
  if(S.screen==='sec'||S.screen==='recsel'){alphaKey(k);return}
  if(FORMS.includes(S.screen)){
    if(k.length===1&&!/[A-Z0-9]/.test(k)){if(S.fkey&&!isYN(S.fkey)&&!isNum(S.fkey)){let v=S.fresh?'':String(gp(S.fkey)??'');if(v.length<maxLen(S.fkey))v+=k;sp(S.fkey,v);S.fresh=false;render()}return}
    alphaKey(k);
  }
});
document.querySelectorAll('[data-sim]').forEach(b=>b.addEventListener('click',()=>{
  const t=b.dataset.sim,base=S.debris,p=PR[S.plu]||{tare:2.44,min:5,max:15},tare=p.tare;
  if(t==='empty')setTarget(base);
  if(t==='crate')setTarget(base+tare);
  if(t==='good')setTarget(base+tare+p.min+0.4+Math.random()*Math.max(0.2,(p.max-p.min-0.8)));
  if(t==='under')setTarget(base+tare+Math.max(0.6,p.min*0.5+Math.random()*p.min*0.3));
  if(t==='over')setTarget(base+tare+p.max+0.6+Math.random()*3);
  if(t==='nudge'){S.jiggle=Date.now()+1300;S.stableSince=0}
  if(t==='clean'){const crateOn=S.target-S.debris;S.debris=0;setTarget(Math.max(0,crateOn))}
}));
$('#slider').addEventListener('input',e=>setTarget(parseFloat(e.target.value)));
function doScan(){const v=$('#scanIn').value.trim();if(!v)return;S.lastScan=v;$('#scanIn').value='';
  if(S.screen==='plu'){const plu=Object.keys(PR).find(k=>v===k||v.includes(PR[k].gtin)||v===PR[k].gtin);if(plu){selectPlu(plu);return}toast('Barcode not recognised');return}
  logEv('SCAN '+v);toast('Scanned '+v);if(S.screen==='bctest')render()}
$('#scanBtn').addEventListener('click',doScan);
$('#scanIn').addEventListener('keydown',e=>{if(e.key==='Enter')doScan()});
$('#resetTasks').addEventListener('click',()=>HX.clearTasks(TASKS.map(t=>t[0])));
['cmd1','cmd0','setup'].forEach(k=>{$('#c-'+k).value=HX.S.codes[k]||''});
$('#saveCodes').addEventListener('click',()=>{const c={};['cmd1','cmd0','setup'].forEach(k=>{const v=$('#c-'+k).value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);$('#c-'+k).value=v;c[k]=v});HX.S.codes=c;HX.emit('codes');$('#codeHint').textContent='Codes saved in this browser.';});
$('#helpEnter').addEventListener('click',helpEnter);

HX.on((type)=>{
  if(type==='task')renderTasks();
  if(type==='send'){loadPR();if(S.screen==='plu'||S.screen==='weigh'){if(S.screen==='weigh'&&!PR[S.plu]){S.stack=[];S.screen='plu'}S.msg='Products updated from FOPSx';S.msgT=Date.now()+3000;render()}else renderNotes()}
  if(type==='reset'){loadPR();S.trans=[];S.items=0;S.totals={};FEED.length=0;renderFeed();['cmd1','cmd0','setup'].forEach(k=>$('#c-'+k).value='');S.stack=[];S.screen='plu';enter();render();renderTasks()}
  if(type==='edit')renderNotes();
});

function fit(){const box=$('#stageBox'),inner=$('#stageInner');if(!box.clientWidth)return;const w=box.clientWidth;const s=Math.min(1,w/880);inner.style.transform=`scale(${s})`;box.style.height=(inner.offsetHeight*s)+'px'}
window.addEventListener('resize',fit);
window.HXscaleFit=fit;
function clock(){const d=new Date();$('#hClock').textContent=p2(d.getHours())+':'+p2(d.getMinutes())}
function boot(){render();setTimeout(()=>{S.screen='mode';S.stack=[];render()},2200)}

loadPR();renderTasks();clock();setInterval(clock,15000);boot();fit();setInterval(tick,100);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
})();
