import assert from 'node:assert/strict';
import { PASSENGER_ORDER, type PassengerKind } from '../lib/game-data';
import { energyBreakdown, initialRun, resolveFloor, type Rider, type RunState } from '../lib/game-engine';
import { BONDS, CONFLICT_EFFECTS, bondStatus, conflictLinks, type ConflictEffect, type VariableTraits } from '../lib/rider-profile';

const pairKey=(a:PassengerKind,b:PassengerKind)=>[a,b].sort().join(':');
const rider=(kind:PassengerKind,id:string,extra:Partial<Rider>={}):Rider=>({kind,id,destination:20,patience:0,boardedAt:1,fareBonus:0,fuse:9,...extra});
const state=(cabin:Array<Rider|null>,extra:Partial<RunState>={}):RunState=>({...initialRun(),energy:50,stressCap:99,coins:100,cabin,...extra});
const amount=(lines:Array<{label:string;amount:number}>,label:string)=>lines.find(line=>line.label===label)?.amount??0;

const greenPairs=new Set(PASSENGER_ORDER.flatMap(kind=>BONDS[kind].likes.map(target=>pairKey(kind,target))));
const redPairs=new Set(PASSENGER_ORDER.flatMap(kind=>BONDS[kind].avoids.map(target=>pairKey(kind,target))));
assert.equal(greenPairs.size,20);
assert.equal(redPairs.size,35);
assert.deepEqual([...greenPairs].filter(pair=>redPairs.has(pair)),[],'one pair must never be both a static green and red relationship');
assert.deepEqual(new Set(Object.keys(CONFLICT_EFFECTS)),redPairs,'every static red pair needs an explicit effect');

const effectCounts=Object.values(CONFLICT_EFFECTS).reduce<Record<ConflictEffect,number>>((counts,effect)=>({...counts,[effect]:counts[effect]+1}),{agitation:0,energy:0,coins:0,overload:0,gamble:0});
assert.deepEqual(effectCounts,{agitation:12,energy:8,coins:12,overload:2,gamble:1});

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
assert.equal(energyBreakdown(overloadRun).conflict,3,'x2 power adds one more copy of both riders base power');
assert.equal(energyBreakdown(overloadRun).conflictProtection,0,'ordinary savings never erase the separately itemized red-line multiplier');
assert.equal(energyBreakdown(overloadRun).total,5);

const gambleCabin=[rider('coach','coach',{destination:2}),rider('celebrity','celebrity',{destination:2}),null,null,null,null];
const gambleResult=resolveFloor(state(gambleCabin),()=>.9);
assert.equal(amount(gambleResult.lastEarnings.sources,'教练到站'),43);
assert.equal(amount(gambleResult.lastEarnings.sources,'名人到站'),45);

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
assert.deepEqual({conflict:energyBreakdown(state(doubleOverload)).conflict,total:energyBreakdown(state(doubleOverload)).total},{conflict:6,total:9},'two x2 links add two base copies instead of multiplying exponentially');

const doubleGamble=[rider('celebrity','left',{destination:2}),rider('coach','center',{destination:2}),rider('celebrity','right',{destination:2}),null,null,null];
const doubleGambleResult=resolveFloor(state(doubleGamble),()=>.9);
assert.equal(amount(doubleGambleResult.lastEarnings.sources,'教练到站'),66,'two x2 links produce x3 base fare');
assert.equal(amount(doubleGambleResult.lastEarnings.sources,'名人到站'),90,'each Celebrity receives its own coach and gamble multipliers');

const dynamicTraits:VariableTraits={weight:0,energy:1,agitation:0,fare:30,bond:{likes:['nurse'],avoids:['commuter']},conflictEffect:'coins',revision:0};
const dynamicCabin=[rider('commuter','commuter'),rider('shifter','shifter',{traits:dynamicTraits}),null,null,null,null];
assert.equal(conflictLinks(dynamicCabin)[0]?.effect,'coins','dynamic riders keep their visible randomized red-line effect');

console.log(JSON.stringify({version:'v8.20',greenPairs:greenPairs.size,redPairs:redPairs.size,effectCounts,representativeEffects:5,stackingChecks:5,greenRedIndependent:true,multipliers:'linear-from-base'}));
