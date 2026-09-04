import assert from 'node:assert/strict';
import { initialRun, resolveFloor, energySavings, riderAgitation, type Rider, type RunState } from '../lib/game-engine';
import { PASSENGERS, passengerCardGrade } from '../lib/game-data';
import { passengerBrief, passengerFace, SHARED_SAVING_RULE } from '../lib/passenger-presentation';
import { addDiscoveredPassengers, sanitizeDiscoveredPassengers } from '../lib/passenger-discovery';
const rider=(kind:Rider['kind'],id=kind as string,extra:Partial<Rider>={}):Rider=>({kind,id,destination:8,boardedAt:1,patience:0,fareBonus:0,...extra});
const state=(extra:Partial<RunState>={}):RunState=>({...initialRun(),...extra});
let checks=0;
for(const floor of [1,2,3,4])for(const extraEnergy of [0,1])for(const upgraded of [false,true])for(const stress of [0,10]){
 const run=state({floor,stress,cabin:[rider('inspector'),null,extraEnergy?rider('tourist'):null,null,null,null]});
 if(upgraded)run.upgrades={...run.upgrades,reinforced:1,solar:1};
 const after=resolveFloor(run,()=>.9);
 const people=1+extraEnergy,stabilizer=upgraded?1:0,saving=upgraded&&(floor+1)%4===0&&people>stabilizer?1:0;
 assert.equal(after.lastEarnings.sources.find(s=>s.label==='检查员合规奖励')?.amount??0,1);
 assert.equal(riderAgitation(run,0).low,0);
 assert.equal(energySavings(run),saving,'savings apply only after stabilizer');
 assert.equal(after.energy,run.energy-1-people+stabilizer+saving);
 checks++;
}
const lovers=state({floor:4,cabin:[rider('lover','a',{destination:5,fareBonus:3}),rider('lover','b',{destination:5,fareBonus:3}),null,null,null,null]});
const paid=resolveFloor(lovers,()=>.9);
assert.equal(paid.lastEarnings.sources.filter(s=>s.label==='恋人到站').reduce((n,s)=>n+s.amount,0),36);
assert.equal(paid.coins,38);
const face=passengerBrief(lovers.cabin[0]!,4,lovers.cabin);
assert.equal(face.coins,6);assert.equal(face.tip,3);
assert.match(passengerFace(lovers.cabin[0]!,lovers).moneyNote,/基价\+100%/);
const coaches=state({cabin:[rider('coach','a',{destination:2}),rider('coach','b',{destination:2}),null,null,null,null]});
assert.deepEqual(PASSENGERS.coach.trip,[3,6],'Coach uses the tested shorter trip window');
assert.equal(resolveFloor(coaches,()=>.9).coins,46,'coaches do not multiply one another');
const coachFace=passengerFace(coaches.cabin[0]!,coaches);
assert.match(coachFace.moneyNote,/每位相邻教练/);assert.match(coachFace.moneyNote,/基础车费\+50%/);assert.match(coachFace.moneyNote,/每邻座\+3/);
const mysteryBetweenCoaches=state({floor:1,cabin:[
 rider('coach','coach-left'),
 rider('mystery','hidden',{destination:2,traits:{weight:0,energy:1,agitation:0,fare:31,bond:{likes:['nurse'],avoids:['ghost']},revision:0}}),
 rider('coach','coach-right'),null,null,null,
]});
const revealedMystery=resolveFloor(mysteryBetweenCoaches,()=>.9);
assert.equal(revealedMystery.lastEarnings.sources.find(line=>line.label==='神秘人揭晓车费')?.amount,62,'two adjacent Coaches double the Mystery rider hidden base fare before reveal');
assert.ok(revealedMystery.log.some(line=>line.includes('神秘人封存车费揭晓：31 金币')),'the log reveals the original hidden base fare only on arrival');
assert.deepEqual(['standard','fine','rare','legendary'],[
 passengerCardGrade('commuter'),passengerCardGrade('mechanic'),passengerCardGrade('coach'),passengerCardGrade('shifter'),
]);
for(const kind of ['mechanic','ghost','exorcist'] as const){
 const brief=passengerBrief(rider(kind),1);
 assert.ok(brief.skillRules.includes(SHARED_SAVING_RULE));
 assert.ok(brief.cardRules[0].lines.includes(SHARED_SAVING_RULE));
}
const duplicate=state({cabin:[rider('inspector','a'),rider('inspector','b'),null,null,null,null]});
assert.equal(resolveFloor(duplicate,()=>.9).coins,2,'each inspector grants one bounded reward');
assert.equal(resolveFloor(duplicate,()=>.9).energy,39);
assert.deepEqual(sanitizeDiscoveredPassengers(null),[],'an old save does not unlock the archive');
assert.deepEqual(sanitizeDiscoveredPassengers(['lover','bogus','lover']),['lover'],'saved discoveries are validated and deduplicated');
assert.deepEqual(addDiscoveredPassengers([],['lover','lover','courier']),['courier','lover'],'only passengers actually seen are collected');
assert.equal(addDiscoveredPassengers(['courier','lover'],['thief']).length,3,'new encounters extend the archive');
console.log(JSON.stringify({version:'v8.17',inspectorCases:checks,tipMultiplier:true,coachExceptions:true,mysteryCoachStack:62,cardGrades:4,savingsCopy:true,archiveDiscovery:true}));
