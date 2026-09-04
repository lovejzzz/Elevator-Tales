import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initialRun, resolveFloor, energySavings, riderAgitation, type Rider, type RunState } from '../lib/game-engine';
import { PASSENGERS, PASSENGER_ORDER, passengerCardGrade } from '../lib/game-data';
import { passengerBrief, passengerCardSections, passengerFace, SHARED_SAVING_RULE } from '../lib/passenger-presentation';
import { addDiscoveredPassengers, sanitizeDiscoveredPassengers } from '../lib/passenger-discovery';
import { shouldPreviewConnection } from '../lib/connection-preview';
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
assert.equal(PASSENGERS.coach.energy,1,'Coach must not remain a two-power survival trap');
assert.deepEqual([PASSENGERS.musician.fare,PASSENGERS.musician.energy,PASSENGERS.musician.trip[0],PASSENGERS.musician.trip[1],PASSENGERS.musician.rarity],[14,2,2,5,4],'Musician is a rare, high-fare, short-burst control card');
assert.deepEqual([PASSENGERS.nurse.fare,PASSENGERS.nurse.energy,PASSENGERS.nurse.rarity],[8,1,8],'Nurse remains the common lightweight control card');
assert.ok(passengerFace(rider('musician'),state()).pressure.slice(1).some(line=>line.includes('所有相邻乘客')&&line.includes('抵消2躁动')),'Musician fan-out value stays visible on the card face');
assert.ok(passengerFace(rider('nurse'),state()).pressure.slice(1).some(line=>line.includes('所有相邻乘客')&&line.includes('抵消1躁动')),'Nurse fan-out value stays visible on the card face');
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
assert.deepEqual(['standard','legendary','rare','legendary','legendary'],[
 passengerCardGrade('commuter'),passengerCardGrade('mechanic'),passengerCardGrade('coach'),passengerCardGrade('shifter'),
 passengerCardGrade('courier'),
]);
for(const kind of ['ghost','exorcist'] as const){
 const brief=passengerBrief(rider(kind),1);
 assert.ok(brief.skillRules.includes(SHARED_SAVING_RULE));
 assert.ok(brief.cardRules[0].lines.includes(SHARED_SAVING_RULE));
}
const mechanicBrief=passengerBrief(rider('mechanic'),1);
assert.ok(mechanicBrief.skillRules.some(rule=>rule.includes('每层节能2电')));
assert.ok(mechanicBrief.skillRules.some(rule=>rule.includes('叠加')));
const duplicate=state({cabin:[rider('inspector','a'),rider('inspector','b'),null,null,null,null]});
assert.equal(resolveFloor(duplicate,()=>.9).coins,2,'each inspector grants one bounded reward');
assert.equal(resolveFloor(duplicate,()=>.9).energy,47);
assert.deepEqual(sanitizeDiscoveredPassengers(null),[],'an old save does not unlock the archive');
assert.deepEqual(sanitizeDiscoveredPassengers(['lover','bogus','lover']),['lover'],'saved discoveries are validated and deduplicated');
assert.deepEqual(addDiscoveredPassengers([],['lover','lover','courier']),['courier','lover'],'only passengers actually seen are collected');
assert.equal(addDiscoveredPassengers(['courier','lover'],['thief']).length,3,'new encounters extend the archive');
for(const kind of PASSENGER_ORDER){
 const sections=passengerCardSections(rider(kind),state());
 assert.ok(sections.green.length>0,`${kind} keeps at least one green-neighbor decision`);
 const redTargets=sections.red.flatMap(section=>section.targets??[]);
 assert.equal(redTargets.length,new Set(redTargets).size,`${kind} red-neighbor targets are grouped without repetition`);
 assert.doesNotMatch(JSON.stringify(sections),/协作|冲突|相邻|挨|旁边|prevented|cooperates/i,`${kind} card uses only the three-part neighbor grammar`);
}
const officerSections=passengerCardSections(rider('cop'),state());
assert.deepEqual(officerSections.green.map(section=>section.targets),[['thief'],['bomb']],'Officer shows one concise row per green-neighbor outcome');
assert.equal(officerSections.green[0].effects.filter(item=>item.tone==='agitation').length,1,'Officer does not repeat the Thief agitation outcome');
assert.equal(officerSections.greenBonus[0].text,'本人到站时 +3/邻座','the generic green reward names its owner and arrival timing once');
assert.ok(officerSections.green[0].effects.some(item=>item.text==='每上1层立即 +1'),'per-floor income states that it settles immediately');
assert.doesNotMatch(JSON.stringify(officerSections),/收益 \+1\/层/,'the ambiguous per-floor income label is gone');
const thiefRed=passengerCardSections(rider('thief'),state()).red;
assert.ok(thiefRed.some(section=>section.targets?.includes('inspector')&&section.targets.includes('ghost')),'identical Thief coin-loss neighbors share one row');
assert.equal(passengerCardSections(rider('musician'),state()).green[0].effects[0].text,'每人 −2/层','Musician fan-out stays concise and exact');
const component=fs.readFileSync('components/elevator-game.tsx','utf8');
const stylesheet=fs.readFileSync('app/globals.css','utf8');
assert.match(component,/compactAgitationValue/,'cabin agitation uses a compact numeric value');
assert.doesNotMatch(component,/seat-energy[^\n]+seatBrief\.energy\}\/站/,'cabin power does not repeat a unit inside the narrow metric strip');
assert.doesNotMatch(stylesheet,/new-rider-ring|newly-boarded \.seat-art::after/,'current-floor cards use their edge instead of a portrait ring');
assert.match(stylesheet,/grid-template-rows:auto auto minmax\(0,1fr\) auto auto/,'cabin facts own separate layout rows');
assert.equal(shouldPreviewConnection(true,false,false,null,null),false,'empty graph edges never inherit the global drag-preview style');
assert.equal(shouldPreviewConnection(true,false,true,null,null),true,'a newly created green link is previewed');
assert.equal(shouldPreviewConnection(true,true,true,null,null),false,'an unchanged green link keeps its settled style');
assert.equal(shouldPreviewConnection(true,false,false,null,'energy'),true,'a newly created red link is previewed');
assert.equal(shouldPreviewConnection(true,false,false,'energy','coin'),true,'a changed red-link effect is previewed');
assert.equal(shouldPreviewConnection(true,false,false,'energy','energy'),false,'an unchanged red link keeps its settled style');
assert.doesNotMatch(component,/\$\{previewing \? 'preview-link'/,'drag preview is never applied to the entire adjacency map');
console.log(JSON.stringify({version:'v8.26',inspectorCases:checks,tipMultiplier:true,coachExceptions:true,mysteryCoachStack:62,cardGrades:5,savingsCopy:true,archiveDiscovery:true,distinctCalmers:true,threePartCards:PASSENGER_ORDER.length,cabinCardRows:5,portraitRing:false,edgeScopedPreview:true}));
