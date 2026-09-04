import assert from 'node:assert/strict';
import { PASSENGERS, PASSENGER_ORDER, type PassengerKind, type UpgradeKey } from '../lib/game-data';
import {
  HIGH_RISK_BONUS,
  agitationThreshold,
  chargingPlan,
  hasNeighbour,
  initialRun,
  installUpgrade,
  leaveShop,
  makeOffers,
  neighbourCount,
  neighbours,
  resolveFloor,
  touristCompanionCount,
  totalEnergyCost,
  type Rider,
  type RunState,
} from '../lib/game-engine';
import { energyForecast, stressForecast } from '../lib/game-forecast';
import { bondStatus, riderProfile } from '../lib/rider-profile';

type Style = 'balanced' | 'synergy' | 'frugal' | 'risk';
type Variant = { id: string; target?: PassengerKind; effect: 'normal' | 'favor' | 'ban' };
type KindCounter = Record<PassengerKind, number>;

const styles: Style[] = ['balanced', 'synergy', 'frugal', 'risk'];
const baselineRuns = Math.max(1, Number(process.argv[2] || 2500));
const variantRuns = Math.max(1, Number(process.argv[3] || 400));
const horizon = 180;
const seedBase = Number(process.env.ET_SEED || 815091);
const selectedKinds = process.env.ET_KINDS
  ? PASSENGER_ORDER.filter(kind => process.env.ET_KINDS!.split(',').includes(kind))
  : PASSENGER_ORDER;
const makeCounter = (): KindCounter => Object.fromEntries(PASSENGER_ORDER.map(kind => [kind, 0])) as KindCounter;
const rngFor = (seed: number) => () => {
  let t = seed += 0x6d2b79f5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

function cabinValue(state: RunState, style: Style) {
  let income = 0;
  let recovery = 0;
  let risk = 0;
  let links = 0;
  const occupied = state.cabin.filter(Boolean).length;
  state.cabin.forEach((rider, slot) => {
    if (!rider) return;
    const spec = PASSENGERS[rider.kind];
    const profile = riderProfile(rider, state.cabin, slot);
    const trip = Math.max(1, rider.destination - state.floor);
    if (rider.kind === 'bomb') {
      const paused = hasNeighbour(state.cabin, slot, ['cop'])
        ? Math.floor((state.floor + trip) / 2) - Math.floor(state.floor / 2)
        : 0;
      if ((rider.fuse ?? 0) < trip - paused) risk += 800;
    }
    // The exact Mystery fare stays hidden, but a rational repeat player can
    // value the advertised 8–40 range at its expectation without cheating.
    // Shifter and Mimic current profiles are visible in the live UI.
    let fare = rider.kind === 'mystery' ? 24 : profile.fare;
    fare += rider.fareBonus + (rider.volatile ? HIGH_RISK_BONUS : 0);
    const adjacentCoachCount = neighbours(slot).filter(index => state.cabin[index]?.kind === 'coach').length;
    const supportCount = bondStatus(rider, state.cabin, slot).supportCount;
    if (rider.kind === 'lover') {
      const count = neighbours(slot).filter(index => state.cabin[index]?.kind === 'lover').length;
      income += count;
      fare += spec.fare * count;
    }
    if (rider.kind === 'tourist') income += touristCompanionCount(state.cabin, slot);
    if (rider.kind === 'courier') recovery += 1 / trip;
    if (rider.kind === 'thief') {
      const controlled = hasNeighbour(state.cabin, slot, ['cop', 'lawyer']);
      income += controlled ? 1 : 3;
      if (controlled) fare += 5;
    }
    if (rider.kind === 'drunk' && hasNeighbour(state.cabin, slot, ['musician', 'nurse'])) income += 1;
    if (rider.kind === 'celebrity' && neighbourCount(state.cabin, slot) === 1) income += 3;
    if (rider.kind === 'ghost') {
      if (hasNeighbour(state.cabin, slot, ['exorcist'])) { recovery += 1; fare += 6; }
      else risk += .8;
    }
    if (rider.kind === 'mechanic') recovery += 2;
    if (rider.kind === 'inspector' && totalEnergyCost(state) <= 4) income += 1;
    if (rider.kind === 'coach') fare += neighbourCount(state.cabin, slot) * 3;
    else fare *= 1 + adjacentCoachCount * .5;
    fare += supportCount * (3 + state.upgrades.battery * 2);
    const bond = bondStatus(rider, state.cabin, slot);
    links += bond.supportCount;
    risk += bond.conflictCount * 2;
    income += fare / trip;
  });
  const pressure = stressForecast(state);
  const energy = energyForecast(state);
  const averageRise = (pressure.lowDelta + pressure.highDelta) / 2;
  const nearStressDeath = state.stress + pressure.highDelta >= state.stressCap;
  const nearEnergyDeath = state.energy + energy.lowDelta <= 0;
  const pressureWeight = state.stress >= agitationThreshold(state.stressCap) - 1 ? 15 : 4;
  const energyWeight = style === 'frugal' ? 3.2 : style === 'risk' ? .9 : 1.8;
  const incomeWeight = style === 'risk' ? 3.2 : style === 'synergy' ? 2 : 1.6;
  const linkWeight = style === 'synergy' ? 4.5 : 1.2;
  return income * incomeWeight + recovery * (state.energy < 12 ? 10 : 5)
    + links * linkWeight - Math.abs(energy.highDelta) * energyWeight * (state.energy < 12 ? 3 : 1)
    - averageRise * pressureWeight - (nearStressDeath ? 600 : 0) - (nearEnergyDeath ? 600 : 0)
    - risk * (style === 'risk' ? .45 : 1) - occupied * .2;
}

function riderCap(style: Style) {
  if (style === 'frugal') return 3;
  if (style === 'risk') return 5;
  return 4;
}

function board(state: RunState, offers: Rider[], style: Style, variant: Variant) {
  let current = state;
  const waiting = [...offers];
  const boarded: Rider[] = [];
  let forcedTarget = 0;
  while (waiting.length && current.cabin.some(rider => !rider) && current.cabin.filter(Boolean).length < riderCap(style)) {
    const baseline = cabinValue(current, style);
    let best = current.cabin.some(Boolean) ? baseline + .01 : -Infinity;
    let chosen = -1;
    let next = current;
    waiting.forEach((rider, index) => {
      if (variant.effect === 'ban' && rider.kind === variant.target) return;
      current.cabin.forEach((occupant, slot) => {
        if (occupant) return;
        const candidate = { ...current, cabin: current.cabin.map((old, i) => i === slot ? rider : old) };
        let value = cabinValue(candidate, style);
        if (variant.effect === 'favor' && rider.kind === variant.target) value += 8;
        if (value > best) { best = value; chosen = index; next = candidate; }
      });
    });
    if (chosen < 0 && !current.cabin.some(Boolean)) {
      // The live game requires at least one rider. This fallback only matters
      // when a ban target fills every legal option.
      waiting.forEach((rider, index) => {
        current.cabin.forEach((occupant, slot) => {
          if (occupant) return;
          const candidate = { ...current, cabin: current.cabin.map((old, i) => i === slot ? rider : old) };
          const value = cabinValue(candidate, style);
          if (value > best) { best = value; chosen = index; next = candidate; }
        });
      });
      if (chosen >= 0 && waiting[chosen].kind === variant.target) forcedTarget += 1;
    }
    if (chosen < 0) break;
    boarded.push(waiting[chosen]);
    current = next;
    waiting.splice(chosen, 1);
  }
  return { state: current, boarded, forcedTarget };
}

function shopValue(state: RunState, key: UpgradeKey, style: Style) {
  switch (key) {
    case 'battery': return 11 + state.upgrades.battery * 4;
    case 'calm': return Math.min(6, state.stress) * 6 + 10;
    case 'solar': return state.energy > 8 ? 30 : 18;
    case 'concierge': return style === 'risk' || state.energy > 12 ? 28 : 10;
    case 'reinforced': return state.energy < 20 ? 34 : 24;
    case 'express': return state.energy > 9 ? 27 : 11;
  }
}

function quantile(values: number[], q: number) {
  return values[Math.min(values.length - 1, Math.floor(values.length * q))];
}

function simulate(style: Style, variant: Variant, runs: number, seedOffset = 0) {
  const offersSeen = makeCounter();
  const boarded = makeCounter();
  const delivered = makeCounter();
  const riderFloors = makeCounter();
  const floors: number[] = [];
  const deaths = { energy: 0, agitation: 0, fuse: 0, censored: 0 };
  let forcedTarget = 0;
  let transitions = 0;
  let forecastMisses = 0;
  const forecastExamples: Array<{floor:number; predicted:[number,number]; actual:number; energy:number; cap:number; cabin:string[]; sources:string[]}> = [];
  let totalEarned = 0;
  let totalEnergySpent = 0;
  let totalAgitationAdded = 0;
  for (let run = 0; run < runs; run += 1) {
    const rng = rngFor(seedBase + seedOffset + run * 97);
    let state = initialRun();
    let offers = makeOffers(1, state.upgrades, false, rng, state.cabin);
    while (state.status !== 'lost' && state.floor < horizon) {
      if (state.status === 'upgrade') {
        const plan = chargingPlan(state);
        const adaptiveTarget = Math.min(state.energyCap, Math.max(plan.target, totalEnergyCost(state) * 10));
        const recharge = Math.min(Math.max(0, adaptiveTarget - state.energy), state.coins);
        if (recharge > 0) state = { ...state, energy: state.energy + recharge, coins: state.coins - recharge };
        for (;;) {
          const best = state.shop.filter(card => !card.purchased && card.price <= state.coins)
            .map(card => ({ ...card, ratio: shopValue(state, card.key, style) / card.price }))
            .sort((a, b) => b.ratio - a.ratio)[0];
          if (!best || best.ratio < .25) break;
          const before = state;
          state = installUpgrade(state, best.key);
          assert.notEqual(state, before);
        }
        state = leaveShop(state);
        if (state.status === 'playing') offers = makeOffers(state.floor, state.upgrades, false, rng, state.cabin);
        continue;
      }
      for (const offer of offers) offersSeen[offer.kind] += 1;
      const choice = board(state, offers, style, variant);
      state = choice.state;
      forcedTarget += choice.forcedTarget;
      for (const rider of choice.boarded) boarded[rider.kind] += 1;
      assert.ok(state.cabin.some(Boolean), 'policy must board at least one rider');
      const beforeById = new Map(state.cabin.flatMap(rider => rider ? [[rider.id, rider] as const] : []));
      for (const rider of state.cabin) if (rider) riderFloors[rider.kind] += 1;
      const pressure = stressForecast(state);
      const energy = energyForecast(state);
      const next = resolveFloor(state, rng);
      transitions += 1;
      if (next.lastPressure.delta < pressure.lowDelta || next.lastPressure.delta > pressure.highDelta
        || next.lastEnergy.delta < energy.lowDelta || next.lastEnergy.delta > energy.highDelta) {
        forecastMisses += 1;
        if (forecastExamples.length < 3) forecastExamples.push({floor:state.floor,predicted:[energy.lowDelta,energy.highDelta],actual:next.lastEnergy.delta,energy:state.energy,cap:state.energyCap,cabin:state.cabin.flatMap(rider=>rider?[`${rider.kind}:${rider.destination}`]:[]),sources:next.lastEnergy.sources.map(line=>`${line.label}:${line.amount}`)});
      }
      totalEnergySpent += Math.max(0, -next.lastEnergy.delta);
      totalAgitationAdded += next.lastPressure.sources.filter(line => line.amount > 0).reduce((sum, line) => sum + line.amount, 0);
      const afterIds = new Set(next.cabin.flatMap(rider => rider ? [rider.id] : []));
      for (const [id, rider] of beforeById) if (!afterIds.has(id)) delivered[rider.kind] += 1;
      state = next;
      if (state.status === 'playing') offers = makeOffers(state.floor, state.upgrades, false, rng, state.cabin);
    }
    floors.push(state.floor);
    totalEarned += state.earned;
    if (state.status !== 'lost') deaths.censored += 1;
    else if (state.message.includes('引信')) deaths.fuse += 1;
    else if (state.energy <= 0) deaths.energy += 1;
    else deaths.agitation += 1;
  }
  floors.sort((a, b) => a - b);
  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    style,
    variant: variant.id,
    runs,
    meanFloor: round(floors.reduce((sum, floor) => sum + floor, 0) / runs),
    median: quantile(floors, .5),
    p10: quantile(floors, .1),
    p90: quantile(floors, .9),
    reach20: round(floors.filter(floor => floor >= 20).length / runs * 100),
    reach40: round(floors.filter(floor => floor >= 40).length / runs * 100),
    avgEarned: round(totalEarned / runs),
    energyPerFloor: round(totalEnergySpent / transitions),
    agitationAddedPerFloor: round(totalAgitationAdded / transitions),
    offersSeen,
    boarded,
    delivered,
    riderFloors,
    forcedTarget,
    deaths,
    transitions,
    forecastMisses,
    forecastExamples,
  };
}

const baselines = styles.map((style, index) => simulate(style, { id: 'normal', effect: 'normal' }, baselineRuns, index * 10_000_000));
const comparisons = selectedKinds.map((kind, index) => {
  const seedOffset = 100_000_000 + index * 1_000_000;
  const normal = simulate('balanced', { id: `normal-${kind}`, effect: 'normal' }, variantRuns, seedOffset);
  const favor = simulate('balanced', { id: `favor-${kind}`, target: kind, effect: 'favor' }, variantRuns, seedOffset);
  const ban = simulate('balanced', { id: `ban-${kind}`, target: kind, effect: 'ban' }, variantRuns, seedOffset);
  const accept = normal.offersSeen[kind] ? normal.boarded[kind] / normal.offersSeen[kind] : 0;
  const favoredAccept = favor.offersSeen[kind] ? favor.boarded[kind] / favor.offersSeen[kind] : 0;
  return {
    kind,
    name: PASSENGERS[kind].name,
    offers: normal.offersSeen[kind],
    acceptPct: Math.round(accept * 1000) / 10,
    favoredAcceptPct: Math.round(favoredAccept * 1000) / 10,
    completionPct: normal.boarded[kind] ? Math.round(normal.delivered[kind] / normal.boarded[kind] * 1000) / 10 : 0,
    meanNormal: normal.meanFloor,
    meanFavor: favor.meanFloor,
    meanBan: ban.meanFloor,
    favorDelta: Math.round((favor.meanFloor - normal.meanFloor) * 100) / 100,
    banDelta: Math.round((ban.meanFloor - normal.meanFloor) * 100) / 100,
    forcedBanBoards: ban.forcedTarget,
    forecastMisses: normal.forecastMisses + favor.forecastMisses + ban.forecastMisses,
  };
});

const totalGames = baselineRuns * styles.length + variantRuns * selectedKinds.length * 3;
const alerts = comparisons.flatMap(row => {
  const result: string[] = [];
  if (row.acceptPct < 8) result.push(`${row.kind}: dead-card risk (${row.acceptPct}% accepted)`);
  if (row.acceptPct > 85) result.push(`${row.kind}: auto-pick risk (${row.acceptPct}% accepted)`);
  if (row.favorDelta > 4) result.push(`${row.kind}: forcing it may dominate (+${row.favorDelta} floors)`);
  if (row.banDelta < -4) result.push(`${row.kind}: may be indispensable (${row.banDelta} floors when banned)`);
  if (row.favorDelta < -4) result.push(`${row.kind}: trap risk (${row.favorDelta} floors when favored)`);
  return result;
});
const totalForecastMisses=baselines.reduce((sum, row) => sum + row.forecastMisses, 0) + comparisons.reduce((sum, row) => sum + row.forecastMisses, 0);
assert.equal(totalForecastMisses, 0, 'visible forecasts must contain every simulated outcome');
console.log(JSON.stringify({
  version: 'v8.16', seedBase, horizon, baselineRuns, variantRuns, totalGames, totalForecastMisses,
  forecastExamples: baselines.flatMap(row=>row.forecastExamples).slice(0,6),
  baselines: baselines.map(row => ({
    style: row.style, meanFloor: row.meanFloor, median: row.median, p10: row.p10, p90: row.p90,
    reach20: row.reach20, reach40: row.reach40, avgEarned: row.avgEarned,
    energyPerFloor: row.energyPerFloor, agitationAddedPerFloor: row.agitationAddedPerFloor, deaths: row.deaths,
  })),
  comparisons,
  alerts,
  limits: 'Program-policy audit, not human win rate or proof of optimal play. Favor adds a moderate visible-card preference; ban refuses the target except for the mandatory-rider fallback. Same seeds are paired within each character comparison, although policy decisions can make later RNG calls diverge.',
}, null, 2));
