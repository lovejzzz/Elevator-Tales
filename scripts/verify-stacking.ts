import assert from 'node:assert/strict';
import { BONDS, bondStatus, conflictLinks, riderProfile } from '../lib/rider-profile';
import { PASSENGER_ORDER, type PassengerKind } from '../lib/game-data';
import { initialRun, resolveFloor, riderAgitation, energySavings, type Rider, type RunState } from '../lib/game-engine';

const rider=(kind:PassengerKind,id:string,extra:Partial<Rider>={}):Rider=>({kind,id,destination:20,patience:0,boardedAt:1,fareBonus:0,copySeed:id.length,...extra});
const state=(extra:Partial<RunState>={}):RunState=>({...initialRun(),...extra});

let directedLinkChecks=0;
for(const kind of PASSENGER_ORDER){
  // Mimics copy values, never bonds; their own directed bonds remain testable.
  const liked=BONDS[kind].likes[0],avoided=BONDS[kind].avoids[0];
  const twoGreen=[rider(liked,`${kind}-good-a`),rider(kind,`${kind}-self`),rider(liked,`${kind}-good-b`),null,null,null];
  const twoRed=[rider(avoided,`${kind}-bad-a`),rider(kind,`${kind}-self`),rider(avoided,`${kind}-bad-b`),null,null,null];
  const protectedCabin=[rider(liked,`${kind}-good`),rider(kind,`${kind}-self`),rider(avoided,`${kind}-bad`),null,null,null];
  assert.equal(bondStatus(twoGreen[1]!,twoGreen,1).supportCount,2,`${kind}: every green neighbor must count`);
  assert.equal(bondStatus(twoRed[1]!,twoRed,1).conflictCount,2,`${kind}: every red neighbor must count`);
  assert.equal(bondStatus(protectedCabin[1]!,protectedCabin,1).conflictCount,1,`${kind}: green and red links resolve independently`);
  assert.equal(conflictLinks(twoRed).length,2,`${kind}: every red edge is counted once`);
  assert.deepEqual(conflictLinks(state({floor:1,cabin:twoRed}).cabin),conflictLinks(state({floor:2,cabin:twoRed}).cabin),`${kind}: red links do not depend on odd/even floors`);
  directedLinkChecks+=3;
}

const mechanics=state({cabin:[rider('mechanic','m1'),rider('mechanic','m2'),rider('coach','c'),null,null,null]});
assert.equal(energySavings(mechanics),0,'unfinished Mechanics no longer provide passive passenger savings');
assert.equal(resolveFloor(mechanics,()=>.9).lastEnergy.delta,-4,'three riders plus the motor are paid while the first work step is earned');

const occult=state({cabin:[rider('ghost','g1'),rider('exorcist','e'),rider('ghost','g2'),rider('coach','load1'),rider('tourist','t'),rider('coach','load2')]});
assert.equal(energySavings(occult),2,'each controlled ghost contributes its own one-point saving');

const lovers=state({floor:1,cabin:[rider('lover','l1'),rider('lover','l2',{destination:2}),rider('lover','l3'),null,null,null]});
const loverResult=resolveFloor(lovers,()=>.9);
assert.equal(loverResult.lastEarnings.sources.find(line=>line.label==='恋人连携')?.amount??0,0);
assert.equal(loverResult.lastEarnings.sources.find(line=>line.label==='恋人到站')?.amount,11,'3 base times three, plus two unmultiplied bonds');

const coaches=state({floor:1,cabin:[rider('coach','c1'),rider('tourist','t',{destination:2}),rider('coach','c2'),null,null,null]});
assert.equal(resolveFloor(coaches,()=>.9).lastEarnings.sources.find(line=>line.label==='游客到站')?.amount,20,'two coaches linearly double a non-coach base fare');

const calmers=state({floor:1,cabin:[rider('nurse','n1'),rider('thief','hot',{volatile:true}),null,null,rider('musician','m1'),null]});
assert.equal(riderAgitation(calmers,1).low,1,'the Nurse offsets one point; the Musician does not provide neighbor care');
assert.equal(riderAgitation(calmers,0).low+riderAgitation(calmers,4).low,0,'calmers never create negative agitation');

const agitated=(id:string)=>rider('mystery',id,{volatile:true,traits:{weight:0,energy:1,agitation:1,fare:30,bond:{likes:['lawyer'],avoids:['ghost']},revision:0}});
const musicianFanout=state({cabin:[agitated('music-a'),rider('musician','music'),agitated('music-b'),null,agitated('music-c'),null]});
assert.deepEqual([0,2,4].map(slot=>riderAgitation(musicianFanout,slot).low),[2,2,2],'a Musician never cancels individual passenger agitation');
const nurseFanout=state({cabin:[agitated('nurse-a'),rider('nurse','nurse'),agitated('nurse-b'),null,agitated('nurse-c'),null]});
assert.deepEqual([0,2,4].map(slot=>riderAgitation(nurseFanout,slot).low),[1,1,1],'one Nurse cancels one point from every adjacent rider');

const inspectors=state({floor:1,cabin:[rider('inspector','i1',{quietStreak:1,destination:2}),rider('inspector','i2',{quietStreak:1,destination:2}),null,null,null,null]});
assert.equal(resolveFloor(inspectors,()=>.9).lastEarnings.sources.find(line=>line.label==='检查员到站')?.amount,32,'two Inspectors independently finish stamps and pay 8 base +8 bonus each');

const controlledDrunks=state({floor:1,cabin:[rider('drunk','d1'),rider('nurse','n'),rider('drunk','d2'),null,null,null]});
assert.equal(resolveFloor(controlledDrunks,()=>.9).lastEarnings.sources.find(line=>line.label==='醉汉安抚')?.amount??0,0,'calming no longer generates travel income');

const copied=[rider('commuter','a'),rider('mimic','copy'),rider('tourist','b'),null,rider('nurse','c'),null];
assert.equal(riderProfile(copied[1]!,copied,1).copies.length,0,'a top-row Mimic cannot copy sideways or below');
[copied[1],copied[4]]=[copied[4],copied[1]];
assert.equal(riderProfile(copied[4]!,copied,4).copies.length,1,'a lower-row Mimic copies one field only from above');

console.log(JSON.stringify({version:'v8.32',passengers:PASSENGER_ORDER.length,directedLinkChecks,stackFamilies:10,hardStops:['所有相邻对象分别生效','红绿线独立结算','红线不依赖楼层奇偶','幽灵节能不抵运转；检修只抵运转','控制状态不重复','同一复制字段不重复']}));
