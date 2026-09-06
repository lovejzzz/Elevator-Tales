/** First v8.32 candidate. Public rules, shared by engine, forecasts and UI.
 * Tune only from recorded experiments; this file is not a balance certificate. */
export const AGITATION_LOW_MAX = 2;
export const AGITATION_HIGH_MIN = 5;
export const BASE_AGITATION_CAP = 8;
// One mutable catalog for isolated process-local experiments. The shipped
// default stays explicit; forecasts and settlement call the same rule.
export const AGITATION_RULES = { arrivalReliefCap: 2 };
export const MUSIC_RULES = { step: 2 };
// Defaults unchanged after R01. Isolated Lab scenarios may override these;
// never use player resources or floor to change their values mid-run.
export const ECONOMY_RULES = { thiefTravel: 3, celebrityTravel: 2, conciergeTip: 2, conciergeCondition: 'any' as 'any'|'medium', tipReward: 4 };
export const FARE_RULES = { baseOnlyMultipliers: true, coachNeighbour: 3 };
export const GHOST_RULES = { oneSavingPerExorcist: false };
export const JOURNEY_RULES = { extraFrom31: 0, extraFrom51: 0, localFrom31: false };
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
export const MOTOR_RULES = { upperZone: true, midDiscount: 0 };
export const motorCost = (destination: number) => MOTOR_RULES.upperZone && destination >= 41
  ? destination <= 50 ? 4-MOTOR_RULES.midDiscount : destination <= 60 ? 5-MOTOR_RULES.midDiscount : 6
  : destination <= 10 ? 1 : destination <= 30 ? 2 : destination <= 60 ? 3 : 4;
export function nextMotorChange(floor:number) {
 const from=[11,31,41,51,61].find(n=>n>floor+1&&motorCost(n)!==motorCost(n-1));
 return from===undefined?null:{from,power:motorCost(from)};
}
export const motorAdvanceNotice=(floor:number)=>{
 const change=nextMotorChange(floor);
 return change?`预告：${change.from}层起运转${change.power}电`:'运转已达上限，不再增加';
};
export const motorScheduleText=()=>MOTOR_RULES.upperZone
 ? '运转：1–10层1电，11–30层2电，31–40层3电，41–50层4电，51–60层5电，61层起6电封顶。每十层可维修，人物耗电另计。'
 : '运转：1–10层1电，11–30层2电，31–60层3电，61层起4电封顶。每十层可维修，人物耗电另计。';
export const REPAIR_WORK = 2;
export const REPAIR_DURATION = 3;
export const REPAIR_DURATION_CAP = 6;
export const REPAIR_MOTOR_SAVING = 1;
export const INSPECTION_WORK = 2;
export const INSPECTION_BONUS = 8;
export const CHILD_CARE_WORK = 2;
export const CHILD_CARE_BONUS = 6;
export const COMMUTER_QUIET_BONUS = 2;
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
