import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import * as E from '../lib/game-engine';
import * as D from '../lib/game-data';
import * as R from '../lib/rider-profile';
import * as F from '../lib/game-forecast';
import * as I from '../lib/game-interaction';
const out=new URL('../experiments/v8.29/',import.meta.url); mkdirSync(out,{recursive:true});
const rngFor=(seed:number)=>()=>{let t=seed+=0x6d2b79f5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
const write=(name:string,data:any)=>writeFileSync(new URL(name+'.json',out),JSON.stringify({version:'8.29',seed:Number(process.env.ET_SEED??4260904),...data},null,2));

type Policy={id:string,cap:number,reposition?:boolean,dismiss?:boolean,smartShop?:boolean,pressureStep?:number,highRiskStart?:number,volatileSpan?:number};
function value(s:any){
 let annualIncome=0,pressure=0,projectedStress=0,links=0;
 s.cabin.forEach((r:any,slot:number)=>{
  if(!r)return;
  const p=R.riderProfile(r,s.cabin,slot),trip=Math.max(1,r.destination-s.floor),near=E.neighbours(slot).map((i:number)=>s.cabin[i]).filter(Boolean);
  let fare=(p.hidden?24:p.fare)+(r.volatile?8:0),flow=0;
  if(r.kind==='lover'){const c=near.filter((n:any)=>n.kind==='lover').length;fare*=1+c;flow+=c;}
  if(r.kind==='tourist')flow+=near.length;
  if(r.kind==='thief'){const controlled=E.hasNeighbour(s.cabin,slot,['cop','lawyer']);flow+=controlled?1:4;if(controlled)fare+=5;}
  if(r.kind==='drunk'&&E.hasNeighbour(s.cabin,slot,['nurse','musician']))flow++;
  if(r.kind==='celebrity'&&near.length===1)flow+=3;
  if(r.kind==='ghost'&&E.hasNeighbour(s.cabin,slot,['exorcist']))fare+=6;
  if(r.kind==='inspector'&&E.totalEnergyCost(s)<=4)flow++;
  if(r.kind==='bomb'&&r.fuse<trip){
   const cops=near.filter((n:any)=>n.kind==='cop');
   const cover=cops.length?Math.max(...cops.map((n:any)=>n.destination-s.floor)):0;
   if(r.fuse+cover<trip)pressure+=150;
  }
  const gamble=R.conflictLinks(s.cabin).filter((l:any)=>l.effect==='gamble'&&(l.first===slot||l.second===slot)).length;
  fare=Math.ceil(fare*(1+(r.kind==='coach'?0:near.filter((n:any)=>n.kind==='coach').length*.5)+gamble+E.agitationAppetite(r,s.cabin,slot,s.stress)));
  if(r.kind==='coach')fare+=near.length*3;
  const green=R.bondStatus(r,s.cabin,slot).supportCount;links+=green;
  fare+=r.fareBonus+E.cooperationBonus(s)*green;
  annualIncome+=flow+fare/trip+(r.kind==='courier'?4/trip:0);
  projectedStress+=Math.max(0,E.riderAgitation(s,slot).low-1/trip);
 });
 const red=R.conflictLinks(s.cabin);
 annualIncome-=2*red.filter((l:any)=>l.effect==='coins').length;
 const energy=F.energyForecast(s),stress=F.stressForecast(s),cost=E.totalEnergyCost(s);
 const danger=E.resolveFloor(s,()=>.51).status==='lost';
 pressure+=stress.highDelta*(s.stress>=s.stressCap-2?16:7)+projectedStress*4+red.filter((l:any)=>l.effect==='agitation').length*5;
 const horizon=Math.max(1,Math.min(4,E.nextShopFloor(s.floor)-s.floor));
 const energyRisk=Math.max(0,cost*horizon-s.energy)*3;
 return annualIncome*1.6-cost*(s.energy<15?3.6:2.5)-pressure-energyRisk-(danger?10000:0)+links*.15;
}
function chooseBoard(s:any,offers:any[],p:Policy){
 const waiting=[...offers];
 while(s.cabin.filter(Boolean).length<p.cap&&waiting.length){
  let best=s.cabin.some(Boolean)?value(s)+.01:-Infinity,chosen=-1,next=s;
  waiting.forEach((r:any,k:number)=>s.cabin.forEach((old:any,slot:number)=>{
   if(old)return;
   const plan=I.planPlacement(s,r,slot);if(!plan.ok)return;
   const v=value(plan.next);if(v>best){best=v;chosen=k;next=plan.next;}
  }));
  if(chosen<0)break;s=next;waiting.splice(chosen,1);
 }
 return s;
}
function improve(s:any,p:Policy){
 let next=s,best=value(s)+.01,action='';
 if(p.reposition)s.cabin.forEach((r:any,i:number)=>{if(r)for(let j=0;j<6;j++){
  if(i===j||(i>j&&s.cabin[j]))continue;
  const plan=I.planPlacement(s,r,j);if(!plan.ok||!plan.changed)continue;
  const v=value(plan.next);if(v>best){best=v;next=plan.next;action='move';}
 }});
 if(p.dismiss)s.cabin.forEach((r:any)=>{
  if(!r||s.cabin.filter(Boolean).length<=1)return;
  const n=E.dismissRider(s,r.id);if(n===s)return;
  const v=value(n)-E.dismissalCost(s,r)/Math.max(1,r.destination-s.floor)*1.6;
  if(v>best){best=v;next=n;action='dismiss';}
 });
 return {state:next,action};
}
function shop(s:any,p:Policy){
 const buy=(key:D.UpgradeKey)=>{s=E.installUpgrade(s,key);};
 if(p.smartShop){
  if(s.stress>=s.stressCap-3&&s.shop.some((c:any)=>c.key==='calm'&&c.price<=s.coins))buy('calm');
  const reserve=Math.max(0,Math.min(40,s.energyCap)-s.energy)*2;
  const stable=s.shop.find((c:any)=>c.key==='reinforced'&&!c.purchased&&c.price<=s.coins-reserve);
  if(stable)buy('reinforced');
 }
 const target=p.smartShop?Math.min(s.energyCap,Math.max(25,E.totalEnergyCost(s)*7+8)):Math.min(s.energyCap,Math.max(50,E.totalEnergyCost(s)*10));
 const charge=Math.min(Math.max(0,target-s.energy),Math.floor(s.coins/2));
 if(charge)s=E.chargeBattery(s,charge);
 const scores:any={calm:Math.min(6,s.stress)*6+10,reinforced:30,solar:25,concierge:28,express:27,battery:11+s.upgrades.battery*4};
 for(;;){const c=s.shop.filter((c:any)=>!c.purchased&&c.price<=s.coins).sort((a:any,b:any)=>scores[b.key]/b.price-scores[a.key]/a.price)[0];if(!c||scores[c.key]/c.price<.25)break;buy(c.key);}
 return E.leaveShop(s);
}
function simulate(p:Policy,runs:number){
 const floors:number[]=[],deaths:any={energy:0,stress:0,bomb:0,censored:0},purchases:any={},byFloor:any={};let moves=0,dismissals=0,turns=0,occupancy=0,earned=0,forecastMisses=0;
 for(let n=0;n<runs;n++){
  let s=E.initialRun();const seed=Number(process.env.ET_SEED??4260904)+n*97;
  while(s.status!=='lost'&&s.floor<160){
   if(s.status==='upgrade'){
    const old={...s.upgrades};s=shop(s,p);for(const k of Object.keys(old) as D.UpgradeKey[])purchases[k]=(purchases[k]??0)+s.upgrades[k]-old[k];if(s.status==='lost')break;
   }
   // Separate floor-keyed random streams: policies cannot shift subsequent offer RNG.
   const offers=E.makeOffers(s.floor,s.upgrades,false,rngFor(seed+s.floor*100003),s.cabin,undefined,{pressureStep:p.pressureStep,highRiskStart:p.highRiskStart,volatileSpan:p.volatileSpan});
   s=chooseBoard(s,offers,p);
   const improvement=improve(s,p);s=improvement.state;moves+=Number(improvement.action==='move');dismissals+=Number(improvement.action==='dismiss');
   assert.ok(s.cabin.some(Boolean));turns++;occupancy+=s.cabin.filter(Boolean).length;
   const e=F.energyForecast(s),f=F.stressForecast(s);
   const next=E.resolveFloor(s,rngFor(seed+s.floor*200003));
   if(next.lastEnergy.delta<e.lowDelta||next.lastEnergy.delta>e.highDelta||next.lastPressure.delta<f.lowDelta||next.lastPressure.delta>f.highDelta)forecastMisses++;
   s=next;
  }
  floors.push(s.floor);earned+=s.earned;byFloor[s.floor]=(byFloor[s.floor]??0)+1;
  deaths[s.status!=='lost'?'censored':s.message.includes('炸弹倒计时')?'bomb':s.energy<=0?'energy':'stress']++;
 }
 floors.sort((a,b)=>a-b);
 const avg=floors.reduce((a,b)=>a+b,0)/runs,sd=Math.sqrt(floors.reduce((a,b)=>a+(b-avg)**2,0)/(runs-1));
 return{...p,runs,mean:avg,se:sd/Math.sqrt(runs),median:floors[Math.floor(runs/2)],p10:floors[Math.floor(runs*.1)],p90:floors[Math.floor(runs*.9)],reach40:floors.filter(f=>f>=40).length/runs,reach60:floors.filter(f=>f>=60).length/runs,reach80:floors.filter(f=>f>=80).length/runs,occupancy:occupancy/turns,earned:earned/runs,moves,dismissals,deaths,purchases,byFloor,forecastMisses};
}
const mode=process.argv[2]??'cap-reserve';
{
 const runs=Number(process.argv[3]??100);
 const policies:Policy[]=mode==='focus'?[{id:'cap1',cap:1,reposition:true},{id:'cap4',cap:4,reposition:true},{id:'move-dismiss',cap:4,reposition:true,dismiss:true}]:mode==='cap-reserve'?[1,2,3,4,5,6].map(cap=>({id:'cap'+cap,cap,reposition:true})):
 mode==='pressure-reserve'?[{id:'live',cap:4,reposition:true,dismiss:true},{id:'pressure60',cap:4,reposition:true,dismiss:true,pressureStep:60},{id:'volatile80',cap:4,reposition:true,dismiss:true,volatileSpan:80},{id:'start40',cap:4,reposition:true,dismiss:true,highRiskStart:40}]:
 mode==='cap'?[1,2,3,4,5,6].map(cap=>({id:'cap'+cap,cap,reposition:true,smartShop:true})):
 mode==='pressure'?[{id:'live',cap:4,reposition:true,dismiss:true,smartShop:true},{id:'pressure60',cap:4,reposition:true,dismiss:true,smartShop:true,pressureStep:60},{id:'volatile80',cap:4,reposition:true,dismiss:true,smartShop:true,volatileSpan:80},{id:'start40',cap:4,reposition:true,dismiss:true,smartShop:true,highRiskStart:40}]:
 [{id:'no-move',cap:4},{id:'legal-move',cap:4,reposition:true},{id:'move-dismiss',cap:4,reposition:true,dismiss:true},{id:'shop-priority',cap:4,reposition:true,dismiss:true,smartShop:true}];
 const results=[];for(const p of policies){const result=simulate(p,runs);results.push(result);console.log(JSON.stringify(result));}
 write(mode,{runs,results,limits:'Heuristic policies, not optimal play or human outcomes. Each policy uses a maximum of one selected legal improvement per floor. Does not model all new-rider free moves, multi-card lookahead, psychological load, or session duration. Hidden fare uses expectation 24; future random traits are not read. Same seed per floor keeps random streams aligned as far as candidate composition permits.'});
}
