/** DOM geometry fixtures based on a real boarded card. No gameplay/economy claims. */
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {PASSENGERS,PASSENGER_ORDER} from '../lib/game-data';
import {translateGameText} from '../lib/i18n';
const [session,output]=process.argv.slice(2);
if(!session||!output)throw Error('Dedicated muted UI-only session and output required');
const browser=(args:string[],input?:string)=>execFileSync('npx',['--yes','agent-browser','--session',session,...args],{input,encoding:'utf8',maxBuffer:8*1024*1024});
browser(['eval',`window.qaCabinTemplate??=document.querySelector('.standing-slot.occupied').parentElement.outerHTML`]);
const fixtures=['zh','en'].flatMap(locale=>PASSENGER_ORDER.flatMap(kind=>[false,true].flatMap(risk=>[23,999].map(fare=>({locale,kind,risk,fare,name:translateGameText(PASSENGERS[kind].name,locale as 'zh'|'en')})))));
const results=[];
for(const [width,height]of [[1280,720],[1280,800],[1512,982]]){
 browser(['set','viewport',String(width),String(height)]);
 const cases=JSON.parse(browser(['eval','--stdin'],`(()=>{
 const results=[],grid=document.querySelector('.standing-grid');
 for(const f of ${JSON.stringify(fixtures)}){
 document.documentElement.lang=f.locale;grid.innerHTML=window.qaCabinTemplate.repeat(6);
 const failures=[];
 for(const [slot,w]of [...grid.children].entries()){
 w.querySelector('.rider-name').textContent=f.name;
 w.querySelector('.slot-destination').textContent=f.locale==='zh'?'还剩 3 站':'3 floors';
 w.querySelector('.slot-state').textContent=f.locale==='zh'?'协作邻座 ×3 · 到站合计+3币':'Linked neighbors ×3 · +3 total on arrival';
 if(f.risk){const b=document.createElement('span');b.className='seat-risk-tag';b.textContent=f.locale==='zh'?'高危':'High Risk';w.querySelector('.seat-heading').append(b);}
 for(const [i,e]of [...w.querySelectorAll('.seat-metrics>span')].entries()){for(const n of [...e.childNodes])if(n.nodeType===3)n.textContent=String(i===0?f.fare:i===1?12:'+2');}
 const regions=[...w.querySelectorAll('.rider-name,.seat-risk-tag,.slot-destination,.slot-state,.seat-metrics>span,.seat-info-button')];
 const boxes=regions.map(e=>e.getBoundingClientRect()),seat=w.getBoundingClientRect();
 for(let i=0;i<regions.length;i++){
 const e=regions[i],r=boxes[i];if(r.left<seat.left-1||r.right>seat.right+1||r.top<seat.top-1||r.bottom>seat.bottom+1)failures.push({slot,type:'outside-seat',part:e.className});
 if(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)failures.push({slot,type:'clipped',part:e.className});
 for(let j=i+1;j<regions.length;j++){const b=boxes[j];if(Math.min(r.right,b.right)-Math.max(r.left,b.left)>1&&Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top)>1)failures.push({slot,type:'overlap',parts:[e.className,regions[j].className]});}
 }
 }
 results.push({...f,failures});
 }
 return results;
 })()`));results.push({width,height,cases});
}
writeFileSync(output,JSON.stringify({scope:'six-seat cloned real DOM geometry; all 19 names, both languages, risk/non-risk, 23/999 stress fares; not game state',results},null,2));
console.log(JSON.stringify(results.map(r=>({width:r.width,height:r.height,total:r.cases.length,failed:r.cases.filter((c:any)=>c.failures.length).length,examples:r.cases.filter((c:any)=>c.failures.length).slice(0,3)})),null,2));
