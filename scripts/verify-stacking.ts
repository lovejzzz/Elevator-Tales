import assert from 'node:assert/strict';
import { bondStatus, conflictLinks, riderProfile } from '../lib/rider-profile';
import { RIDER_SYMBOLS, SYMBOLS } from '../lib/symbols';
import { PASSENGERS, PASSENGER_ORDER, type PassengerKind } from '../lib/game-data';
import { energyBreakdown, initialRun, resolveFloor, riderAgitation, energySavings, type Rider, type RunState } from '../lib/game-engine';

const rider=(kind:PassengerKind,id:string,extra:Partial<Rider>={}):Rider=>({kind,id,destination:20,patience:0,boardedAt:1,fareBonus:0,copySeed:id.length,...extra});
const state=(extra:Partial<RunState>={}):RunState=>({...initialRun(),...extra});

// v10: links follow symbols. Two identical neighbours share both symbols (4 green links counted at the rider); two
// neighbours whose symbols are both opposite give 4 red links; red links do not depend on odd/even floors.
let directedLinkChecks=0;
for(const kind of PASSENGER_ORDER){
  const own=RIDER_SYMBOLS[kind]; if(!own)continue;
  const twin=[rider(kind,`${kind}-a`),rider(kind,`${kind}-self`),rider(kind,`${kind}-b`),null,null,null];
  assert.equal(bondStatus(twin[1]!,twin,1).supportCount,4,`${kind}: every shared symbol of every neighbour counts`);
  const foe=PASSENGER_ORDER.find(k=>{const o=RIDER_SYMBOLS[k];return o&&own.every(s=>o.includes(SYMBOLS[s].opposite));});
  if(!foe)continue;
  const twoRed=[rider(foe,`${kind}-bad-a`),rider(kind,`${kind}-self`),rider(foe,`${kind}-bad-b`),null,null,null];
  assert.equal(bondStatus(twoRed[1]!,twoRed,1).conflictCount,4,`${kind}: every clash of every neighbour counts`);
  assert.equal(conflictLinks(twoRed).length,4,`${kind}: every red link is counted once`);
  assert.deepEqual(conflictLinks(state({floor:1,cabin:twoRed}).cabin),conflictLinks(state({floor:2,cabin:twoRed}).cabin),`${kind}: red links do not depend on odd/even floors`);
  directedLinkChecks+=3;
}

const mechanics=state({cabin:[rider('mechanic','m1'),rider('mechanic','m2'),rider('coach','c'),null,null,null]});
assert.equal(energySavings(mechanics),0,'unfinished Mechanics no longer provide passive passenger savings');
assert.equal(resolveFloor(mechanics,()=>.9).lastEnergy.delta,-5+energyBreakdown(mechanics).symbol,'three riders (the Coach uses 2 since v9.20.2) plus the motor are paid while the first work step is earned');

const occult=state({cabin:[rider('ghost','g1'),rider('exorcist','e'),rider('ghost','g2'),rider('coach','load1'),rider('tourist','t'),rider('coach','load2')]});
assert.equal(energySavings(occult),1,'v9: one Exorcist offsets at most one controlled ghost');

const lovers=state({floor:1,cabin:[rider('lover','l1'),rider('lover','l2',{destination:2}),rider('lover','l3'),null,null,null]});
const loverResult=resolveFloor(lovers,()=>.9);
assert.equal(loverResult.lastEarnings.sources.find(line=>line.label==='恋人连携')?.amount??0,0);
assert.equal(loverResult.lastEarnings.sources.find(line=>line.label==='恋人到站')?.amount,PASSENGERS.lover.fare*3,'base times three (two paired neighbours); v10: no named-partner bonus');

const coaches=state({floor:1,cabin:[rider('coach','c1'),rider('tourist','t',{destination:2}),rider('coach','c2'),null,null,null]});
assert.equal(resolveFloor(coaches,()=>.9).lastEarnings.sources.find(line=>line.label==='游客到站')?.amount,PASSENGERS.tourist.fare*2+4,'two coaches linearly double a non-coach base fare (plus the Tourist’s 2 per neighbour)');

const calmers=state({floor:1,cabin:[rider('nurse','n1'),rider('thief','hot',{volatile:true}),null,null,rider('musician','m1'),null]});
assert.equal(riderAgitation(calmers,1).low,1,'the Nurse offsets one point; the Musician does not provide neighbor care');
assert.equal(riderAgitation(calmers,0).low+riderAgitation(calmers,4).low,0,'calmers never create negative agitation');

const agitated=(id:string)=>rider('mystery',id,{volatile:true,traits:{weight:0,energy:1,agitation:1,fare:30,bond:{likes:['lawyer'],avoids:['ghost']},revision:0}});
const musicianFanout=state({cabin:[agitated('music-a'),rider('musician','music'),agitated('music-b'),null,agitated('music-c'),null]});
assert.deepEqual([0,2,4].map(slot=>riderAgitation(musicianFanout,slot).low),[2,2,2],'a Musician never cancels individual passenger agitation');
const nurseFanout=state({cabin:[agitated('nurse-a'),rider('nurse','nurse'),agitated('nurse-b'),null,agitated('nurse-c'),null]});
assert.deepEqual([0,2,4].map(slot=>riderAgitation(nurseFanout,slot).low),[1,1,1],'one Nurse cancels one point from every adjacent rider');

const inspectors=state({floor:1,cabin:[rider('inspector','i1',{quietStreak:2,destination:2}),rider('inspector','i2',{quietStreak:2,destination:2}),null,null,null,null]});
assert.equal(resolveFloor(inspectors,()=>.9).lastEarnings.sources.find(line=>line.label==='检查员到站')?.amount,2*(PASSENGERS.inspector.fare+12),'v9.7: two Inspectors on their third calm-enough floor independently finish stamps and pay base (v10: 5) +12 bonus each');

const controlledDrunks=state({floor:1,cabin:[rider('drunk','d1'),rider('nurse','n'),rider('drunk','d2'),null,null,null]});
assert.equal(resolveFloor(controlledDrunks,()=>.9).lastEarnings.sources.find(line=>line.label==='醉汉安抚')?.amount??0,0,'calming no longer generates travel income');

const copied=[rider('commuter','a'),rider('mimic','copy'),rider('tourist','b'),null,rider('nurse','c'),null];
assert.equal(riderProfile(copied[1]!,copied,1).copies.length,0,'a top-row Mimic cannot copy sideways or below');
[copied[1],copied[4]]=[copied[4],copied[1]];
assert.equal(riderProfile(copied[4]!,copied,4).copies.length,1,'a lower-row Mimic copies one field only from above');

console.log(JSON.stringify({version:'v8.32',passengers:PASSENGER_ORDER.length,directedLinkChecks,stackFamilies:10,hardStops:['所有相邻对象分别生效','红绿线独立结算','红线不依赖楼层奇偶','幽灵节能不抵运转；检修只抵运转','控制状态不重复','同一复制字段不重复']}));
