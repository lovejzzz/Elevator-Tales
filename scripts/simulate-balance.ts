import assert from 'node:assert/strict';
import { PASSENGERS, type UpgradeKey } from '../lib/game-data';
import { HIGH_RISK_BONUS, agitationThreshold, chargingPlan, hasNeighbour, initialRun, installUpgrade, leaveShop, makeOffers, neighbourCount, resolveFloor, totalEnergyCost, type Rider, type RunState } from '../lib/game-engine';
import { energyForecast, stressForecast } from '../lib/game-forecast';

type Policy = 'balanced' | 'ignore-agitation' | 'hoard' | 'greedy';
const policies: Policy[] = ['balanced', 'ignore-agitation', 'hoard', 'greedy'];
const runs = Math.max(1, Number(process.argv[2] || 2500));
const horizon = 300; // Test censoring only, never a game endpoint.
const seedBase = Number(process.env.ET_SEED || 91007);
const priceScale = Number(process.env.ET_PRICE_SCALE || 1);
const initialEnergy = Number(process.env.ET_INITIAL_ENERGY || 48);
const energyCap = Number(process.env.ET_ENERGY_CAP || 60);
const chargePrice = Number(process.env.ET_CHARGE_PRICE || 1);
const agitationCap = Number(process.env.ET_AGITATION_CAP || 6);
const highRiskStart = Number(process.env.ET_HIGH_RISK_START || 15);
const pressureStep = Number(process.env.ET_PRESSURE_STEP || 20);
const volatileSpan = Number(process.env.ET_VOLATILE_SPAN || 35);
const offerTuning={highRiskStart,pressureStep,volatileSpan};
const rngFor = (seed: number) => () => { let t = seed += 0x6d2b79f5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const ignoresAgitation = (policy: Policy) => policy === 'ignore-agitation' || policy === 'greedy';

function cabinValue(state: RunState, policy: Policy) {
  let income = 0; let recovery = 0; let risk = 0;
  const count = state.cabin.filter(Boolean).length;
  state.cabin.forEach((rider, slot) => {
    if (!rider) return;
    const spec = PASSENGERS[rider.kind]; const trip = Math.max(1, rider.destination - state.floor);
    if (rider.kind === 'bomb') {
      const paused = hasNeighbour(state.cabin, slot, ['cop']) ? Math.floor((state.floor + trip) / 2) - Math.floor(state.floor / 2) : 0;
      if ((rider.fuse ?? 0) < trip - paused) risk += 500;
    }
    let fare = spec.fare + rider.fareBonus + (rider.volatile ? HIGH_RISK_BONUS : 0);
    if (rider.kind === 'lover' && hasNeighbour(state.cabin, slot, ['lover'])) { income += 1; fare += spec.fare; }
    if (rider.kind === 'thief') income += hasNeighbour(state.cabin, slot, ['cop', 'lawyer']) ? 1 : 3;
    if (rider.kind === 'drunk' && hasNeighbour(state.cabin, slot, ['musician', 'nurse'])) income += 1;
    if (rider.kind === 'celebrity' && neighbourCount(state.cabin, slot) === 1) income += 3;
    if (rider.kind === 'ghost') {
      if (hasNeighbour(state.cabin, slot, ['exorcist'])) recovery += 1;
      else risk += 1.2;
    }
    if (rider.kind === 'mechanic') recovery += 2;
    if (rider.kind === 'inspector' && totalEnergyCost(state) <= 4) recovery += .5;
    income += fare / trip;
  });
  const stress = stressForecast(state); const energy = energyForecast(state);
  const pressureWeight = ignoresAgitation(policy) ? 0 : state.stress >= agitationThreshold(state.stressCap) - 2 ? 12 : state.stress >= 5 ? 5 : 2;
  const averageRise = (stress.lowDelta + stress.highDelta) / 2;
  const pressurePenalty = averageRise * pressureWeight + (state.stress + stress.highDelta >= state.stressCap ? pressureWeight * 30 : 0);
  const energyPenalty = Math.abs(energy.highDelta) * (policy === 'greedy' ? .35 : policy === 'hoard' ? 2.5 : 1.4) * (state.energy < 12 ? 3 : 1);
  return income * (policy === 'greedy' ? 3 : 1.5) + recovery * (state.energy < 9 ? 10 : 5) - energyPenalty - pressurePenalty - risk - count * .15 - (state.energy + energy.highDelta <= 0 ? 100 : 0);
}

function board(state: RunState, offers: Rider[], policy: Policy) {
  let current = state; const waiting = [...offers];
  const riderCap = policy === 'hoard' ? 2 : policy === 'balanced' ? 4 : 6;
  while (waiting.length && current.cabin.some((rider) => !rider) && current.cabin.filter(Boolean).length < riderCap) {
    const baseline = cabinValue(current, policy);
    let best = current.cabin.some(Boolean) ? baseline + .01 : -Infinity; let chosen = -1; let next = current;
    waiting.forEach((rider, index) => {
      current.cabin.forEach((occupant, slot) => {
        if (occupant) return;
        const candidate = { ...current, cabin: current.cabin.map((old, i) => i === slot ? rider : old) };
        const value = cabinValue(candidate, policy);
        if (value > best) { best = value; chosen = index; next = candidate; }
      });
    });
    if (chosen < 0) break;
    current = next; waiting.splice(chosen, 1);
  }
  return current;
}

function shopValue(state: RunState, key: UpgradeKey, policy: Policy) {
  if (policy === 'hoard') return -1;
  switch (key) {
    case 'battery': return 12 + state.upgrades.battery * 4;
    case 'calm': return ignoresAgitation(policy) ? -1 : Math.min(6, state.stress) * 5 + 9;
    case 'solar': return state.energy > 7 ? 30 : 14;
    case 'concierge': return state.energy > 8 ? 27 : 9;
    case 'reinforced': return Math.min(3, state.energyCap + 3 - state.energy) * 4 + (state.weightCap <= 10 ? 15 : 2);
    case 'express': return state.energy > 8 ? 30 : 8;
  }
}

const results = policies.map((policy) => {
  const floors: number[] = []; const deaths: Record<string, number> = { energy: 0, agitation: 0, both: 0, fuse: 0, censored: 0 };
  let purchases = 0; let skippedShops = 0; let visitedShops = 0; let totalEarned = 0; let totalSpent = 0; let highAgitationStations = 0; let stations = 0; let forecastMisses = 0; let brokeShops = 0; let budgetChoices = 0;
  const upgradeMix: Record<string, number> = {};
  for (let n = 0; n < runs; n += 1) {
    const rng = rngFor(seedBase + n * 97); let state = {...initialRun(),energy:initialEnergy,energyCap,stressCap:agitationCap};
    let offers = makeOffers(1, state.upgrades, true, rng, [], undefined, offerTuning);
    while (state.status !== 'lost' && state.floor < horizon) {
      if (state.status === 'upgrade') {
        if (priceScale !== 1) state = { ...state, shop: state.shop.map((card) => ({ ...card, price: Math.round(card.price * priceScale) })) };
        visitedShops += 1; let bought = 0;
        if (state.shop.reduce((sum, card) => sum + card.price, 0) > state.coins) budgetChoices += 1;
        if (state.shop.every((card) => card.price > state.coins)) brokeShops += 1;
        // A real player is explicitly told to reserve charging money before buying cards.
        // Model that core shop decision; the previous harness skipped charging entirely
        // and therefore measured a deliberately impossible strategy.
        const plan = chargingPlan(state);
        const rechargeUnits = Math.min(plan.units, Math.floor(state.coins/chargePrice));
        if (rechargeUnits > 0) state = {...state,energy:state.energy+rechargeUnits,coins:state.coins-rechargeUnits*chargePrice};
        for (;;) {
          const candidates = state.shop.filter((card) => !card.purchased && card.price <= state.coins)
            .map((card) => ({ ...card, value: shopValue(state, card.key, policy) / card.price })).sort((a, b) => b.value - a.value);
          const best = candidates[0];
          if (!best || best.value < .23) break;
          const before = state; state = installUpgrade(state, best.key);
          assert.notEqual(state, before); assert.equal(state.coins, before.coins - best.price);
          assert.equal(state.earned, before.earned);
          purchases += 1; bought += 1; upgradeMix[best.key] = (upgradeMix[best.key] ?? 0) + 1;
        }
        if (!bought) skippedShops += 1;
        state = leaveShop(state);
        if (state.status === 'playing') offers = makeOffers(state.floor, state.upgrades, false, rng, state.cabin, undefined, offerTuning);
        continue;
      }
      state = board(state, offers, policy);
      const pressure = stressForecast(state); const energy = energyForecast(state);
      if (state.stress >= agitationThreshold(state.stressCap)) highAgitationStations += 1;
      stations += 1;
      assert.ok(state.cabin.some(Boolean),'policy must board at least one rider');
      const next = resolveFloor(state, rng);
      if (next.lastPressure.delta < pressure.lowDelta || next.lastPressure.delta > pressure.highDelta || next.lastEnergy.delta < energy.lowDelta || next.lastEnergy.delta > energy.highDelta) forecastMisses += 1;
      assert.ok(next.coins >= 0 && next.earned >= next.coins);
      state = next;
      if (state.status === 'playing') offers = makeOffers(state.floor, state.upgrades, false, rng, state.cabin, undefined, offerTuning);
    }
    floors.push(state.floor); totalEarned += state.earned; totalSpent += state.earned - state.coins;
    if (state.status !== 'lost') deaths.censored += 1;
    else if (state.message.includes('引信')) deaths.fuse += 1;
    else if (state.energy <= 0 && state.stress >= state.stressCap) deaths.both += 1;
    else if (state.energy <= 0) deaths.energy += 1;
    else deaths.agitation += 1;
  }
  floors.sort((a, b) => a - b);
  const round = (n: number) => Math.round(n * 100) / 100;
  return { policy, runs, horizon, averageFloor: round(floors.reduce((a, b) => a + b, 0) / runs),
    p10: floors[Math.floor(runs * .1)], median: floors[Math.floor(runs * .5)], p90: floors[Math.floor(runs * .9)], maximum: floors.at(-1),
    reach10: round(floors.filter((f) => f >= 10).length / runs * 100), reach20: round(floors.filter((f) => f >= 20).length / runs * 100), reach30: round(floors.filter((f) => f >= 30).length / runs * 100), reach40: round(floors.filter((f) => f >= 40).length / runs * 100), reach60: round(floors.filter((f) => f >= 60).length / runs * 100),
    highAgitationRate: round(highAgitationStations / stations * 100), averagePurchases: round(purchases / runs), averageEarned: round(totalEarned / runs), averageSpent: round(totalSpent / runs),
    shops: { visited: visitedShops, skipped: skippedShops, unaffordable: brokeShops, cannotBuyAll: budgetChoices }, upgradeMix, deaths, forecastMisses, stations };
});
console.log(JSON.stringify({ seedBase, priceScale, initialEnergy, energyCap, chargePrice, agitationCap, highRiskStart, pressureStep, volatileSpan, totalRuns: runs * policies.length, results }, null, 2));
