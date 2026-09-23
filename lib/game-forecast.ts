import { COURIER_ARRIVAL_CHARGE, settleBuffer, redAgitationProtection, musicAgitation, energyBreakdown, riderAgitation, hasNeighbour, neighbours, nextShopFloor, boxOf, operatorSaving, serviceSaving, cabinPressureLines, partnershipAgitation, arrivalReliefCapFor, hasKeepsake, legendInCabin, ROUNDS_LOG_SHOP_RELIEF, type Rider, type RunState } from './game-engine';
import { riderProfile } from './rider-profile';
import { motorCost } from './balance-v832';
import { boxedMotorCost, shopEntryCharge } from './power-box';
import { conflictLinks } from './rider-profile';
import { relayEnergyBounds, shopOpportunities, naturalChargeBoost, SHOP_TUNING, deliveryGapCharge, flywheelSaving } from './shop-effects';
import { experimentalRiskLinks, type RiskLinkTuning } from './risk-link-experiment';

export type StressForecast = {
  range: string;
  details: string;
  sources?: Array<{ label: string; amount: number; count: number }>;
  summary: string;
  tone: 'safe' | 'caution' | 'danger';
  lowDelta: number;
  highDelta: number;
};

export type EnergyForecast = {
  range: string;
  summary: string;
  danger: boolean;
  lowDelta: number;
  highDelta: number;
};

const signedDelta = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '不变';

function projectedDestinationVariants(state: RunState): Array<Array<number | null>> {
  const nextFloor = state.floor + 1;
  let variants: Array<Array<number | null>> = [state.cabin.map((rider) => rider?.destination ?? null)];
  if (nextFloor % 3 !== 0) return variants;
  state.cabin.forEach((rider, slot) => {
    if (rider?.kind !== 'ghost' || hasNeighbour(state.cabin, slot, ['exorcist', 'medium']) || hasKeepsake(state, 'bell')) return;
    const targets = neighbours(slot).filter((index) => state.cabin[index]);
    if (targets.length) variants = variants.flatMap((variant) => targets.map((target) => variant.map((destination, index) => index === target && destination !== null ? destination + 1 : destination)));
  });
  return variants;
}

export function stressForecast(state: RunState, _legacyWeight?: number, riskTuning?: RiskLinkTuning): StressForecast {
  const nextFloor = state.floor + 1;
  const effects = state.cabin.map((_, slot) => riderAgitation(state, slot));
  const beat = musicAgitation(state);
  const passengerRise = effects.reduce((sum, effect) => sum + effect.low, 0) + beat;
  const linkRise = experimentalRiskLinks(state.cabin, riskTuning).agitation;
  const cabinLines = cabinPressureLines(state);
  const cabinRise = cabinLines.reduce((sum, line) => sum + line.amount, 0);
  // Totals include cabin-wide lines; the labels below keep each source separate (v9.7 fixed a double-listed "red link").
  const redOnly = conflictLinks(state.cabin).filter(link=>link.effect==='agitation').length - redAgitationProtection(state) + linkRise;
  const crimeLinks = partnershipAgitation(state);
  const redRise = redOnly + crimeLinks + cabinRise;
  const variants = projectedDestinationVariants(state).map((destinations) => {
    const arriving = state.cabin.flatMap((rider, slot) => rider && destinations[slot] !== null && nextFloor >= destinations[slot]! ? [slot] : []);
    return { arrivals: arriving.length };
  });
  const cap = arrivalReliefCapFor(state);
  const reliefFor = (value: number, arrivals: number) => Math.min(Math.max(0, value), Math.min(arrivals, cap));
  const minArrivals = Math.min(...variants.map((variant) => variant.arrivals)); const maxArrivals = Math.max(...variants.map((variant) => variant.arrivals));
  const available = Math.max(0, state.stress + passengerRise + redRise);
  const minRelief = reliefFor(available, minArrivals); const maxRelief = reliefFor(available, maxArrivals);
  const arrivalReason = !maxRelief ? '' : minRelief === maxRelief ? `到站舒缓 −${maxRelief}` : `可能到站舒缓 −${minRelief}–${maxRelief}`;
  // 13号房客 may calm the cabin by 1; the Rounds Log relieves up to 3 on reaching a shop (also when the Matron arrives there).
  const strangerOptions = legendInCabin(state.cabin, 'stranger') ? [0, -1] : [0];
  const shopRelief = nextFloor % 10 === 0 && (hasKeepsake(state, 'roundsLog') || state.cabin.some(r => r?.kind === 'matron' && r.destination <= nextFloor));
  // 13号房客 arriving at a shop may hand over the Rounds Log at random.
  const maybeShopRelief = !shopRelief && nextFloor % 10 === 0 && state.cabin.some(r => r?.kind === 'stranger' && r.destination <= nextFloor);
  const outcomes = variants.flatMap((variant) => strangerOptions.map((calm) => {
    const before = state.stress + passengerRise + redRise + calm;
    const after = Math.max(0, before - reliefFor(before, variant.arrivals));
    const relieved = after - Math.min(ROUNDS_LOG_SHOP_RELIEF, after);
    return shopRelief ? [relieved] : maybeShopRelief ? [after, relieved] : [after];
  }).flat());
  const low = Math.min(...outcomes); const high = Math.max(...outcomes);
  const lowDelta = low - state.stress; const highDelta = high - state.stress;
  const range = lowDelta === highDelta ? signedDelta(lowDelta) : `${signedDelta(lowDelta)}～${signedDelta(highDelta)}`;
  const reasons = [
    ...effects.flatMap(effect => effect.fixed.map(line => `${line.label} ${signedDelta(line.amount)}`)),
    beat ? `音乐家节拍 ${signedDelta(beat)}` : '',
    ...cabinLines.map(line => `${line.label} ${signedDelta(line.amount)}`),
    redOnly?`红线躁动 ${signedDelta(redOnly)}`:'',
    crimeLinks?`坏人链接 +${crimeLinks}`:'',
    arrivalReason,
  ].filter(Boolean);
  const details = reasons.join(' · ');
  // Grouped sources for the rail: every rider's high-risk line counts as one "high-risk riders" source.
  const grouped = new Map<string, { label: string; amount: number; count: number }>();
  const addSource = (label: string, amount: number) => { if (!amount) return; const key = label.endsWith('急躁') ? '急躁乘客' : label; const g = grouped.get(key) ?? { label: key, amount: 0, count: 0 }; g.amount += amount; g.count += 1; grouped.set(key, g); };
  effects.forEach(effect => effect.fixed.forEach(line => addSource(line.label, line.amount)));
  if (beat) addSource('音乐家节拍', beat);
  cabinLines.forEach(line => addSource(line.label, line.amount));
  if (redOnly) addSource('红线躁动', redOnly);
  if (crimeLinks) addSource('坏人链接', crimeLinks);
  if (maxRelief) addSource('到站舒缓', -maxRelief);
  const sources = [...grouped.values()].sort((a, b) => b.amount - a.amount);
  const summary = details ? `下一层 ${range} · ${details}` : '下一层躁动不变 · 没有已知来源';
  const tone = state.stress + highDelta >= state.stressCap || highDelta >= 2 ? 'danger' : highDelta > 0 ? 'caution' : 'safe';
  return { range, details, summary, tone, lowDelta, highDelta, sources };
}

export function energyForecast(state: RunState, _legacyWeight?: number, _riskTuning?: RiskLinkTuning): EnergyForecast {
 const {motor,people,conflict,saved,total,service}=energyBreakdown(state);
 const nextFloor=state.floor+1;
 const shopCharge=nextFloor%10===0?shopEntryCharge(boxOf(state)):0;
 let relayPossible=false;
 const charges=projectedDestinationVariants(state).flatMap(destinations=>{
  const slots=state.cabin.flatMap((rider,slot)=>rider&&destinations[slot]!==null&&destinations[slot]!<=nextFloor?[slot]:[]);
  const arriving=slots.map(slot=>state.cabin[slot]!);
  const natural=arriving.filter(rider=>rider.kind==='courier').length*COURIER_ARRIVAL_CHARGE;
  const gap=deliveryGapCharge(state,slots.length).energy+flywheelSaving(state,slots.length,motor-service);
  const charge=shopCharge+natural+naturalChargeBoost(state,natural)+gap;
  const relay=shopOpportunities(state,state.cabin,slots).relay;
  relayPossible ||= relay;
  return relay ? relayEnergyBounds().map(power=>shopCharge+natural+power+naturalChargeBoost(state,natural+power)+gap) : [charge];
 });
 const deltas=charges.map(charge=>settleBuffer(state.energy-total+charge,state.energyCap,state.bufferPower??0,Boolean(state.upgrades.buffer)&&!SHOP_TUNING.bufferGap&&!SHOP_TUNING.bufferFlywheel).energy-state.energy);
 const strangerPower=legendInCabin(state.cabin,'stranger')?1:0;
 const lowDelta=Math.min(...deltas),highDelta=Math.max(...deltas)+strangerPower;
 const minCharge=Math.min(...charges),maxCharge=Math.max(...charges);
 const chargeNote=maxCharge?minCharge===maxCharge?`＋补电 ${maxCharge}`:`＋可能补电 ${minCharge}–${maxCharge}`:'';
 const range=lowDelta===highDelta?signedDelta(lowDelta):`${signedDelta(lowDelta)}～${signedDelta(highDelta)}`;
 return {range,summary:`下一站耗 ${total} 电＝运转 ${motor}＋人物 ${people}${conflict?`＋红线 ${conflict}`:''}−节能 ${saved}${chargeNote}${relayPossible ? SHOP_TUNING.relayReliable?'；满足同站条件保底回1电，50%额外回2电':'；并联回充50%，不保证续航' : ''}`,danger:state.energy+lowDelta<=0,lowDelta,highDelta};
}

/** Power at the next shop if the current riders ride out their trips and one
 * minimum rider (1 power) is carried once the cabin empties. Deterministic:
 * excludes random recharges, flywheel savings and future boarding. */
export function sectorForecast(state: RunState): { shop: number; projected: number; failFloor: number | null } {
  const shop = nextShopFloor(state.floor);
  let energy = state.energy, failFloor: number | null = null;
  for (let f = state.floor + 1; f <= shop; f++) {
    const aboard = state.cabin.map((r, slot) => (r && r.destination >= f ? { r, slot } : null)).filter(Boolean) as Array<{ r: Rider; slot: number }>;
    const riders = aboard.reduce((n, { r, slot }) => n + riderProfile(r, state.cabin, slot).energy, 0);
    const motor = boxedMotorCost(motorCost(f), boxOf(state), f) - (f === state.floor + 1 ? operatorSaving(state) + serviceSaving(state) : 0);
    energy -= Math.max(0, motor) + (aboard.length ? riders : 1);
    energy += state.cabin.filter(r => r?.kind === 'courier' && r.destination === f).length * COURIER_ARRIVAL_CHARGE;
    if (f === shop) energy = Math.min(state.energyCap, energy + shopEntryCharge(boxOf(state)));
    if (failFloor === null && (energy < 0 || (f < shop && energy <= 0))) failFloor = f;
  }
  return { shop, projected: energy, failFloor };
}
