/** Synthetic receipt geometry only. Does not simulate rewards or animation timing. */
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {PASSENGERS,PASSENGER_ORDER} from '../lib/game-data';
import {translateGameText} from '../lib/i18n';
const [session,output]=process.argv.slice(2);
if(!session||!output)throw Error('Dedicated muted browser session and output required');
const browser=(args:string[],input?:string)=>execFileSync('npx',['--yes','agent-browser','--session',session,...args],{input,encoding:'utf8',maxBuffer:8*1024*1024});
const fixtures=['zh','en'].flatMap(locale=>PASSENGER_ORDER.flatMap(kind=>[3,28,100,999].map(coins=>({locale,kind,name:translateGameText(PASSENGERS[kind].name,locale as 'zh'|'en'),coins,unit:locale==='zh'?'金币':'Coins'}))));
const results=[];
for(const [width,height] of [[1280,720],[1280,800],[1512,982]]){
 browser(['set','viewport',String(width),String(height)]);
 const cases=JSON.parse(browser(['eval','--stdin'],`(()=>{
 const fixtures=${JSON.stringify(fixtures)}; const base=document.querySelector('.standing-grid');
 if(!base)throw Error('Cabin required');
 document.querySelector('[data-qa="exits"]')?.remove();
 const grid=document.createElement('div');grid.className='standing-grid arrival-grid';grid.dataset.qa='exits';base.parentElement.append(grid);
 const results=[];
 for(const f of fixtures){document.documentElement.lang=f.locale;grid.replaceChildren();
 for(let i=0;i<6;i++){const wrap=document.createElement('div');wrap.className='standing-slot-wrap';wrap.style.gridColumn=String(i%3+1);wrap.style.gridRow=String(Math.floor(i/3)+1);
 wrap.innerHTML='<div class="arrival-exit arrival-quick"><span class="arrival-name"></span><span class="arrival-payout"><svg width="18" height="18" aria-hidden="true"></svg>+'+f.coins+'<small></small></span></div>';
 wrap.querySelector('.arrival-name').textContent=f.name;wrap.querySelector('small').textContent=f.unit;grid.append(wrap);}
 const failures=[];const boxes=[...grid.children].map(w=>w.getBoundingClientRect());
 const parts=[...grid.children].flatMap((w,i)=>[...w.querySelectorAll('.arrival-name,.arrival-payout')].map(e=>({i,cls:e.className,rect:e.getBoundingClientRect(),e})));
 for(const p of parts){const b=boxes[p.i],r=p.rect;if(r.left<b.left-1||r.right>b.right+1||r.top<b.top-1||r.bottom>b.bottom+1)failures.push({slot:p.i,cls:p.cls,type:'outside-seat',width:r.width,seatWidth:b.width});}
 for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){const a=parts[i],b=parts[j];if(Math.min(a.rect.right,b.rect.right)-Math.max(a.rect.left,b.rect.left)>1&&Math.min(a.rect.bottom,b.rect.bottom)-Math.max(a.rect.top,b.rect.top)>1)failures.push({type:'overlap',a:a.i,b:b.i,classes:[a.cls,b.cls]});}
 results.push({...f,failures});}
 return results;
 })()`));results.push({width,height,cases});
}
writeFileSync(output,JSON.stringify({scope:'synthetic six simultaneous receipts; 100/999 are stress values, not economy evidence; placeholder icon; no portrait/timing test',results},null,2));
console.log(JSON.stringify(results.map(r=>({width:r.width,height:r.height,total:r.cases.length,failed:r.cases.filter((c:any)=>c.failures.length).map((c:any)=>({locale:c.locale,kind:c.kind,coins:c.coins,failures:c.failures.slice(0,2)}))})),null,2));
