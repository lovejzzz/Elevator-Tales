import assert from 'node:assert/strict';
import {D,B,R,U,type PassengerKind} from './game.mts';

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
 Object.assign(B.FARE_RULES,BASE_FARE_RULES,FARE_VARIANTS[name]??{});
 Object.assign(B.JOURNEY_RULES,BASE_JOURNEY,name==='journey-one'?{extraFrom31:1,extraFrom51:1}:name==='journey-two'?{extraFrom31:1,extraFrom51:2}:{});
 Object.assign(B.GHOST_RULES,BASE_GHOST,name==='ghost-provider-cap'?{oneSavingPerExorcist:true}:{});
 Object.assign(B.MOTOR_RULES,BASE_MOTOR,name==='motor-upper'?{upperZone:true}:name==='motor-legacy'?{upperZone:false}:{});
 if(name==='income-b-mimic')D.PASSENGERS.mimic.energy=2;
 currentScenario=name;
 return scenarioRecord();
}
export function scenarioRecord(){return {name:currentScenario,baselineFares:BASE_FARES,
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
