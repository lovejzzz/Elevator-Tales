import assert from 'node:assert/strict';
import { PASSENGERS, type PassengerKind } from '../lib/game-data';
import { initialRun, resolveFloor, touristCompanionCount, type Rider, type RunState } from '../lib/game-engine';
import { activeConnection } from '../lib/game-interaction';

const rider=(kind:PassengerKind,id:string,extra:Partial<Rider>={}):Rider=>({kind,id,destination:20,patience:0,boardedAt:1,fareBonus:0,...extra});
const state=(cabin:Array<Rider|null>,extra:Partial<RunState>={}):RunState=>({...initialRun(),cabin,...extra});
const income=(run:RunState,label:string)=>resolveFloor(run,()=>.9).lastEarnings.sources.find(line=>line.label===label)?.amount??0;

assert.deepEqual({fare:PASSENGERS.tourist.fare,energy:PASSENGERS.tourist.energy,trip:PASSENGERS.tourist.trip},{fare:18,energy:1,trip:[4,7]});

const alone=[null,rider('tourist','t'),null,null,null,null];
assert.equal(touristCompanionCount(alone,1),0);
assert.equal(income(state(alone),'游客旅伴'),0);

const one=[rider('commuter','a'),rider('tourist','t'),null,null,null,null];
assert.equal(touristCompanionCount(one,1),1);
assert.equal(income(state(one),'游客旅伴'),1);

const duplicate=[rider('commuter','a'),rider('tourist','t'),rider('commuter','b'),null,rider('tourist','other'),null];
assert.equal(touristCompanionCount(duplicate,1),3,'every adjacent rider stacks, including duplicate professions and Tourists');
assert.equal(income(state(duplicate),'游客旅伴'),4,'adjacent Tourists count one another while each counts its own neighbors');
assert.equal(activeConnection(duplicate,1,4),true,'adjacent Tourists draw a positive companion link');

const diverse=[rider('commuter','a'),rider('tourist','t'),rider('mechanic','b'),null,rider('celebrity','c'),null];
assert.equal(touristCompanionCount(diverse,1),3,'three occupied neighboring positions all count');
assert.equal(income(state(diverse),'游客旅伴'),3);

const arrival=state(diverse.map(r=>r?{...r,destination:2}:null),{floor:1});
const settled=resolveFloor(arrival,()=>.9);
assert.equal(settled.lastEarnings.sources.find(line=>line.label==='游客旅伴')?.amount,3,'arrival floor still earns companion income');
assert.equal(settled.lastEarnings.sources.find(line=>line.label==='游客到站')?.amount,21,'base fare plus one green-link reward settles separately');

const pair=[rider('tourist','pair-a'),rider('tourist','pair-b'),null,null,null,null];
const pairResult=resolveFloor(state(pair),()=>.9);
assert.equal(pairResult.lastEarnings.sources.find(line=>line.label==='游客旅伴')?.amount,2,'a Tourist pair earns +1 per Tourist per floor');
assert.equal(pairResult.lastEarnings.sources.some(line=>line.label==='游客到站'),false,'companion links do not invent an arrival reward before arrival');
const arrivingPair=resolveFloor(state(pair.map(r=>r?{...r,destination:2}:null),{floor:1}),()=>.9);
assert.equal(arrivingPair.lastEarnings.total,38,'two arriving Tourists earn 36 base fare plus 2 companion coins, with no hidden generic link reward');

const full=Array.from({length:6},(_,slot)=>rider('tourist',`full-${slot}`));
assert.equal(income(state(full),'游客旅伴'),14,'a full Tourist cabin earns twice the seven adjacency edges');

let cases=0,totalBonus=0;
const kinds:PassengerKind[]=['commuter','tourist','courier','mechanic','lover','musician'];
for(let a=0;a<kinds.length;a++)for(let b=0;b<kinds.length;b++)for(let c=0;c<kinds.length;c++){
 const cabin=[rider(kinds[a],`a${a}`),rider('tourist','focus'),rider(kinds[b],`b${b}`),null,rider(kinds[c],`c${c}`),null];
 const expected=3;
 const actual=touristCompanionCount(cabin,1);
 assert.equal(actual,expected);
 totalBonus+=actual;cases++;
}

console.log(JSON.stringify({version:'v8.20',cases,cabinEdgeMaximum:7,fullTouristCabinBonus:14,averageCompanionBonus:Math.round(totalBonus/cases*100)/100,hardStops:['每位邻座逐人叠加','游客互相成为旅伴','站位几何自然限制单人最多3位旅伴','旅伴绿线不额外发放通用到站协作奖励','教练只翻倍基础车费'] }));
