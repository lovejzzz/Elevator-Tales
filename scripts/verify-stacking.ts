import assert from 'node:assert/strict';
import { BONDS, bondStatus, riderProfile } from '../lib/rider-profile';
import { PASSENGER_ORDER, type PassengerKind } from '../lib/game-data';
import { initialRun, resolveFloor, riderAgitation, energySavings, type Rider, type RunState } from '../lib/game-engine';

const rider=(kind:PassengerKind,id:string,extra:Partial<Rider>={}):Rider=>({kind,id,destination:20,patience:0,boardedAt:1,fareBonus:0,copySeed:id.length,...extra});
const state=(extra:Partial<RunState>={}):RunState=>({...initialRun(),...extra});

let directedLinkChecks=0;
for(const kind of PASSENGER_ORDER){
  // The mimic's relationship itself can be one of the copied fields, so its
  // generic edges are intentionally variable; its three-field stack is below.
  if(kind==='mimic')continue;
  const liked=BONDS[kind].likes[0],avoided=BONDS[kind].avoids[0];
  const twoGreen=[rider(liked,`${kind}-good-a`),rider(kind,`${kind}-self`),rider(liked,`${kind}-good-b`),null,null,null];
  const twoRed=[rider(avoided,`${kind}-bad-a`),rider(kind,`${kind}-self`),rider(avoided,`${kind}-bad-b`),null,null,null];
  const protectedCabin=[rider(liked,`${kind}-good`),rider(kind,`${kind}-self`),rider(avoided,`${kind}-bad`),null,null,null];
  assert.equal(bondStatus(twoGreen[1]!,twoGreen,1).supportCount,2,`${kind}: every green neighbor must count`);
  assert.equal(bondStatus(twoRed[1]!,twoRed,1).conflictCount,2,`${kind}: every red neighbor must count`);
  assert.equal(bondStatus(protectedCabin[1]!,protectedCabin,1).conflictCount,0,`${kind}: a green link protects only the neighbor-conflict layer`);
  assert.equal(riderAgitation(state({floor:1,cabin:twoRed}),1).fixed.find(line=>line.label==='邻座冲突')?.amount,2,`${kind}: red links stack on even destination floors`);
  assert.equal(riderAgitation(state({floor:2,cabin:twoRed}),1).fixed.find(line=>line.label==='邻座冲突'),undefined,`${kind}: red links stay dormant on odd destination floors`);
  directedLinkChecks+=3;
}

const mechanics=state({cabin:[rider('mechanic','m1'),rider('mechanic','m2'),rider('coach','c'),null,null,null]});
assert.equal(energySavings(mechanics),4,'two mechanics contribute two savings each');
assert.equal(resolveFloor(mechanics,()=>.9).lastEnergy.delta,-1,'stacked savings stop at passenger demand and never erase motor cost');

const occult=state({cabin:[rider('ghost','g1'),rider('exorcist','e'),rider('ghost','g2'),null,rider('tourist','t'),null]});
assert.equal(energySavings(occult),2,'each controlled ghost contributes its own saving');

const lovers=state({floor:1,cabin:[rider('lover','l1'),rider('lover','l2',{destination:2}),rider('lover','l3'),null,null,null]});
const loverResult=resolveFloor(lovers,()=>.9);
assert.equal(loverResult.lastEarnings.sources.find(line=>line.label==='恋人连携')?.amount,4);
assert.equal(loverResult.lastEarnings.sources.find(line=>line.label==='恋人到站')?.amount,24);

const coaches=state({floor:1,cabin:[rider('coach','c1'),rider('tourist','t',{destination:2}),rider('coach','c2'),null,null,null]});
assert.equal(resolveFloor(coaches,()=>.9).lastEarnings.sources.find(line=>line.label==='游客到站')?.amount,36,'two coaches linearly double a non-coach base fare');

const calmers=state({floor:1,cabin:[rider('nurse','n1'),rider('thief','hot',{volatile:true}),null,null,rider('musician','m1'),null]});
assert.equal(riderAgitation(calmers,1).low,0,'two adjacent calmers cancel two visible points from one rider');
assert.equal(riderAgitation(calmers,0).low+riderAgitation(calmers,4).low,0,'calmers never create negative agitation');

const inspectors=state({floor:1,cabin:[rider('inspector','i1'),rider('inspector','i2'),null,null,null,null]});
assert.equal(resolveFloor(inspectors,()=>.9).lastEarnings.sources.find(line=>line.label==='检查员合规奖励')?.amount,2,'each inspector independently pays');

const controlledDrunks=state({floor:1,cabin:[rider('drunk','d1'),rider('nurse','n'),rider('drunk','d2'),null,null,null]});
assert.equal(resolveFloor(controlledDrunks,()=>.9).lastEarnings.sources.find(line=>line.label==='醉汉安抚')?.amount,2,'each calm drunk independently pays');

const copied=[rider('commuter','a'),rider('mimic','copy'),rider('tourist','b'),null,rider('nurse','c'),null];
assert.equal(riderProfile(copied[1]!,copied,1).copies.length,3,'mimic stacks one distinct copied field from every neighbor');

console.log(JSON.stringify({version:'v8.17',passengers:PASSENGER_ORDER.length,directedLinkChecks,stackFamilies:8,hardStops:['节能不抵运转','控制状态不重复','同一复制字段不重复']}));
