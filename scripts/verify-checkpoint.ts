import assert from 'node:assert/strict';
import {initialRun,resolveFloor,makeOffers,riderAgitation,inspectionExtraEnergy,shiftOutlook,type Rider} from '../lib/game-engine';
import {MECHANIC_SAVING,PASSENGERS} from '../lib/game-data';
import {PASSENGER_RULES,passengerFace} from '../lib/passenger-presentation';
const rider=(kind:Rider['kind'],id:string):Rider=>({kind,id,boardedAt:1,destination:80,patience:0,fareBonus:0});
let cases=0;
for(let floor=1;floor<=12;floor++)for(const stress of [0,10])for(const stabilized of [0,1])for(const mode of ['none','mechanic','ghost','solar'])for(let load=0;load<=3;load++){
 const run=initialRun();run.floor=floor;run.stress=stress;run.upgrades.reinforced=stabilized;
 run.cabin=[rider('inspector','i'),null,null,null,null,null];
 if(mode==='mechanic')run.cabin[1]=rider('mechanic','m');
 if(mode==='ghost'){run.cabin[1]=rider('ghost','g');run.cabin[2]=rider('exorcist','e');}
 if(mode==='solar')run.upgrades.solar=1;
 for(let i=0;i<load;i++)run.cabin[5-i]=rider('tourist','t'+i);
 const next=floor+1,mechanicActive=mode==='mechanic';
 const rawSaved=mechanicActive?MECHANIC_SAVING:mode==='ghost'||mode==='solar'&&next%4===0?1:0;
 const people=1+(mode==='mechanic'||mode==='ghost'?1:0)+load*2;
 const remainder=Math.max(0,people-stabilized-Math.min(rawSaved,people-stabilized));
 assert.equal(inspectionExtraEnergy(run),remainder);
 assert.equal(riderAgitation(run,0).low,remainder>3?1:0);
 const result=resolveFloor(run,()=>.9);
 assert.equal(result.lastEarnings.sources.find(s=>s.label==='检查员合规奖励')?.amount??0,remainder<=3?1:0);
 assert.equal(result.lastEnergy.delta,-1-remainder);cases++;
}
assert.equal(PASSENGERS.child.fare,7);assert.deepEqual(PASSENGERS.child.trip,[2,5]);
let seed=1996723,children=0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let n=0;n<2000;n++)for(const r of makeOffers(15,initialRun().upgrades,false,random))if(r.kind==='child'){assert.ok(r.destination-15>=2&&r.destination-15<=5);children++;}
assert.ok(children>100);
const face=passengerFace(rider('inspector','i'),initialRun());assert.match(face.special,/含本人/);
assert.ok(PASSENGER_RULES.inspector.some(s=>s.includes('不超过4')));
assert.equal(shiftOutlook(1),'');assert.equal(shiftOutlook(8),'');
assert.equal(shiftOutlook(9),'下一站：商店');
assert.equal(shiftOutlook(38,2,0),'');
assert.equal(shiftOutlook(39,0,1),'下一站：商店');
assert.equal(shiftOutlook(40,2,0),'本层起，高危候客增加');
console.log(JSON.stringify({version:'v8.14',inspectionInteractions:cases,generatedChildren:children,childRange:[2,5],fare:7}));
