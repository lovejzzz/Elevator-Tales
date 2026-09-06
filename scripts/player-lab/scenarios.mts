import assert from 'node:assert/strict';
import {D,B,R,U,E,type PassengerKind} from './game.mts';

// Process-local experiments only. No source files, dev-server state or published
// data are changed. The observer and settlement read the same modified catalog.
// Prose/visual acceptance belongs to the implemented candidate. Named overrides
// are absolute catalog values, not deltas; baseline always means this checkout.
const BASE_FARES=Object.fromEntries(Object.entries(D.PASSENGERS).map(([k,v])=>[k,v.fare])) as Record<PassengerKind,number>;
const BASE_ENERGY=Object.fromEntries(Object.entries(D.PASSENGERS).map(([k,v])=>[k,v.energy])) as Record<PassengerKind,number>;
const BASE_TRIPS=Object.fromEntries(Object.entries(D.PASSENGERS).map(([k,v])=>[k,[...v.trip]])) as Record<PassengerKind,[number,number]>;
const BASE_RELIEF=B.AGITATION_RULES.arrivalReliefCap;
const BASE_MUSIC={...B.MUSIC_RULES};
const BASE_ECONOMY={...B.ECONOMY_RULES};
const BASE_FARE_RULES={...B.FARE_RULES};
const BASE_JOURNEY={...B.JOURNEY_RULES};
const BASE_GHOST={...B.GHOST_RULES};
const BASE_MOTOR={...B.MOTOR_RULES};
const BASE_UPGRADE_PRICES={...E.UPGRADE_BASE_PRICES};
const BASE_COOP_DESCRIPTION=D.UPGRADES.battery.description;
const V835_PRICES={battery:30,capacity:35,calm:35,concierge:40,reinforced:45,express:45,tipjar:30,relay:30,crowd:40,meter:25};
const BASE_OFFER_PARTNERS=structuredClone(U.OFFER_PARTNERS);
const FARE_VARIANTS:Record<string,typeof BASE_FARE_RULES>={
 'legacy-fare':{baseOnlyMultipliers:false,coachNeighbour:3},
 'base-only-multipliers':{baseOnlyMultipliers:true,coachNeighbour:3},
 'coach-self-one':{baseOnlyMultipliers:false,coachNeighbour:1},
 'base-only-coach-one':{baseOnlyMultipliers:true,coachNeighbour:1},
 'journey-one':{baseOnlyMultipliers:true,coachNeighbour:3},
 'journey-two':{baseOnlyMultipliers:true,coachNeighbour:3},
 'ghost-provider-cap':{baseOnlyMultipliers:true,coachNeighbour:3},
};
const BASE_AVOIDS=Object.fromEntries(Object.entries(R.BONDS).map(([kind,bond])=>[kind,[...bond.avoids]])) as Record<PassengerKind,PassengerKind[]>;
const QUIET_INSPECTOR_KINDS:PassengerKind[]=['tourist','lover','musician','nurse'];
const ECONOMY_VARIANTS: Record<string,Partial<typeof BASE_ECONOMY>>={
 'concierge-middle':{conciergeTip:3,conciergeCondition:'medium'},
 'repeat-income-small':{thiefTravel:2,celebrityTravel:1},
 'commission-small':{conciergeTip:1,tipReward:3},
 'repeat-and-commission-small':{thiefTravel:2,celebrityTravel:1,conciergeTip:1,tipReward:3},
};
export const SCENARIOS={
 baseline:{},
 'v835-baseline':{},
 'v836-motor-room':{},
 'v836-investment':{},
 'v836-investment-light':{},
 'v836-local':{},
 'v836-local-investment':{},
 'v836-local-minimum':{},
 'v836-minimum-original-prices':{},
 'v836-late-motor':{},
 'cooperation-access':{},
 'v836-support-trips':{},
 'encounter-discovery':{},
 'encounter-legacy':{},
 'motor-upper':{},
 'motor-legacy':{},
 'concierge-middle':{},
 'role-frontier-legacy':{bomb:20},
 'commuter-short':{},
 'bomb-fourteen':{bomb:14},
 'commuter-short-bomb-fourteen':{bomb:14},
 'legacy-fare':{},
 'base-only-multipliers':{},
 'coach-self-one':{},
 'base-only-coach-one':{},
 'journey-one':{},
 'journey-two':{},
 'ghost-provider-cap':{},
 'music-two-step':{},
 'music-one-step':{},
 'inspector-quiet-relations':{},
 'inspector-legacy-relations':{},
 'repeat-income-small':{},
 'commission-small':{},
 'repeat-and-commission-small':{},
 'pre-income-v832':{commuter:7,tourist:10,courier:6,lover:5,coach:10},
 'earned-income-a':{commuter:6,tourist:9,courier:4,lover:4,coach:8},
 'earned-income-b':{commuter:5,tourist:8,courier:3,lover:3,coach:8},
 'earned-income-c':{commuter:5,tourist:7,courier:3,lover:3,coach:7},
 'income-b-one-relief':{commuter:5,tourist:8,courier:3,lover:3,coach:8},
 'income-b-mimic':{commuter:5,tourist:8,courier:3,lover:3,coach:8,mimic:6},
} satisfies Record<string,Partial<Record<PassengerKind,number>>>;
export let currentScenario='baseline';
export function configureScenario(name:string){
 assert(Object.hasOwn(SCENARIOS,name),'Unknown research scenario');
 for(const kind of Object.keys(BASE_OFFER_PARTNERS) as PassengerKind[])U.OFFER_PARTNERS[kind]=[...BASE_OFFER_PARTNERS[kind]];
 if(name==='encounter-discovery'){
  U.OFFER_PARTNERS.tourist=[...new Set([...BASE_OFFER_PARTNERS.tourist,'musician','mimic'] as PassengerKind[])];
  U.OFFER_PARTNERS.coach=[...new Set([...BASE_OFFER_PARTNERS.coach,'mystery'] as PassengerKind[])];
 }
 if(name==='encounter-legacy'){
  U.OFFER_PARTNERS.tourist=['commuter','celebrity','tourist'];
  U.OFFER_PARTNERS.coach=['commuter','courier'];
 }
 const fares={...BASE_FARES,...SCENARIOS[name as keyof typeof SCENARIOS]};
 for(const [kind,fare] of Object.entries(fares)){assert(Number.isSafeInteger(fare)&&fare>=0);D.PASSENGERS[kind as PassengerKind].fare=fare;}
 for(const [kind,energy] of Object.entries(BASE_ENERGY))D.PASSENGERS[kind as PassengerKind].energy=energy;
 for(const kind of Object.keys(BASE_TRIPS) as PassengerKind[])D.PASSENGERS[kind].trip=[...BASE_TRIPS[kind]];
 if(name==='commuter-short'||name==='commuter-short-bomb-fourteen')D.PASSENGERS.commuter.trip=[2,3];
 if(name==='v836-support-trips')for(const kind of ['mechanic','nurse','exorcist','inspector'] as const)D.PASSENGERS[kind].trip[1]=5;
 Object.assign(E.UPGRADE_BASE_PRICES,BASE_UPGRADE_PRICES,name.startsWith('v836-')||name==='v835-baseline'?V835_PRICES:{},name==='v836-investment'?{reinforced:30,express:30,concierge:30,tipjar:20,relay:25,crowd:25,meter:20,capacity:30}:{});
 if(name==='v836-investment-light'||name==='v836-local-investment'||name==='v836-local-minimum')Object.assign(E.UPGRADE_BASE_PRICES,{reinforced:40,express:35,concierge:35,tipjar:25,relay:25,crowd:30,meter:20,capacity:30});
 for(const kind of Object.keys(BASE_AVOIDS) as PassengerKind[])R.BONDS[kind].avoids=[...BASE_AVOIDS[kind]];
 if(name==='inspector-quiet-relations')for(const kind of QUIET_INSPECTOR_KINDS)R.BONDS[kind].avoids=R.BONDS[kind].avoids.filter(target=>target!=='inspector');
 if(name==='inspector-legacy-relations'){
  for(const kind of QUIET_INSPECTOR_KINDS)if(!R.BONDS[kind].avoids.includes('inspector'))R.BONDS[kind].avoids.push('inspector');
  for(const kind of QUIET_INSPECTOR_KINDS)R.CONFLICT_EFFECTS[[kind,'inspector'].sort().join(':')]=kind==='lover'?'agitation':'coins';
 }else{
  for(const kind of QUIET_INSPECTOR_KINDS)if(!BASE_AVOIDS[kind].includes('inspector'))delete R.CONFLICT_EFFECTS[[kind,'inspector'].sort().join(':')];
 }
 B.AGITATION_RULES.arrivalReliefCap=name==='income-b-one-relief'?1:BASE_RELIEF;
 Object.assign(B.MUSIC_RULES,BASE_MUSIC,name==='music-two-step'?{step:2}:name==='music-one-step'?{step:1}:{});
 Object.assign(B.ECONOMY_RULES,BASE_ECONOMY,ECONOMY_VARIANTS[name]??{});
 D.UPGRADES.battery.description=BASE_COOP_DESCRIPTION;
 if(name==='cooperation-access'){
  B.ECONOMY_RULES.cooperationIncrement=1;E.UPGRADE_BASE_PRICES.battery=20;
  D.UPGRADES.battery.description='每条实际默契的本人到站奖励额外 +1 金币，多位默契对象分别叠加。本局限装一次。';
 }
 Object.assign(B.FARE_RULES,BASE_FARE_RULES,FARE_VARIANTS[name]??{});
 Object.assign(B.JOURNEY_RULES,BASE_JOURNEY,name==='journey-one'?{extraFrom31:1,extraFrom51:1}:name==='journey-two'?{extraFrom31:1,extraFrom51:2}:{});
 if(name.startsWith('v836-')||name==='v835-baseline')B.JOURNEY_RULES.localFrom31=name==='v836-local'||name==='v836-local-investment'||name==='v836-local-minimum'||name==='v836-minimum-original-prices'||name==='v836-late-motor';
 if(name==='v836-local-minimum'||name==='v836-minimum-original-prices')B.JOURNEY_RULES.localExtra=0;
 if(name==='v836-local'||name==='v836-local-investment')B.JOURNEY_RULES.localExtra=1;
 if(name==='journey-one'||name==='journey-two')B.JOURNEY_RULES.localFrom31=false;
 Object.assign(B.GHOST_RULES,BASE_GHOST,name==='ghost-provider-cap'?{oneSavingPerExorcist:true}:{});
 Object.assign(B.MOTOR_RULES,BASE_MOTOR,name==='motor-upper'?{upperZone:true}:name==='motor-legacy'?{upperZone:false}:{});
 if(name==='v836-motor-room')B.MOTOR_RULES.midDiscount=1;
 if(name==='v836-late-motor')B.MOTOR_RULES.lateSteps=true;
 if(name==='income-b-mimic')D.PASSENGERS.mimic.energy=2;
 currentScenario=name;
 return scenarioRecord();
}
export function scenarioRecord(){return {name:currentScenario,baselineFares:BASE_FARES,
 upgradePrices:{...E.UPGRADE_BASE_PRICES},baselineUpgradePrices:BASE_UPGRADE_PRICES,
 encounterPartners:structuredClone(U.OFFER_PARTNERS),baselineEncounterPartners:BASE_OFFER_PARTNERS,
 trips:Object.fromEntries(Object.entries(D.PASSENGERS).map(([k,v])=>[k,[...v.trip]])),baselineTrips:BASE_TRIPS,
 music:{...B.MUSIC_RULES},baselineMusic:BASE_MUSIC,
 fareRules:{...B.FARE_RULES},baselineFareRules:BASE_FARE_RULES,
 journey:{...B.JOURNEY_RULES},baselineJourney:BASE_JOURNEY,
 ghost:{...B.GHOST_RULES},baselineGhost:BASE_GHOST,
 motor:{...B.MOTOR_RULES},baselineMotor:BASE_MOTOR,
 relationshipOverrides:currentScenario==='inspector-legacy-relations'?{restoreLegacyInspectorConflicts:QUIET_INSPECTOR_KINDS}:currentScenario==='inspector-quiet-relations'?{removeAvoidanceOfInspector:QUIET_INSPECTOR_KINDS}: {},
 economy:{...B.ECONOMY_RULES},baselineEconomy:BASE_ECONOMY,
 fareOverrides:SCENARIOS[currentScenario as keyof typeof SCENARIOS],
 energyOverrides:currentScenario==='income-b-mimic'?{mimic:2}:{},arrivalReliefCap:B.AGITATION_RULES.arrivalReliefCap,
 scope:'Explicit catalog overrides only in this isolated process. Prices and random offer rules are unchanged; motor changes only in the named motor scenario. Prose/visual acceptance belongs to the implemented candidate, not this batch.'};}
