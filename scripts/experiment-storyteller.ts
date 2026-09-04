import { EMPTY_UPGRADES, makeOffers, type Rider } from '../lib/game-engine';

const runs=Math.max(1,Number(process.argv[2]||100000));
const horizon=80;
const rngFor=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const child=(id:string,floor:number,trip:number):Rider=>({id,kind:'child',destination:floor+trip,patience:0,boardedAt:floor,fareBonus:0});
const percentile=(sorted:number[],p:number)=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];

function cohort(entryFloor:number,startsWithChild:boolean,childCallChance:number){
 const waits:number[]=[];let censored=0,totalPayout=0,totalEnergyOneNet=0;
 for(let n=0;n<runs;n++){
  const rng=rngFor(8150001+entryFloor*100003+n*17);let floor=entryFloor,ride=0;
  let children:Rider[]=startsWithChild?[child(`initial-${n}`,floor,2+Math.floor(rng()*4))]:[];
  let exited=false;
  while(ride<horizon){
   const cabin:Array<Rider|null>=[...children,null,null,null,null,null].slice(0,6);
   let offer=makeOffers(floor,EMPTY_UPGRADES,false,rng,cabin).find(rider=>rider.kind==='child');
   if(!offer&&childCallChance>0&&rng()<childCallChance)offer=child(`called-${n}-${floor}`,floor,2+Math.floor(rng()*4));
   if(offer&&children.length<2)children.push(offer);
   const leavesNext=children.length>=2;
   floor++;ride++;
   if(leavesNext){exited=true;break;}
   children=children.filter(rider=>rider.destination>floor);
  }
  if(!exited){censored++;continue;}
  waits.push(ride);
  const payout=8+ride;
  totalPayout+=payout;
  totalEnergyOneNet+=payout-ride;
 }
 waits.sort((a,b)=>a-b);
 const completed=waits.length;
 return {entryFloor,startsWithChild,childCallChance,runs,exitRate:+(completed/runs*100).toFixed(2),medianWait:percentile(waits,.5),p75Wait:percentile(waits,.75),p90Wait:percentile(waits,.9),p95Wait:percentile(waits,.95),trapped20:+(waits.filter(v=>v>20).length/runs*100+censored/runs*100).toFixed(2),averagePayout:+(totalPayout/completed).toFixed(2),averageCoinsPerLockedFloor:+(totalPayout/waits.reduce((a,b)=>a+b,0)).toFixed(2),energyOneAverageNet:+(totalEnergyOneNet/completed).toFixed(2),censored};
}

const chances=[0,.1,.2,.3,.4];
const results=[10,20,40].flatMap(floor=>[false,true].flatMap(hasChild=>chances.map(chance=>cohort(floor,hasChild,chance))));
console.log(JSON.stringify({concept:'storyteller',rule:'base 8 +1 banked coin per floor; zero power; cannot dismiss; two simultaneous Children trigger next-floor exit',runsPerCohort:runs,totalRuns:runs*results.length,horizon,results},null,2));
