import assert from 'node:assert/strict';
import { PASSENGER_ORDER, type PassengerKind } from '../lib/game-data';
import { energyBreakdown, initialRun, resolveFloor, type Rider, type RunState } from '../lib/game-engine';
import { BONDS, CONFLICT_EFFECTS, bondStatus, conflictLinks, type ConflictEffect, type VariableTraits } from '../lib/rider-profile';

const pairKey=(a:PassengerKind,b:PassengerKind)=>[a,b].sort().join(':');
const rider=(kind:PassengerKind,id:string,extra:Partial<Rider>={}):Rider=>({kind,id,destination:20,patience:0,boardedAt:1,fareBonus:0,fuse:9,...extra});
const state=(cabin:Array<Rider|null>,extra:Partial<RunState>={}):RunState=>({...initialRun(),energy:50,stressCap:99,coins:100,cabin,...extra});
const amount=(lines:Array<{label:string;amount:number}>,label:string)=>lines.find(line=>line.label===label)?.amount??0;

const allDefinedKinds=Object.keys(BONDS) as PassengerKind[]; // includes archived definitions
const greenPairs=new Set(allDefinedKinds.flatMap(kind=>BONDS[kind].likes.map(target=>pairKey(kind,target))));
const redPairs=new Set(allDefinedKinds.flatMap(kind=>BONDS[kind].avoids.map(target=>pairKey(kind,target))));
assert.equal(greenPairs.size,18);
assert.equal(redPairs.size,30);
assert.deepEqual([...greenPairs].filter(pair=>redPairs.has(pair)),[],'one pair must never be both a static green and red relationship');
assert.deepEqual(new Set(Object.keys(CONFLICT_EFFECTS)),redPairs,'every static red pair needs an explicit effect');

const effectCounts=Object.values(CONFLICT_EFFECTS).reduce<Record<ConflictEffect,number>>((counts,effect)=>({...counts,[effect]:counts[effect]+1}),{agitation:0,energy:0,coins:0,overload:0,gamble:0});
assert.deepEqual(effectCounts,{agitation:10,energy:8,coins:9,overload:2,gamble:1});

for(const kind of ['tourist','lover','musician','nurse'] as const){
 const cabin=[rider('inspector','inspector'),rider(kind,kind),null,null,null,null];
 assert.equal(conflictLinks(cabin).length,0,'Quiet-work Inspector must not retain retired conflicts with '+kind);
}
for(const kind of ['thief','drunk','celebrity','ghost','mystery'] as const){
 const cabin=[rider('inspector','inspector'),rider(kind,kind),null,null,null,null];
 assert.equal(conflictLinks(cabin).length,1,'Inspector still has a conditional placement cost with '+kind);
}

const agitationCabin=[rider('commuter','commuter'),rider('drunk','drunk'),null,null,null,null];
const agitationResult=resolveFloor(state(agitationCabin),()=>.9);
assert.equal(amount(agitationResult.lastPressure.sources,'红线躁动'),1);

const energyCabin=[rider('courier','courier'),rider('ghost','ghost'),null,null,null,null];
const energyRun=state(energyCabin);
assert.equal(energyBreakdown(energyRun).conflict,1);
assert.equal(amount(resolveFloor(energyRun,()=>.9).lastEnergy.sources,'红线额外耗电'),-1);

const coinCabin=[rider('tourist','tourist'),rider('thief','thief'),null,null,null,null];
const coinResult=resolveFloor(state(coinCabin),()=>.9);
assert.equal(amount(coinResult.lastEarnings.sources,'红线金币损失'),-2);

const overloadCabin=[rider('mechanic','mechanic'),rider('bomb','bomb'),null,null,null,null];
const overloadRun=state(overloadCabin);
assert.equal(energyBreakdown(overloadRun).conflict,2,'x2 power adds one more copy of both riders base power');
assert.equal(energyBreakdown(overloadRun).conflictProtection,0,'ordinary savings never erase the separately itemized red-line multiplier');
assert.equal(energyBreakdown(overloadRun).total,5);

const gambleCabin=[rider('coach','coach',{destination:2}),rider('celebrity','celebrity',{destination:2}),null,null,null,null];
const gambleResult=resolveFloor(state(gambleCabin),()=>.9);
assert.equal(amount(gambleResult.lastEarnings.sources,'教练到站'),19,'8 base doubled, plus one 3-coin neighbor');
assert.equal(amount(gambleResult.lastEarnings.sources,'名人到站'),30);

const independentCabin=[rider('courier','green'),rider('commuter','center'),rider('drunk','red'),null,null,null];
assert.deepEqual({support:bondStatus(independentCabin[1]!,independentCabin,1).supportCount,conflict:bondStatus(independentCabin[1]!,independentCabin,1).conflictCount},{support:1,conflict:1});
assert.equal(conflictLinks(independentCabin).length,1,'green support must not erase a red line');
assert.equal(amount(resolveFloor(state(independentCabin),()=>.9).lastPressure.sources,'红线躁动'),1);

const doubleAgitation=[rider('drunk','left'),rider('commuter','center'),rider('drunk','right'),null,null,null];
assert.equal(amount(resolveFloor(state(doubleAgitation),()=>.9).lastPressure.sources,'红线躁动'),2,'two identical red lines stack');

const doubleCoins=[rider('thief','left'),rider('tourist','center'),rider('thief','right'),null,null,null];
assert.equal(amount(resolveFloor(state(doubleCoins),()=>.9).lastEarnings.sources,'红线金币损失'),-4,'coin losses stack per red line');

const doubleEnergy=[rider('ghost','left'),rider('courier','center'),rider('ghost','right'),null,null,null];
assert.equal(energyBreakdown(state(doubleEnergy)).conflict,2,'flat energy costs stack per red line');

const doubleOverload=[rider('bomb','left'),rider('mechanic','center'),rider('bomb','right'),null,null,null];
assert.deepEqual({conflict:energyBreakdown(state(doubleOverload)).conflict,total:energyBreakdown(state(doubleOverload)).total},{conflict:4,total:8},'two x2 links add two base copies instead of multiplying exponentially');

const doubleGamble=[rider('celebrity','left',{destination:2}),rider('coach','center',{destination:2}),rider('celebrity','right',{destination:2}),null,null,null];
const doubleGambleResult=resolveFloor(state(doubleGamble),()=>.9);
assert.equal(amount(doubleGambleResult.lastEarnings.sources,'教练到站'),30,'two x2 links produce 8x3 base plus two 3-coin neighbors');
assert.equal(amount(doubleGambleResult.lastEarnings.sources,'名人到站'),60,'each Celebrity receives its own coach and gamble multipliers');

const dynamicTraits:VariableTraits={weight:0,energy:1,agitation:0,fare:30,bond:{likes:['nurse'],avoids:['commuter']},conflictEffect:'coins',revision:0};
const dynamicCabin=[rider('commuter','commuter'),rider('shifter','shifter',{traits:dynamicTraits}),null,null,null,null];
assert.equal(conflictLinks(dynamicCabin)[0]?.effect,'coins','dynamic riders keep their visible randomized red-line effect');

console.log(JSON.stringify({version:'v8.32',activeRoles:PASSENGER_ORDER.length,definedRoles:allDefinedKinds.length,greenPairs:greenPairs.size,redPairs:redPairs.size,effectCounts,representativeEffects:5,stackingChecks:5,greenRedIndependent:true,multipliers:'linear-from-base'}));
