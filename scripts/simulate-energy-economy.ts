import assert from 'node:assert/strict';
import { PASSENGERS, type UpgradeKey } from '../experiments/v5/game-data';
import {
  agitationThreshold,
  hasNeighbour,
  installUpgrade,
  leaveShop,
  makeOffers,
  neighbourCount,
  patienceCost,
  totalWeight,
  type Rider,
  type RunState,
} from '../experiments/v5/game-engine';
import { energyForecast, stressForecast } from '../experiments/v5/game-forecast';
import {
  ECONOMIES,
  chargeToReserve,
  draw,
  highAgitation,
  initialEconomy,
  legBudget,
  reserveBill,
  resolveEconomy,
  safePurchase,
  savings,
  stream,
  type Economy,
} from '../experiments/energy-economy';

type Policy = 'balanced' | 'charge-only' | 'upgrades-first';
const runs = Number(process.argv[2] ?? 100);
const seedBase = Number(process.env.ENERGY_SEED ?? 260902);
const filter = process.env.ENERGY_VARIANTS?.split(',');
const starts = process.env.ENERGY_STARTS?.split(',').map(Number);
const capacities = process.env.ENERGY_CAPS?.split(',').map(Number);
const noNegativeCheckpoint = process.env.ENERGY_NO_NEGATIVE_CHECKPOINT === '1';
const economies = ECONOMIES.filter(
  (e) => !filter || filter.includes(e.id),
).flatMap((e) =>
  (starts ?? [e.start]).flatMap((start) =>
    (capacities ?? [e.capacity ?? 24]).map((capacity) => ({
      ...e,
      start,
      capacity,
      noNegativeCheckpoint,
      id:
        e.id +
        (starts ? '-start' + start : '') +
        (capacities ? '-cap' + capacity : '') +
        (noNegativeCheckpoint ? '-no-negative' : ''),
    })),
  ),
);
const policies: Policy[] = (process.env.ENERGY_POLICIES?.split(
  ',',
) as Policy[]) ?? ['balanced', 'charge-only', 'upgrades-first'];
const horizon = 180;
assert.ok(Number.isSafeInteger(runs) && runs > 0);
assert.ok(economies.length > 0);
economies.forEach(initialEconomy);

function cabinValue(state: RunState, economy: Economy) {
  let income = 0;
  let recovery = 0;
  let risk = 0;
  const count = state.cabin.filter(Boolean).length;
  state.cabin.forEach((rider, slot) => {
    if (!rider) return;
    const spec = PASSENGERS[rider.kind];
    const trip = Math.max(1, rider.destination - state.floor);
    if (rider.kind === 'bomb') {
      const paused = hasNeighbour(state.cabin, slot, ['cop'])
        ? Math.floor((state.floor + trip) / 2) - Math.floor(state.floor / 2)
        : 0;
      if ((rider.fuse ?? 0) < trip - paused) risk += 500;
    }
    let fare = spec.fare + rider.fareBonus;
    if (rider.kind === 'lover' && hasNeighbour(state.cabin, slot, ['lover'])) {
      income += 1;
      fare += spec.fare;
    }
    if (rider.kind === 'thief')
      income += hasNeighbour(state.cabin, slot, ['cop', 'lawyer']) ? 1 : 3;
    if (
      rider.kind === 'drunk' &&
      hasNeighbour(state.cabin, slot, ['musician', 'nurse'])
    )
      income += 1;
    if (rider.kind === 'celebrity' && neighbourCount(state.cabin, slot) === 1)
      income += 3;
    if (rider.kind === 'ghost') {
      if (hasNeighbour(state.cabin, slot, ['exorcist'])) recovery += 1;
      else risk += 1.2;
    }
    if (rider.kind === 'mechanic') recovery += 2;
    if (rider.kind === 'inspector' && totalWeight(state.cabin) <= 8)
      recovery += 0.5;
    if (rider.patience < trip * patienceCost(state)) risk += 3;
    income += fare / trip;
    if (economy.live) recovery += spec.energy / trip;
  });
  if (!economy.live)
    recovery = Math.min(recovery, draw(state.floor + 1, economy) - 1);
  const stress = stressForecast(state);
  const pressureWeight =
    state.stress >= agitationThreshold(state.stressCap) - 2
      ? 12
      : state.stress >= 5
        ? 5
        : 2;
  const averageRise = (stress.lowDelta + stress.highDelta) / 2;
  const penalty =
    averageRise * pressureWeight +
    (state.stress + stress.highDelta >= state.stressCap
      ? pressureWeight * 30
      : 0);
  const energyDelta = economy.live
    ? energyForecast(state).highDelta
    : -draw(state.floor + 1, economy) + savings(state, economy);
  return (
    income * 1.5 +
    recovery * (state.energy < 9 ? 10 : 5) -
    penalty -
    risk -
    count * 0.15 -
    (state.energy + energyDelta <= 0 ? 100 : 0)
  );
}
function board(state: RunState, offers: Rider[], economy: Economy) {
  let current = state;
  const waiting = [...offers];
  while (waiting.length && current.cabin.some((rider) => !rider)) {
    let best = cabinValue(current, economy) + 0.01;
    let chosen = -1;
    let next = current;
    waiting.forEach((rider, index) => {
      if (
        totalWeight(current.cabin) + PASSENGERS[rider.kind].weight >
        current.weightCap
      )
        return;
      current.cabin.forEach((occupant, slot) => {
        if (occupant) return;
        const candidate = {
          ...current,
          cabin: current.cabin.map((old, i) => (i === slot ? rider : old)),
        };
        const value = cabinValue(candidate, economy);
        if (value > best) {
          best = value;
          chosen = index;
          next = candidate;
        }
      });
    });
    if (chosen < 0) break;
    current = next;
    waiting.splice(chosen, 1);
  }
  return current;
}
function value(state: RunState, key: UpgradeKey, economy: Economy) {
  if (!economy.live) {
    const ahead = legBudget({ ...state, floor: state.floor + 20 }, economy) + 2;
    switch (key) {
      case 'battery':
        return economy.risingDraw && state.energyCap < ahead
          ? Math.min(5, ahead - state.energyCap) * 6
          : 0;
      case 'reinforced':
        return (
          (state.weightCap <= 10 ? 15 : state.weightCap < 16 ? 3 : 0) +
          (economy.risingDraw && state.energyCap < ahead
            ? Math.min(3, ahead - state.energyCap) * 6
            : 0)
        );
      case 'solar':
        return !economy.risingDraw && state.upgrades.solar > 0 ? 0 : 30;
      case 'calm':
        return Math.min(6, state.stress) * 5 + 9;
      case 'concierge':
        return 27;
      case 'express':
        return 30;
    }
  }
  const energyAfterCharge = economy.live
    ? state.energy
    : Math.max(
        state.energy,
        Math.min(state.energyCap, legBudget(state, economy)),
      );
  switch (key) {
    case 'battery':
      return (
        Math.min(8, state.energyCap + 5 - state.energy) *
          (state.energy < 12 ? 6 : 2) +
        5 +
        (!economy.live && state.energyCap < legBudget(state, economy) ? 70 : 0)
      );
    case 'calm':
      return Math.min(6, state.stress) * 5 + 9;
    case 'solar':
      return energyAfterCharge > 7 ? 30 : 14;
    case 'concierge':
      return energyAfterCharge > 8 ? 27 : 9;
    case 'reinforced':
      return (
        Math.min(3, state.energyCap + 3 - state.energy) * 4 +
        (state.weightCap <= 10 ? 15 : 2) +
        (!economy.live && state.energyCap < legBudget(state, economy) ? 45 : 0)
      );
    case 'express':
      return energyAfterCharge > 8 ? 30 : 8;
  }
}
const round = (n: number) => Math.round(n * 100) / 100;
const results = [];
for (const economy of economies)
  for (const policy of policies) {
    if (economy.live && policy === 'upgrades-first') continue; // Identical to baseline balanced, no recharge service.
    const floors: number[] = [];
    const earned: number[] = [];
    const firstCash: number[] = [];
    const firstPower: number[] = [];
    const firstAfterReserve: number[] = [];
    const deaths: Record<string, number> = {
      energy: 0,
      agitation: 0,
      both: 0,
      fuse: 0,
      censored: 0,
    };
    const deathFloors: Record<string, number> = {};
    const upgradeMix: Record<string, number> = {};
    let shopVisits = 0;
    let noUpgrade = 0;
    let upgradeCount = 0;
    let chargeSpent = 0;
    let upgradeSpent = 0;
    let budgetCrowding = 0;
    let reserveShortfalls = 0;
    let capacityShortfalls = 0;
    let rechargeVisits = 0;
    let stations = 0;
    let highStations = 0;
    let emptyStations = 0;
    let occupiedTotal = 0;
    let forecastMisses = 0;
    let guidedFirst = 0;
    let randomFirst = 0;
    let firstUpgrades = 0;
    let energyDeathsWithCash = 0;
    for (let run = 0; run < runs; run++) {
      const seed = seedBase + run * 97;
      let state = initialEconomy(economy);
      const guided = run % 2 === 0; // First play and replay openings both represented.
      let offers = makeOffers(1, state.upgrades, guided, stream(seed, 1, 1));
      while (state.status !== 'lost' && state.floor < horizon) {
        if (state.status === 'upgrade') {
          shopVisits++;
          if (state.floor === 10) {
            firstCash.push(state.coins);
            firstPower.push(state.energy);
            firstAfterReserve.push(state.coins - reserveBill(state, economy));
            if (guided) guidedFirst++;
            else randomFirst++;
          }
          if (
            !economy.live &&
            state.shop.some(
              (card) =>
                card.price <= state.coins &&
                !safePurchase(state, card.key, economy),
            )
          )
            budgetCrowding++;
          let bought = 0;
          if (policy !== 'charge-only')
            for (;;) {
              const options: Array<{
                key: UpgradeKey;
                price: number;
                purchased: boolean;
                score: number;
              }> = state.shop
                .filter(
                  (card) =>
                    !card.purchased &&
                    card.price <= state.coins &&
                    (policy === 'upgrades-first' ||
                      safePurchase(state, card.key, economy)),
                )
                .map((card) => {
                  // Compare the upgrade with buying the same necessary electricity directly.
                  const effectiveCost =
                    card.price +
                    reserveBill(installUpgrade(state, card.key), economy) -
                    reserveBill(state, economy);
                  return {
                    ...card,
                    score:
                      effectiveCost <= 0
                        ? 100
                        : value(state, card.key, economy) / effectiveCost,
                  };
                })
                .sort((a, b) => b.score - a.score);
              const best = options[0];
              if (!best || best.score < 0.23) break;
              const before = state;
              state = installUpgrade(state, best.key);
              assert.notEqual(state, before);
              assert.equal(state.coins, before.coins - best.price);
              assert.equal(state.earned, before.earned);
              bought++;
              upgradeCount++;
              upgradeSpent += best.price;
              upgradeMix[best.key] = (upgradeMix[best.key] ?? 0) + 1;
            }
          if (!bought) noUpgrade++;
          if (bought && state.floor === 10) firstUpgrades++;
          if (!economy.live) {
            if (state.energyCap < legBudget(state, economy))
              capacityShortfalls++;
            const before = state;
            state = chargeToReserve(state, economy);
            if (state !== before) {
              rechargeVisits++;
              chargeSpent += before.coins - state.coins;
            }
            assert.equal(state.earned, before.earned);
            if (
              state.energy <
              Math.min(state.energyCap, legBudget(state, economy))
            )
              reserveShortfalls++;
          }
          state = leaveShop(state);
          if (state.status === 'playing')
            offers = makeOffers(
              state.floor,
              state.upgrades,
              false,
              stream(seed, state.floor, 1),
              state.cabin,
            );
          continue;
        }
        state = board(state, offers, economy);
        const pressure = stressForecast(state);
        const occupied = state.cabin.filter(Boolean).length;
        stations++;
        occupiedTotal += occupied;
        if (!occupied) emptyStations++;
        if (highAgitation(state)) highStations++;
        const before = state;
        state = resolveEconomy(state, economy, seed);
        if (
          state.lastPressure.delta < pressure.lowDelta ||
          state.lastPressure.delta > pressure.highDelta
        )
          forecastMisses++;
        assert.ok(state.coins >= 0 && state.earned >= state.coins);
        if (!economy.live)
          assert.ok(
            state.energy < before.energy,
            'Travel must not generate power',
          );
        if (state.status === 'playing')
          offers = makeOffers(
            state.floor,
            state.upgrades,
            false,
            stream(seed, state.floor, 1),
            state.cabin,
          );
      }
      floors.push(state.floor);
      earned.push(state.earned);
      if (state.status !== 'lost') deaths.censored++;
      else {
        const reason = state.message.includes('引信')
          ? 'fuse'
          : state.energy <= 0 && state.stress >= state.stressCap
            ? 'both'
            : state.energy <= 0
              ? 'energy'
              : 'agitation';
        deaths[reason]++;
        if ((reason === 'energy' || reason === 'both') && state.coins >= 20)
          energyDeathsWithCash++;
        deathFloors[state.floor] = (deathFloors[state.floor] ?? 0) + 1;
      }
    }
    floors.sort((a, b) => a - b);
    const mean = (values: number[]) =>
      round(values.reduce((a, b) => a + b, 0) / Math.max(1, values.length));
    const result = {
      economy: economy.id,
      initialEnergy: economy.start,
      initialCapacity: economy.capacity ?? 24,
      noNegativeCheckpoint: Boolean(economy.noNegativeCheckpoint),
      policy,
      runs,
      meanFloor: mean(floors),
      median: floors[Math.floor(runs * 0.5)],
      p10: floors[Math.floor(runs * 0.1)],
      p90: floors[Math.floor(runs * 0.9)],
      max: floors.at(-1),
      reach10: round((firstCash.length / runs) * 100),
      reach20: round((floors.filter((f) => f >= 20).length / runs) * 100),
      reach30: round((floors.filter((f) => f >= 30).length / runs) * 100),
      reach60: round((floors.filter((f) => f >= 60).length / runs) * 100),
      firstShop: {
        guidedReach: round((guidedFirst / Math.ceil(runs / 2)) * 100),
        randomReach: round((randomFirst / Math.floor(runs / 2)) * 100),
        meanCash: mean(firstCash),
        meanPower: mean(firstPower),
        negativePowerPct: round(
          (firstPower.filter((power) => power < 0).length /
            Math.max(1, firstPower.length)) *
            100,
        ),
        meanAfterReserve: mean(firstAfterReserve),
        upgradePct: round(
          (firstUpgrades / Math.max(1, firstCash.length)) * 100,
        ),
      },
      meanPurchases: round(upgradeCount / runs),
      meanEarned: mean(earned),
      meanChargeSpent: round(chargeSpent / runs),
      meanUpgradeSpent: round(upgradeSpent / runs),
      shopVisits,
      noUpgradePct: round((noUpgrade / Math.max(1, shopVisits)) * 100),
      rechargeVisits,
      budgetCrowdingPct: round(
        (budgetCrowding / Math.max(1, shopVisits)) * 100,
      ),
      reserveShortfalls,
      capacityShortfalls,
      stations,
      highAgitationPct: round((highStations / stations) * 100),
      emptyPct: round((emptyStations / stations) * 100),
      meanOccupancy: round(occupiedTotal / stations),
      deaths,
      upgradeMix,
      commonDeathFloors: Object.entries(deathFloors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
      forecastMisses,
      energyDeathsWithCash,
    };
    results.push(result);
    console.error(
      `${economy.id}/${policy}: ${result.meanFloor} floors, ${result.meanPurchases} upgrades, ${result.deaths.energy} energy deaths`,
    );
  }
console.log(
  JSON.stringify(
    {
      seedBase,
      horizon,
      runsPerCell: runs,
      totalRuns: results.length * runs,
      results,
    },
    null,
    2,
  ),
);
