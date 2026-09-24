/** First v8.32 candidate. Public rules, shared by engine, forecasts and UI.
 * Tune only from recorded experiments; this file is not a balance certificate. */
export const AGITATION_LOW_MAX = 2;
export const AGITATION_HIGH_MIN = 5;
export const BASE_AGITATION_CAP = 8;
// One mutable catalog for isolated process-local experiments. The shipped
// default stays explicit; forecasts and settlement call the same rule.
export const AGITATION_RULES = { arrivalReliefCap: 2 };
/** v9 agitation: crowding costs calm, a lively cabin tips, and a wild cabin has incidents. */
/** Late-night unrest from `from`: +1 agitation every third floor, then every second floor after `every` more floors,
 * then every floor, then +2 per floor (cap). A gradual clock that riders like nurses and musicians can answer. */
/** perRider (v9.18 study): when set, night unrest follows the cabin — each tier of `every` floors adds 1/perRider of a
 * point per rider (6 riders at tier 0 with perRider 6 → +1; tier 1 → +2 …), capped. 0 keeps the floor-only clock. */
/** v9.19: late-night unrest is gone (from 0 = off); late pressure now comes from the dark riders themselves. */
export const NIGHT_UNREST = { from: 0, every: 15, cap: 3, arrivalsCalm: true, perRider: 0 };
export const nightUnrest = (floor: number, occupied = 5) => {
  if (!NIGHT_UNREST.from || floor < NIGHT_UNREST.from) return 0;
  if (NIGHT_UNREST.perRider) return Math.min(NIGHT_UNREST.cap, Math.floor(occupied * (Math.floor((floor - NIGHT_UNREST.from) / NIGHT_UNREST.every) + 1) / NIGHT_UNREST.perRider));
  const d = floor - NIGHT_UNREST.from, level = Math.floor(d / NIGHT_UNREST.every);
  if (level === 0) return d % 3 === 0 ? 1 : 0;
  if (level === 1) return d % 2 === 0 ? 1 : 0;
  return Math.min(NIGHT_UNREST.cap, level - 1);
};
export const V9_AGITATION = { crowdingFrom: 6, crowding: 1, mediumTip: 1, lowTip: 1, incidentChance: 0.2, lateCrowdingFloor: 999, lateCrowdingFrom: 5, crowdSteps: [] as number[], crowdMin: 3 };
/** Late night: each floor in crowdSteps lowers the crowding threshold by one rider (never below crowdMin). */
export const crowdingThreshold = (floor: number) => Math.max(V9_AGITATION.crowdMin, (floor >= V9_AGITATION.lateCrowdingFloor ? V9_AGITATION.lateCrowdingFrom : V9_AGITATION.crowdingFrom) - V9_AGITATION.crowdSteps.filter(step => floor >= step).length);
export const MUSIC_RULES = { step: 2 };
// Defaults unchanged after R01. Isolated Lab scenarios may override these;
// never use player resources or floor to change their values mid-run.
export const ECONOMY_RULES = { thiefTravel: 0, thiefPerVictim: 2, celebrityTravel: 2, conciergeTip: 1, conciergeCondition: 'any' as 'any'|'medium', tipReward: 4, cooperationIncrement: 2 };
export const FARE_RULES = { baseOnlyMultipliers: true, coachNeighbour: 2 };
export const GHOST_RULES = { oneSavingPerExorcist: true };
export const JOURNEY_RULES = { extraFrom31: 0, extraFrom51: 0, localFrom31: true, localExtra: 0, prorateLocalFare: true };
export const journeyExtension = (floor: number) => floor >= 51 ? JOURNEY_RULES.extraFrom51 : floor >= 31 ? JOURNEY_RULES.extraFrom31 : 0;
export type AgitationBand = 'low' | 'medium' | 'high';
export const agitationBand = (value: number): AgitationBand => value <= AGITATION_LOW_MAX ? 'low' : value < AGITATION_HIGH_MIN ? 'medium' : 'high';
export const AGITATION_BAND_LABELS: Record<AgitationBand,string> = {low:'低躁动',medium:'中躁动',high:'高躁动'};
export const bandLabel = (value: number) => AGITATION_BAND_LABELS[agitationBand(value)];
export function musicBeatForAgitation(value: number) {
  const band = agitationBand(value);
  return band === 'low' ? Math.min(MUSIC_RULES.step, AGITATION_LOW_MAX + 1 - value)
    : band === 'high' ? -Math.min(MUSIC_RULES.step, value - (AGITATION_HIGH_MIN - 1)) : 0;
}
// Local playtest candidate, adopted after matched and unused-seed comparisons.
// The old schedule remains available only as an explicit research scenario.
export const MOTOR_RULES = { upperZone: true, midDiscount: 0, lateSteps: true, lateSlope: 7, lateCap: 12, lateStart: 46, surchargeFrom: 11, surcharge: 1, flat: 2, rampFrom: 51, rampEvery: 8 };
export const motorCost = (destination: number) => MOTOR_RULES.flat > 0 ? (destination <= 10 ? 1 : MOTOR_RULES.flat + (MOTOR_RULES.rampFrom && destination >= MOTOR_RULES.rampFrom ? 1 + Math.floor((destination - MOTOR_RULES.rampFrom) / MOTOR_RULES.rampEvery) : 0)) : baseMotorCost(destination) + (destination >= MOTOR_RULES.surchargeFrom ? MOTOR_RULES.surcharge : 0);
const baseMotorCost = (destination: number) => {
  if (!MOTOR_RULES.upperZone || destination < 41) return destination <= 10 ? 1 : destination <= 30 ? 2 : destination <= 60 ? 3 : 4;
  if (!MOTOR_RULES.lateSteps || destination < MOTOR_RULES.lateStart) return destination <= 50 ? 4 - MOTOR_RULES.midDiscount : destination <= 60 ? 5 - MOTOR_RULES.midDiscount : 6;
  // Deep night: +1 power every lateSlope floors from lateStart, capped.
  return Math.min(MOTOR_RULES.lateCap, 6 + Math.floor((destination - MOTOR_RULES.lateStart) / MOTOR_RULES.lateSlope));
};
export function nextMotorChange(floor:number) {
 const now=motorCost(floor+1);
 for(let n=floor+2;n<=floor+200;n++) if(motorCost(n)!==now) return {from:n,power:motorCost(n)};
 return null;
}
export const motorAdvanceNotice=(floor:number)=>{
 const change=nextMotorChange(floor);
 return change?`预告：${change.from}层起运转${change.power}电`:`运转固定${motorCost(floor+1)}电`;
};
/** Generated from motorCost so the rules text can never drift from settlement. */
export const motorScheduleText=()=>{
 // v9.18: a late ramp is stated as a rule ("51层起每8层+1电") instead of listing every step.
 if(MOTOR_RULES.flat>0&&MOTOR_RULES.rampFrom)return `运转：1–10层1电，11–${MOTOR_RULES.rampFrom-1}层${MOTOR_RULES.flat}电，${MOTOR_RULES.rampFrom}层起每${MOTOR_RULES.rampEvery}层+1电（${MOTOR_RULES.rampFrom}层${motorCost(MOTOR_RULES.rampFrom)}电）。每十层可维修，人物耗电另计。`;
 const parts:string[]=[];let start=1;
 for(let f=2;f<=400;f++){
  if(motorCost(f)!==motorCost(start)){parts.push(`${start}–${f-1}层${motorCost(start)}电`);start=f;}
 }
 parts.push(`${start}层起${motorCost(start)}电封顶`);
 return `运转：${parts.join('，')}。每十层可维修，人物耗电另计。`;
};
/** Rules text for late-night unrest, generated from NIGHT_UNREST so it cannot drift from settlement. */
export const nightUnrestText = () => {
  const { from, every, cap } = NIGHT_UNREST;
  if (!from) return '';
  const steps = Array.from({ length: cap - 1 }, (_, i) => `${from + (i + 3) * every}层起每层+${i + 2}`).join('，');
  return `${from}层起夜深人躁：每三层+1躁动，${from + every}层起每两层，${from + 2 * every}层起每层${steps ? `，${steps}` : ''}${NIGHT_UNREST.arrivalsCalm ? '；有乘客到站的那一层少1' : ''}。`;
};
export const REPAIR_WORK = 2;
export const REPAIR_DURATION = 4;
export const REPAIR_DURATION_CAP = 8;
export const REPAIR_MOTOR_SAVING = 1;
export const INSPECTION_WORK = 3;
export const INSPECTION_BONUS = 12;
export const CHILD_CARE_WORK = 2;
export const CHILD_CARE_BONUS = 6;
export const COMMUTER_QUIET_BONUS = 3;
export const TOURIST_MEDIUM_BONUS = 3;
export const RESERVE_CELL_CHARGE = 8;
export const RESERVE_CELL_PRICE = 20;
export const CAPACITY_UPGRADE = 10;

export function agitationBandRanges(cap: number) {
  return [
    {band:'low' as const,label:'低',min:0,max:AGITATION_LOW_MAX},
    {band:'medium' as const,label:'中',min:AGITATION_LOW_MAX+1,max:AGITATION_HIGH_MIN-1},
    {band:'high' as const,label:'高',min:AGITATION_HIGH_MIN,max:cap-1},
  ];
}
