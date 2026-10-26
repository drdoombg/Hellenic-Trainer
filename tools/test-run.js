// Playwright walk-through (npm i playwright). Run: node tools/test-run.js  -- screenshots go to tools/out-*.png
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1360,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
await p.goto('file://'+require('path').join(__dirname,'..','index.html'));await p.waitForTimeout(2600);
const click=async sel=>{await p.click(sel);await p.waitForTimeout(250)};
await click('[data-go="mode"]');
// set code
await p.fill('#c-cmd1','AB12');await click('#saveCodes');
await click('[data-pk="CMD1"]');await p.screenshot({path:require('path').join(__dirname,'out-s1-sec.png')});
await p.keyboard.press('X');await p.keyboard.press('Enter');await p.waitForTimeout(300);await p.screenshot({path:require('path').join(__dirname,'out-s2-cmd1-limited.png')});
await click('[data-act="RETURN"]');await click('[data-pk="CMD1"]');await click('#helpEnter');await p.waitForTimeout(4500);await p.screenshot({path:require('path').join(__dirname,'out-s3-cmd1-full.png')});
await click('[data-cmd="codes"]');await click('[data-f="codes.k1.0"]');await click('[data-act="MENU"]');await p.screenshot({path:require('path').join(__dirname,'out-s4-keyprev.png')});
await click('[data-act="RETURN"]');await click('[data-act="RETURN"]');
await click('[data-cmd="printers"]');await click('[data-act="MENU"]');await p.screenshot({path:require('path').join(__dirname,'out-s5-prmenu.png')});await click('[data-act="MENU"]');await p.waitForTimeout(1800);await p.screenshot({path:require('path').join(__dirname,'out-s6-p43.png')});
await click('[data-act="RETURN"]');await click('[data-act="RETURN"]');
await click('[data-cmd="hotshots"]');await p.screenshot({path:require('path').join(__dirname,'out-s7-hot.png')});await click('[data-act="RETURN"]');
await click('[data-cmd="machine"]');await p.screenshot({path:require('path').join(__dirname,'out-s8-mach.png')});await click('[data-act="RETURN"]');
await click('[data-cmd="recPLU"]');for(const k of ['9','9','8','0','ENTER'])await click(`[data-ak="${k}"]`);await p.screenshot({path:require('path').join(__dirname,'out-s9-rec.png')});
await click('[data-act="RETURN"]');await click('[data-act="RETURN"]');
// weigh 9980
for(const k of ['9','9','8','0','ENTER'])await click(`[data-pk="${k}"]`);
await click('[data-sim="good"]');await p.waitForTimeout(2500);await p.screenshot({path:require('path').join(__dirname,'out-s10-weigh.png')});
// fops8
await click('#tab-fops8');await p.waitForTimeout(400);await click('[data-t="refresh"]');await click('tr[data-o="093015"]');await p.screenshot({path:require('path').join(__dirname,'out-f1.png')});
await click('[data-t="insert"]');await p.screenshot({path:require('path').join(__dirname,'out-f2-ins.png')});await click('[data-d="saveOrder"]');
await click('#tab-fopsx');await p.waitForTimeout(300);await p.screenshot({path:require('path').join(__dirname,'out-x1.png'),fullPage:true});
await click('[data-pg="designer"]');await p.waitForTimeout(300);await p.screenshot({path:require('path').join(__dirname,'out-x2.png'),fullPage:true});
await click('[data-pg="trace"]');await click('[data-try="13505309998000726640"]');await click('[data-hit="13505309998000726640"]');await p.screenshot({path:require('path').join(__dirname,'out-x3.png'),fullPage:true});
// phone
const m=await b.newPage({viewport:{width:390,height:844}});m.on('pageerror',e=>errs.push('M '+e.message));await m.goto('file://'+require('path').join(__dirname,'..','index.html'));await m.waitForTimeout(2600);await m.screenshot({path:require('path').join(__dirname,'out-m1.png'),fullPage:false});
await m.click('#tab-fops8');await m.waitForTimeout(300);await m.screenshot({path:require('path').join(__dirname,'out-m2.png')});
const ow=await m.evaluate(()=>document.documentElement.scrollWidth);console.log('phone scrollWidth',ow);
console.log(errs.join('\n')||'no errors');await b.close()})();
