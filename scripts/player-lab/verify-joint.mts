import assert from 'node:assert/strict';
import {E,D,type UpgradeKey,type PassengerKind} from './game.mts';
import {Names,observe,clone,Session,replay} from './runtime.mts';
import {jointShopTrials,jointChargeTargets,serviceFor} from './search.mts';
import {Player} from './policies.mts';
import {shopCalibrationFlags,type ShopVisit} from './analytics.mts';
import {rider} from './fixtures.mts';
import {hash,rngFor} from './util.mts';

const state={...E.initialRun(),floor:30,status:'upgrade' as const,coins:100,energy:30,shop:(['calm','punchcard','retime'] as UpgradeKey[]).map(key=>({key,price:E.UPGRADE_BASE_PRICES[key],purchased:false}))};
state.cabin=[rider('commuter','a',30,2),rider('courier','b',30,3),null,null,null,null];
const w={state,offers:[]},before=hash(w),names=new Names();
const trials=jointShopTrials(w,names,1);
assert(trials.some(t=>t.key==='none'&&!t.actions.some(a=>a.type==='charge')),'Already viable energy must retain a cash-preserving no-charge alternative');
const risky=clone(w);risky.state.stress=6;risky.state.coins=20;risky.state.energy=30;
risky.state.cabin=[rider('thief','risk',29,4),null,null,null,null,null];
const budget=jointChargeTargets(risky),dismiss=E.dismissalCost(risky.state,risky.state.cabin[0]!);
assert.equal(budget.reserve,30+Math.floor(Math.max(0,20-dismiss)/E.CHARGE_PRICE),'Reserve budget uses visible legal dismissal price');
assert.equal(budget.minimum,30);assert.equal(budget.full,risky.state.energyCap);
assert(budget.commitment>=1&&Number.isFinite(budget.commitment));
assert.equal(hash(w),before,'Sampling cannot mutate actual game');
assert(trials.some(t=>t.key==='none'),'No-buy control is mandatory');
assert.equal(new Set(trials.map(t=>t.key)).size,4,'Every offered purchase must be evaluated');
assert.deepEqual(trials,jointShopTrials(w,new Names(),1),'Reproducible independent beliefs');
for(const t of trials){const s=new Session(931,false,w);for(const a of t.actions)s.act(a);replay(s.replayRecord());assert.equal(s.observation().phase,'playing');}
const choice=new Player('operator','joint').shop(observe(w,names),serviceFor(w,names));
assert(choice.actions.length);
const hidden=clone(w);hidden.state.cabin[0]=rider('mystery','sealed',30,2);
const altered=clone(hidden);altered.state.cabin[0]!.traits!.fare=9999;
assert.deepEqual(jointShopTrials(hidden,new Names(),1),jointShopTrials(altered,new Names(),1),'No sealed fare oracle');
assert.throws(()=>jointShopTrials(w,names,0));
const publicShop=observe(w,new Names()),none=trials.find(t=>t.key==='none')!;
const visit:ShopVisit={entry:publicShop,exit:{...publicShop,energy:50,coins:100},actions:none.actions,trials:[{...none,survival:1}],spend:0,emptyPermanentPool:false,minimumRepair:0,fullServiceQuote:60};
const dead={...publicShop,phase:'lost' as const,failureCause:'energy' as const,floor:39};
assert.deepEqual(shopCalibrationFlags([visit],dead).map(f=>f.code),['AFFORDABLE_CHARGE_LEFT_BEFORE_DEATH','SHOP_MODEL_SURVIVAL_MISS']);
assert.equal(shopCalibrationFlags([visit],{...dead,phase:'playing'}).length,0);
assert(!shopCalibrationFlags([visit],{...dead,floor:51}).some(f=>f.code==='SHOP_MODEL_SURVIVAL_MISS'));
const long=jointShopTrials(w,new Names(),1,20);
assert(long.every(t=>t.depth===20&&t.floors<=20));
assert(long.some(t=>t.floors>10),'Long horizon must actually traverse intervening shop');
assert.equal(hash(w),before);
const crisis=clone(w);crisis.state.stress=10;crisis.state.coins=35;crisis.state.energy=50;
const calm=jointShopTrials(crisis,new Names(),1).find(t=>t.key==='calm');
assert(calm?.actions.some(a=>a.type==='use-calm'),'Newly purchased free relief is considered before paid repair');

// All single items x every ordered role pair x agitation bands, then all
// 190 two-item and 4,845 four-item loadouts in deterministic rotating cabins.
// These are engine interaction fixtures, not whole games or balance proof.
const keys=Object.keys(D.UPGRADES) as UpgradeKey[],roles=D.PASSENGER_ORDER;
let transitions=0;const covered=new Set<string>();
function settle(loadout:UpgradeKey[],kinds:PassengerKind[],stress:number,index:number){
 let s={...E.initialRun(),floor:31,energy:60,coins:100,stress};
 for(const key of loadout)s=E.previewUpgrade(s,key);
 s.cabin=Array.from({length:6},(_,i)=>i<kinds.length?rider(kinds[i],'r'+i,31,1+i%3):null);
 const snapshot=hash(s),next=E.resolveFloor(s,rngFor(710003+index));
 assert.equal(hash(s),snapshot,'Settlement must not mutate input');
 for(const value of [next.energy,next.coins,next.stress,next.lastEarnings.total,next.bufferPower??0])assert(Number.isFinite(value));
 assert(next.energy<=next.energyCap);assert((next.bufferPower??0)>=0&&(next.bufferPower??0)<=4);
 assert.equal(next.coins-s.coins,next.lastEarnings.total,'Shared ledger conservation');
 loadout.forEach(key=>covered.add(key));transitions++;
}
for(const key of keys)for(const a of roles)for(const b of roles)for(const stress of [0,3,5])settle([key],[a,b],stress,transitions);
for(let a=0;a<keys.length;a++)for(let b=a+1;b<keys.length;b++){
 for(let i=0;i<roles.length;i++)settle([keys[a],keys[b]],[roles[i],roles[(i+1)%roles.length],roles[(i+7)%roles.length]],i%3===0?5:i%3===1?3:0,transitions);
 for(let c=b+1;c<keys.length;c++)for(let d=c+1;d<keys.length;d++)settle([keys[a],keys[b],keys[c],keys[d]],Array.from({length:6},(_,i)=>roles[(transitions+i*3)%roles.length]),transitions%6,transitions);
}
assert.equal(covered.size,20);
console.log(JSON.stringify({checks:['shop legal replay','determinism','no mutation','sealed-fare independence','no-buy control','all-item interaction ledgers'],items:keys.length,roles:roles.length,transitions,shopCandidates:trials.length}));
