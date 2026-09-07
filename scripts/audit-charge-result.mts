/** Isolated, muted UI fixtures; never a gameplay/balance simulation. */
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const session=process.argv[2];
if(!session)throw Error('Dedicated muted session required');
const b=(...args:string[])=>execFileSync('npx',['--yes','agent-browser','--session',session,...args],{encoding:'utf8'});
const ev=(code:string)=>JSON.parse(b('eval',code));
for(const lang of ['zh','en']){
 b('open',`http://localhost:5183/?lang=${lang}`);
 b('find','role','button','click','--name',lang==='zh'?'开始临时夜班':'Start the Temporary Shift');
 ev(`(()=>{let f=document.querySelector('main')[Object.keys(document.querySelector('main')).find(k=>k.startsWith('__reactFiber'))];while(f&&f.type?.name!=='ElevatorGame')f=f.return;for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.cabin&&h.queue?.dispatch){window.qaRun=h.queue.dispatch;window.qaBase=structuredClone(h.memoizedState);}return true})()`);
 for(const [energy,coins,target]of [[5,45,27],[5,200,60],[59,45,60],[5,0,5],[5,1,5],[5,20,15]]){
  ev(`(()=>{qaRun({...qaBase,floor:10,status:'upgrade',energy:${energy},coins:${coins},earned:200});return true})()`);
  b('wait','--fn',`document.querySelector('.charge-slider-panel output')?.textContent==='${target}/60'`);
  assert.equal(ev(`document.querySelector('.charge-control input[type=range]').getAttribute('aria-valuenow')`),String(target));
 }
 for(const [energy,stress,message] of [[0,0,'电量耗尽'],[20,8,'躁动失控'],[20,0,'炸弹倒计时归零']]){
  ev(`(()=>{qaRun({...qaBase,floor:14,status:'lost',energy:${energy},stress:${stress},message:${JSON.stringify(message)},coins:56,earned:100});return true})()`);
  for(const [width,height]of [[1280,720],[390,844]]){
   b('set','viewport',String(width),String(height));
   b('wait','--fn',`!!document.querySelector('.compact-result')`);
   const result=ev(`(()=>{const d=document.querySelector('.compact-result'),r=d.getBoundingClientRect();return {fits:r.top>=0&&r.bottom<=innerHeight&&d.scrollHeight<=d.clientHeight+1,closed:!d.querySelector('details').open,muted:['music','sound'].every(k=>localStorage.getItem('elevator-tales-'+k+'-enabled-v1')==='off')}})()`);
   assert.deepEqual(result,{fits:true,closed:true,muted:true});
  }
 }
 b('screenshot',`/Users/tianxing/Documents/ChatGPT/Elevator Tales/player-lab/charge-result-${lang}.png`);
 b('find','text',lang==='zh'?'本局详情':'Run details','click');
 assert.equal(ev(`document.querySelector('.result-details').open`),true);
 b('find','role','button','click','--name',lang==='zh'?'再来一局':'Play again');
 b('wait','--fn',`!document.querySelector('.compact-result')`);
}
console.log('PASS: 12 charge defaults, 12 compact failure layouts, both languages muted, details and restart.');
