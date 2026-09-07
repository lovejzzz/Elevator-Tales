/** Layout fixtures only: never use this session for gameplay or balance evidence.
 * Start a dedicated muted agent-browser session on the local game and dismiss intro.
 * Usage: npx tsx scripts/audit-card-layout.mts SESSION OUTPUT.json
 */
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {PassengerCardFace} from '../components/elevator-game';
import {PASSENGER_ORDER, passengerCategory, passengerCardGrade} from '../lib/game-data';
import {initialRun, type Rider} from '../lib/game-engine';
import {translateGameText} from '../lib/i18n';

const [session, output] = process.argv.slice(2);
if (!session || !output) throw Error('Explicit dedicated session and output path required');
const variants=process.argv.includes('--states')?['base','debut','pending','boarded','reservation','volatile','volatile-debut','volatile-reservation','volatile-pending','volatile-debut-reservation','debut-reservation','pending-reservation']:['base'];
const fixtures = ['zh','en'].flatMap(locale=>PASSENGER_ORDER.flatMap(kind=>variants.filter(variant=>!variant.includes('volatile')||passengerCategory(kind)==='bad').map(variant=>{
 const run=initialRun(); run.floor=41;
 const rider:Rider={kind,id:`layout-${kind}`,destination:48,boardedAt:41,patience:0,fareBonus:0,volatile:variant.includes('volatile'),...(kind==='bomb'?{fuse:4}: {})};
 const action=variant.includes('pending')?'已选中 · 点空位':variant==='boarded'?'点此撤回':undefined;
 if(variant==='boarded')run.cabin[0]=rider;
 const face=renderToStaticMarkup(createElement(PassengerCardFace,{rider,run,action,locale:locale as 'zh'|'en'}));
 const debut=variant.includes('debut')?`<span class="offer-debut">${locale==='zh'?'初次见面':'First meeting'}</span>`:'';
 const reservation=variant.includes('reservation')?`<button class="reservation-button">${translateGameText('留到下一批 · 每十层一次',locale as 'zh'|'en')}</button>`:'';
 const html=`<div class="passenger-item"><button class="passenger-card category-${passengerCategory(kind)} kind-${kind} grade-${passengerCardGrade(kind)} ${variant==='boarded'?'boarded':variant.includes('pending')?'pending':''}">${debut}${face}</button>${reservation}<button class="mobile-rule-button">${locale==='zh'?'完整规则':'Details'}</button></div>`;
 return {kind,locale,variant,html};
})));
const browser=(args:string[],input?:string)=>execFileSync('npx',['--yes','agent-browser','--session',session,...args],{input,encoding:'utf8',maxBuffer:8*1024*1024});
const results=[];
for(const [width,height] of [[1280,720],[1280,800],[1512,982]]){
 browser(['set','viewport',String(width),String(height)]);
 const code=`(()=>{
 const fixtures=${JSON.stringify(fixtures)};
 const list=document.querySelector('.passenger-list');
 if(!list)throw Error('Game offer list missing');
 list.classList.remove('offer-revealing');
 const results=[];
 window.qaCardFixtures=fixtures;
 for(const fixture of fixtures){
  document.documentElement.lang=fixture.locale;
  list.innerHTML=fixture.html.repeat(3);
  const card=list.querySelector('.passenger-card');
  const box=card.getBoundingClientRect();
  const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
  const clipped=[];
  while(walker.nextNode()){
   const node=walker.currentNode;
   if(!node.textContent.trim())continue;
   const range=document.createRange();range.selectNodeContents(node);
   for(const rect of range.getClientRects())if(rect.top<box.top+2||rect.bottom>box.bottom-2||rect.right>box.right-2||rect.left<box.left+2)
    clipped.push({text:node.textContent,bottom:rect.bottom,right:rect.right});
  }
  const regions=['.card-head','.card-values','.candidate-ability','.candidate-work','.candidate-links','.candidate-risk','.card-action','.mobile-rule-button','.offer-debut','.reservation-button'].map(selector=>{
   const root=card.parentElement.querySelector(selector);const rects=[];
   if(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(w.currentNode);rects.push(...r.getClientRects());}}
   return {selector,rects};
  });
  for(let a=0;a<regions.length;a++)for(let b=a+1;b<regions.length;b++){
   if(regions[a].rects.some(x=>regions[b].rects.some(y=>Math.min(x.right,y.right)-Math.max(x.left,y.left)>1&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>1)))
    clipped.push({text:'TEXT REGIONS OVERLAP: '+regions[a].selector+' / '+regions[b].selector});
  }
  results.push({kind:fixture.kind,locale:fixture.locale,variant:fixture.variant,cardHeight:box.height,clipped});
 }
 return results;
})()`;
 results.push({width,height,cases:JSON.parse(browser(['eval','--stdin'],code))});
}
writeFileSync(output,JSON.stringify({type:'actual-component DOM layout fixture; not gameplay',results},null,2));
console.log(JSON.stringify(results.map(r=>({width:r.width,height:r.height,total:r.cases.length,failures:r.cases.filter((c:{clipped:unknown[]})=>c.clipped.length).map((c:{kind:string;locale:string;variant:string})=>`${c.locale}:${c.kind}:${c.variant}`)})),null,2));
