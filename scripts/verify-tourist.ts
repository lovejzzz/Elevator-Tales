import assert from 'node:assert/strict';
import { PASSENGERS, type PassengerKind } from '../lib/game-data';
import { initialRun, resolveFloor, touristCompanionCount, type Rider, type RunState } from '../lib/game-engine';

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
assert.equal(touristCompanionCount(duplicate,1),1,'duplicate professions and adjacent Tourists do not stack');

const diverse=[rider('commuter','a'),rider('tourist','t'),rider('mechanic','b'),null,rider('celebrity','c'),null];
assert.equal(touristCompanionCount(diverse,1),2,'three different professions respect the +2 cap');
assert.equal(income(state(diverse),'游客旅伴'),2);

const arrival=state(diverse.map(r=>r?{...r,destination:2}:null),{floor:1});
const settled=resolveFloor(arrival,()=>.9);
assert.equal(settled.lastEarnings.sources.find(line=>line.label==='游客旅伴')?.amount,2,'arrival floor still earns companion income');
assert.equal(settled.lastEarnings.sources.find(line=>line.label==='游客到站')?.amount,21,'base fare plus one green-link reward settles separately');

let cases=0,totalBonus=0;
const kinds:PassengerKind[]=['commuter','tourist','courier','mechanic','lover','musician'];
for(let a=0;a<kinds.length;a++)for(let b=0;b<kinds.length;b++)for(let c=0;c<kinds.length;c++){
 const cabin=[rider(kinds[a],`a${a}`),rider('tourist','focus'),rider(kinds[b],`b${b}`),null,rider(kinds[c],`c${c}`),null];
 const expected=Math.min(2,new Set([kinds[a],kinds[b],kinds[c]].filter(kind=>kind!=='tourist')).size);
 const actual=touristCompanionCount(cabin,1);
 assert.equal(actual,expected);
 totalBonus+=actual;cases++;
}

console.log(JSON.stringify({version:'v8.16',cases,averageCompanionBonus:Math.round(totalBonus/cases*100)/100,hardStops:['游客不互刷','同职业不重复','每位游客最多+2/站','教练只翻倍基础车费'] }));
