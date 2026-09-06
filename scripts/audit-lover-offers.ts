import assert from 'node:assert/strict';
import {makeOffers, EMPTY_UPGRADES, type Rider} from '../lib/game-engine';
import {activeConnection} from '../lib/game-interaction';
import {conflictLinks} from '../lib/rider-profile';
const rngFor=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const lover=(id:string):Rider=>({id,kind:'lover',destination:99,boardedAt:1,patience:0,fareBonus:0});
const layouts:{name:string;cabin:(Rider|null)[]}[]=[
 {name:'none',cabin:Array(6).fill(null)},
 {name:'one-unpaired',cabin:[lover('a'),null,null,null,null,null]},
 {name:'two-unpaired',cabin:[lover('a'),null,lover('b'),null,null,null]},
 {name:'paired',cabin:[lover('a'),lover('b'),null,null,null,null]},
];
type PacketStats={floor:number;name:string;packets:number;loverCardsPct:number;anyLoverPct:number;multipleLoversPct:number;callPct:number;loversPerSuccessfulCall:number};
const results:PacketStats[]=[];
for(const floor of [5,25,45])for(const {name,cabin} of layouts){
 const rng=rngFor(832);let total=0,packets=0,multiple=0,called=0,calledLovers=0;
 for(let i=0;i<20000;i++){
  const offers=makeOffers(floor,EMPTY_UPGRADES,false,rng,cabin),lovers=offers.filter(r=>r.kind==='lover').length;
  const call=offers.some(r=>r.calledByLover);
  assert.equal(offers.length,3);
  if(call){
   assert.equal(lovers,1,'A successful call supplies exactly one Lover');
   assert.equal(offers.filter(r=>r.calledByLover).length,1);assert.equal(offers.find(r=>r.calledByLover)?.kind,'lover');
   const pair=offers.filter(r=>r.kind!=='lover');
   const interacts=[[0,1],[0,3],[3,0]].some(([a,b])=>{const seats:Array<Rider|null>=Array(6).fill(null);seats[a]=pair[0];seats[b]=pair[1];return activeConnection(seats,a,b)||conflictLinks(seats).length>0;});
   assert(interacts,'The other two offers retain a real interaction');
  }
  if(name==='none'||name==='paired')assert.equal(call,false,'No call without an unpaired Lover');
  total+=lovers;packets+=Number(lovers>0);multiple+=Number(lovers>=2);called+=Number(call);if(call)calledLovers+=lovers;
 }
 results.push({floor,name,packets:20000,loverCardsPct:total/600,anyLoverPct:packets/200,multipleLoversPct:multiple/200,callPct:called/200,loversPerSuccessfulCall:called?calledLovers/called:0});
}
for(const floor of [5,25,45]){
 const single:PacketStats=results.find(r=>r.floor===floor&&r.name==='one-unpaired')!;
 const double:PacketStats=results.find(r=>r.floor===floor&&r.name==='two-unpaired')!;
 assert.equal(single.callPct,double.callPct);assert.equal(single.loverCardsPct,double.loverCardsPct);
}
console.log(JSON.stringify({scope:'240000 generated packets, not games. Identical seed streams compare one/two unpaired lovers.',results},null,2));
