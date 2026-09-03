import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { initialRun, makeOffers, resolveFloor, chargingPlan, chargeBattery, leaveShop } from '../experiments/v61/lib/game-engine';
import { planPlacement } from '../experiments/v61/lib/game-interaction';

// Early-game controls deliberately ignore hidden fare and advanced tactics.
// Frozen v6.1 game engine; initial energy is the only rules variable.
const games=500,horizon=31,seedBase=903810019;
const rngFor=(game:number,floor:number,phase:number)=>{let seed=seedBase+game*100003+floor*991+phase*29009;return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};};
const results=[];let transitions=0;
for(const energy of [18,20,22,24])for(const tutorial of [false,true])for(const cap of [2,6]){
 const floors:number[]=[],firstShopCoins:number[]=[],postChargeCoins:number[]=[];
 let shopPassed=0,deathsEnergy=0,deathsStress=0;
 for(let game=0;game<games;game++){
  let state={...initialRun(),energy};
  while(state.status!=='lost'&&state.floor<horizon){
   if(state.status==='upgrade'){
    const isFirst=state.floor===10;if(isFirst)firstShopCoins.push(state.coins);
    state=chargeBattery(state,Math.min(chargingPlan(state).units,Math.floor(state.coins/2)));
    if(isFirst)postChargeCoins.push(state.coins);
    state=leaveShop(state);if(isFirst&&state.status==='playing')shopPassed++;
    continue;
   }
   const offers=makeOffers(state.floor,state.upgrades,tutorial&&state.floor===1,rngFor(game,state.floor,1),state.cabin);
   for(const offer of offers){
    if(state.cabin.filter(Boolean).length>=cap)break;
    for(let slot=0;slot<6;slot++)if(!state.cabin[slot]){
     const plan=planPlacement(state,offer,slot);if(plan.ok){state=plan.next;break;}
    }
   }
   state=resolveFloor(state,rngFor(game,state.floor,3));transitions++;
  }
  floors.push(state.floor);
  if(state.status==='lost'){if(state.energy<=0)deathsEnergy++;else deathsStress++;}
 }
 const mean=(ns:number[])=>ns.length?ns.reduce((a,b)=>a+b,0)/ns.length:null;
 results.push({energy,capacity:24,tutorial,policy:cap===2?'first-two':'first-fit-six',games,
  reach10:floors.filter(f=>f>=10).length/games,pass10:shopPassed/games,reach20:floors.filter(f=>f>=20).length/games,reach31:floors.filter(f=>f>=31).length/games,
  deathsEnergy,deathsStress,meanFirstShopCoins:mean(firstShopCoins),meanAfterFirstCharge:mean(postChargeCoins),floors});
}
assert.equal(results.length,16);
const dir=resolve(process.env.ELEVATOR_AUDIT_OUTPUT??resolve(import.meta.dirname,'../docs/parameter-audit-2026-09-03'));mkdirSync(dir,{recursive:true});
const target=resolve(dir,'onboarding.json');assert.ok(!existsSync(target));
const report={revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),seedBase,games:games*results.length,horizon,transitions,
 limits:'Simple deterministic first-fit bots; no forecasts, reseating or upgrades, charge first. Not measured human skill or enjoyment. Runs reaching 31 are censored, not victories. Tutorial only fixes the first offers.',results};
writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,results:results.map(({floors:_floors,...rest})=>rest)},null,2));
