import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {E,D,U,type PassengerKind} from './game.mts';
import {manifest,rngFor,quantile,writeNew} from './util.mts';

// Offer-access audit, not gameplay: retain actual random packets and legal
// journeys, but do not infer boarding, viable placements or player resources.
const source=manifest();
const variant=process.argv[3]??'baseline';
assert(['baseline','discovery','legacy'].includes(variant));
const savedTourist=[...U.OFFER_PARTNERS.tourist],savedCoach=[...U.OFFER_PARTNERS.coach];
if(variant==='discovery'){
 U.OFFER_PARTNERS.tourist=[...new Set([...savedTourist,'musician','mimic'] as PassengerKind[])];
 U.OFFER_PARTNERS.coach=[...new Set([...savedCoach,'mystery'] as PassengerKind[])];
}
if(variant==='legacy'){
 U.OFFER_PARTNERS.tourist=['commuter','celebrity','tourist'];
 U.OFFER_PARTNERS.coach=['commuter','courier'];
}
const effectivePartners=structuredClone(U.OFFER_PARTNERS);
const runs=400, lastFloor=60;
const unlock=new Map<PassengerKind,number>();
for(const tier of D.UNLOCK_TIERS)for(const kind of tier.kinds)unlock.set(kind,tier.floor);
type Encounter={seed:number;floor:number;kind:PassengerKind;trip:number;volatile:boolean;packet:PassengerKind[]};
const firsts:Array<{seed:number;kind:PassengerKind;first:number|null}>=[];
const mechanics:Encounter[]=[];
let packets=0;
for(let sample=0;sample<runs;sample++){
 const seed=83297103+sample*137,rng=rngFor(seed),seen=new Map<PassengerKind,number>();
 for(let floor=1;floor<=lastFloor;floor++){
  // Only F1 uses the first-time tutorial packet. No cabin means no lover call.
  const offers=E.makeOffers(floor,E.EMPTY_UPGRADES,floor===1,rng,[]);
  assert.equal(offers.length,3);packets++;
  for(const r of offers){
   assert(floor>=unlock.get(r.kind)!);
   assert(r.destination-floor>=D.PASSENGERS[r.kind].trip[0]);
   assert(r.destination-floor<=D.PASSENGERS[r.kind].trip[1]);
   if(!seen.has(r.kind))seen.set(r.kind,floor);
   if(r.kind==='mechanic')mechanics.push({seed,floor,kind:r.kind,trip:r.destination-floor,volatile:Boolean(r.volatile),packet:offers.map(o=>o.kind)});
  }
 }
 for(const kind of D.PASSENGER_ORDER)firsts.push({seed,kind,first:seen.get(kind)??null});
}
const introduction=D.PASSENGER_ORDER.map(kind=>{
 const rs=firsts.filter(r=>r.kind===kind),at=unlock.get(kind)!;
 const delays=rs.flatMap(r=>r.first===null?[]:[r.first-at]);
 return {kind,unlock:at,sequences:rs.length,unseenFirstFive:rs.filter(r=>r.first===null||r.first>=at+5).length,
  unseenFirstTen:rs.filter(r=>r.first===null||r.first>=at+10).length,
  unseenBy60:rs.filter(r=>r.first===null).length,observedDelayQuantiles:[.1,.5,.9].map(q=>({q,delay:quantile(delays,q)}))};
});
const mechanicBySector=Array.from({length:6},(_,i)=>{
 const rs=mechanics.filter(r=>r.floor>=i*10+1&&r.floor<=(i+1)*10);
 const high=rs.filter(r=>r.volatile);
 return {from:i*10+1,to:(i+1)*10,offers:rs.length,highRisk:high.length,
  highRiskWithNurse:high.filter(r=>r.packet.includes('nurse')).length,
  highRiskWithDrunk:high.filter(r=>r.packet.includes('drunk')).length,
  highRiskWithEither:high.filter(r=>r.packet.includes('nurse')||r.packet.includes('drunk')).length};
});
U.OFFER_PARTNERS.tourist=savedTourist;U.OFFER_PARTNERS.coach=savedCoach;
assert.deepEqual(manifest(),source);
const summary={variant,effectivePartners,sequences:runs,packets,introduction,mechanicBySector};
writeNew(resolve(process.argv[2]),{source,summary,firsts,mechanics,limits:[
 '400 empty-cabin 1–60 offer sequences, 24000 packets; not games, boarding opportunities or survival estimates.',
 'No player-state-based adjustment, upgrades, calls, income or safety simulation. Starting F1 tutorial is shared.',
 'Seen within ten includes unlock floor through unlock+9. Delay quantiles exclude unseen-by-60 rows; censor count reported.',
 'Co-packaged Nurse/Drunk is exposure only, not guaranteed legal/profitable adjacency or matching arrival timing.',
 'One role can occur multiple times in one packet; mechanic counts are cards, not distinct floors or independent samples.',
 'Game source defaults unchanged. Discovery is a process-local alternative adding Musician/Mimic to Tourist packets and Mystery to Coach packets, restored before source verification.',
 'Same seeds across variants, but kinds change random consumption; not identical subsequent packets or paired player trajectories. Baseline reruns reuse evidence, not additional independent samples.',
 'These are generated sequences, not R03 replay or hidden-state reconstruction.'
 ]});
console.log(JSON.stringify(summary,null,2));
