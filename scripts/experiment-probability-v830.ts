import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

let seed=83050904;
const rng=()=>{let t=seed+=0x6d2b79f5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
const simulations=20000;
const results=[];
for(const attempts of [10,20,40,80]) for(const chance of [1,.5,.1,.02]) {
  const reward=2/chance, totals:number[]=[]; let zeros=0;
  for(let trial=0;trial<simulations;trial++){
    let total=0;
    for(let i=0;i<attempts;i++) if(rng()<chance) total+=reward;
    totals.push(total); zeros+=Number(total===0);
  }
  totals.sort((a,b)=>a-b);
  const mean=totals.reduce((a,b)=>a+b,0)/simulations;
  const variancePerAttempt=chance*(1-chance)*reward**2;
  const sem=Math.sqrt(attempts*variancePerAttempt/simulations);
  assert.ok(Math.abs(mean-2*attempts)<=6*sem+1e-8);
  results.push({attempts,chance,reward,mean,expected:2*attempts,zeroRate:zeros/simulations,exactZero:(1-chance)**attempts,
    p10:totals[Math.floor(simulations*.1)],median:totals[Math.floor(simulations*.5)],p90:totals[Math.floor(simulations*.9)],
    repaid30:totals.filter(t=>t>=30).length/simulations});
}
const chance=.02,guarantee=50;
const expectedAttempts=(1-(1-chance)**guarantee)/chance;
const report={seed:83050904,runs:simulations*results.length,results,
  visibleGuarantee:{chance,guarantee,expectedAttempts,reward100ExpectedPerAttempt:100/expectedAttempts,rewardForMean2:2*expectedAttempts},
  existingRandomness:['Lover call 25% per eligible batch','Ghost randomly chooses a neighbor on every third floor','Mystery sealed fare and random traits','Shifter changes every floor','Mimic stable per-neighbor assignment'],
  limits:'Fixed independent eligible opportunities, not naturally occurring session counts. Equal mean rewards do not imply equal survival, comprehension or fun. The visible-guarantee renewal mean is long-run, not the finite-run average. No paid rerolls or hidden odds manipulation.'};
const out=new URL('../experiments/v8.30/',import.meta.url);mkdirSync(out,{recursive:true});
writeFileSync(new URL('probability.json',out),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
