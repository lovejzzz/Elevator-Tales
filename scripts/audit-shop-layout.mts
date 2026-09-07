/** Injected UI fixtures only, in an explicitly dedicated muted browser. */
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const [session,output]=process.argv.slice(2);
if(!session||!output)throw Error('Dedicated muted session and output required');
const browser=(...args:string[])=>execFileSync('npx',['--yes','agent-browser','--session',session,...args],{encoding:'utf8',maxBuffer:8*1024*1024});
const ev=(code:string)=>JSON.parse(browser('eval',code));
const results=[];
for(const locale of ['en','zh']){
 browser('open',`http://localhost:5183/?lang=${locale}`);
 browser('find','role','button','click','--name',locale==='en'?'Start the Temporary Shift':'开始临时夜班');
 ev(`(()=>{let f=document.querySelector('main')[Object.keys(document.querySelector('main')).find(k=>k.startsWith('__reactFiber'))];while(f&&f.type?.name!=='ElevatorGame')f=f.return;for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.cabin&&h.queue?.dispatch){window.qaRun=h.queue.dispatch;window.qaBase=structuredClone(h.memoizedState);}qaBase.upgrades=Object.fromEntries(Object.keys(qaBase.upgrades).map(k=>[k,0]));return !!qaRun})()`);
 for(const mode of ['ordinary','crisis','installed'])for(const [width,height]of [[1280,720],[1512,982]]){
 browser('set','viewport',String(width),String(height));
 const props={floor:30,status:'upgrade',energy:26,coins:100,earned:100,stress:2,cabin:Array(6).fill(null),shopUpgradeBought:mode==='installed',...(mode==='crisis'?{energy:0,stress:9,coins:60}:{}),shop:mode==='installed'?[]:[{key:'retime',price:24,purchased:false},{key:'reservation',price:20,purchased:false},{key:'delay',price:24,purchased:false}]};
 ev(`(()=>{qaRun({...qaBase,...${JSON.stringify(props)},upgrades:{...qaBase.upgrades,...${JSON.stringify(mode==='installed'?{retime:1,reservation:1,delay:1,calm:1}:{})}},calmCharge:${mode==='installed'}});return true})()`);
 browser('wait','--fn',`!!document.querySelector('[role=dialog]')`);
 const result=ev(`(()=>{const d=document.querySelector('[role=dialog]'),s=d.querySelector('.shop-scroll-body');return {text:d.innerText,scroll:s.scrollHeight-s.clientHeight,muted:['music','sound'].every(k=>localStorage.getItem('elevator-tales-'+k+'-enabled-v1')==='off'),buttons:[...d.querySelectorAll('button,[role=slider]')].map(e=>{const r=e.getBoundingClientRect();return {text:e.getAttribute('aria-label')||e.innerText,visible:r.top>=0&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})}})()`);
 results.push({locale,mode,width,height,...result});
 browser('screenshot',output.replace(/\.json$/,`-${locale}-${mode}-${width}.png`));
 }
}
writeFileSync(output,JSON.stringify({scope:'injected shop layout, not gameplay/economy',results},null,2));
console.log(JSON.stringify(results.map(({locale,mode,width,scroll,muted,buttons})=>({locale,mode,width,scroll,muted,hidden:buttons.filter((b:any)=>!b.visible)})),null,2));
