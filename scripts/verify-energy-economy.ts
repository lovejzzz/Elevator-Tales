import assert from 'node:assert/strict';
import { PASSENGERS } from '../experiments/v5/game-data';
import {
  initialRun,
  makeOffers,
  resolveFloor,
  type Rider,
  type RunState,
} from '../experiments/v5/game-engine';
import { stressForecast } from '../experiments/v5/game-forecast';
import {
  ECONOMIES,
  charge,
  chargeToReserve,
  draw,
  initialEconomy,
  legBudget,
  resolveEconomy,
  savings,
  stream,
  tariff,
} from '../experiments/energy-economy';
const flat = ECONOMIES.find((e) => e.id === 'flat')!;
const literal = ECONOMIES.find((e) => e.id === 'literal')!;
const live = ECONOMIES.find((e) => e.id === 'live')!;
assert.equal(initialEconomy({ ...flat, start: 18 }).energyCap, 24);
assert.equal(initialEconomy({ ...flat, capacity: 36 }).energy, 24);
assert.equal(initialEconomy({ ...flat, capacity: 36 }).energyCap, 36);
assert.throws(() => initialEconomy({ ...flat, start: 25 }), RangeError);
assert.throws(() => initialEconomy({ ...flat, capacity: 23 }), RangeError);
assert.throws(() => initialEconomy({ ...flat, start: 0 }), RangeError);
for (const start of [16, 17, 18, 20, 24]) {
  let state = initialEconomy({ ...flat, start });
  while (state.status === 'playing') state = resolveEconomy(state, flat, 3);
  assert.equal(state.floor, start === 16 ? 9 : 10);
  if (start >= 17) assert.equal(state.energy, start - 18);
}
let strict17 = initialEconomy({ ...flat, start: 17 });
while (strict17.status === 'playing')
  strict17 = resolveEconomy(
    strict17,
    { ...flat, noNegativeCheckpoint: true },
    3,
  );
assert.equal(strict17.status, 'lost');
let strict18 = initialEconomy({ ...flat, start: 18 });
while (strict18.status === 'playing')
  strict18 = resolveEconomy(
    strict18,
    { ...flat, noNegativeCheckpoint: true },
    3,
  );
assert.equal(strict18.status, 'upgrade');
assert.equal(strict18.energy, 0);
const rider = (kind: Rider['kind'], destination = 8): Rider => ({
  id: kind,
  kind,
  destination,
  patience: 15,
  boardedAt: 1,
  fareBonus: 0,
});
const withCabin = (...riders: Rider[]): RunState => ({
  ...initialEconomy(flat),
  cabin: Array.from({ length: 6 }, (_, i) => riders[i] ?? null),
});
const arrival = resolveEconomy(withCabin(rider('courier', 2)), flat, 71);
assert.equal(arrival.energy, 22);
assert.equal(arrival.coins, PASSENGERS.courier.fare);
assert.equal(arrival.cabin.filter(Boolean).length, 0);
const mechanic = { ...withCabin(rider('mechanic')), floor: 2 };
assert.equal(resolveEconomy(mechanic, flat, 71).energy, 23);
assert.equal(
  savings({ ...mechanic, cabin: Array(6).fill(rider('mechanic')) }, flat),
  1,
);
assert.equal(
  resolveEconomy(
    {
      ...withCabin(rider('ghost'), rider('exorcist')),
      floor: 3,
      upgrades: { ...initialRun().upgrades, solar: 8 },
    },
    flat,
    2,
  ).energy,
  23,
);
const shop = {
  ...initialEconomy(flat),
  floor: 10,
  status: 'upgrade' as const,
  energy: 6,
  coins: 100,
  earned: 100,
};
const charged = charge(shop, 10, flat);
assert.equal(charged.energy, 16);
assert.equal(charged.coins, 80);
assert.equal(charged.earned, 100);
assert.equal(charge(shop, 19, flat), shop);
assert.equal(charge(shop, -1, flat), shop);
assert.equal(charge(shop, 1.1, flat), shop);
assert.equal(charge({ ...shop, coins: 1 }, 1, flat).energy, 6);
const outside = { ...shop, status: 'playing' as const };
assert.equal(charge(outside, 1, flat), outside);
assert.equal(charge(shop, 1, live), shop);
assert.equal(chargeToReserve(shop, flat).energy, 22);
assert.equal(chargeToReserve(shop, flat).coins, 68);
const withSixLess = chargeToReserve({ ...shop, energy: 0 }, flat);
assert.equal(withSixLess.energy, chargeToReserve(shop, flat).energy);
assert.equal(chargeToReserve(shop, flat).coins - withSixLess.coins, 12);
assert.equal(legBudget({ ...shop, floor: 30 }, literal), 30);
assert.equal(legBudget({ ...shop, floor: 30 }, flat), 20);
assert.equal(
  tariff(
    { ...shop, floor: 30 },
    ECONOMIES.find((e) => e.id === 'flat-tariff')!,
  ),
  3,
);
let unmodified = initialEconomy(ECONOMIES.find((e) => e.id === 'delete-only')!);
while (unmodified.status === 'playing')
  unmodified = resolveEconomy(unmodified, flat, 3);
assert.equal(unmodified.floor, 9);
let fullAt30 = { ...initialEconomy(literal), floor: 30 };
while (fullAt30.status === 'playing')
  fullAt30 = resolveEconomy(fullAt30, literal, 3);
assert.equal(fullAt30.floor, 38);
// Holding starting charge fixed while increasing capacity only changes the
// later refill ceiling, not the first leg's supply.
let capacity30 = {
  ...initialEconomy({ ...literal, capacity: 30 }),
  floor: 30,
  energy: 30,
};
while (capacity30.status === 'playing')
  capacity30 = resolveEconomy(capacity30, literal, 3);
assert.equal(capacity30.floor, 40);
assert.equal(capacity30.energy, 0);
assert.equal(capacity30.status, 'upgrade');
let capacity36 = {
  ...initialEconomy({ ...literal, capacity: 36 }),
  floor: 60,
  energy: 36,
};
while (capacity36.status === 'playing')
  capacity36 = resolveEconomy(capacity36, literal, 3);
assert.equal(capacity36.floor, 69);
assert.equal(capacity36.status, 'lost');
let flatAt30 = { ...initialEconomy(flat), floor: 30 };
while (flatAt30.status === 'playing')
  flatAt30 = resolveEconomy(flatAt30, flat, 3);
assert.equal(flatAt30.floor, 40);
assert.equal(flatAt30.energy, 4);
// With no fares, a full battery reaches the first service floor but cannot
// sustain an endless empty-cabin exploit.
let emptyRun = initialEconomy(flat);
while (emptyRun.status === 'playing')
  emptyRun = resolveEconomy(emptyRun, flat, 3);
assert.equal(emptyRun.floor, 10);
assert.equal(emptyRun.energy, 6);
assert.equal(emptyRun.coins, 0);
assert.equal(chargeToReserve(emptyRun, flat), emptyRun);
// Service-floor rescue remains available even when this leg ends below zero.
const depleted = resolveEconomy(
  { ...initialEconomy(flat), floor: 9, energy: 1, coins: 100, earned: 100 },
  flat,
  3,
);
assert.equal(depleted.status, 'upgrade');
assert.equal(depleted.energy, -1);
const rescued = charge(depleted, 23, flat);
assert.equal(rescued.energy, 22);
assert.equal(rescued.coins, 54);
assert.equal(rescued.earned, 100);
// Under minimum draw 1, additional solar stacks have no incremental effect
// in the flat-draw variant; they must not masquerade as worthwhile upgrades.
const solarOne = {
  ...initialEconomy(flat),
  floor: 3,
  upgrades: { ...initialRun().upgrades, solar: 1 },
};
assert.equal(
  savings(solarOne, flat),
  savings({ ...solarOne, upgrades: { ...solarOne.upgrades, solar: 2 } }, flat),
);
const originalSpec = JSON.stringify(PASSENGERS);
for (let n = 0; n < 1000; n++) {
  const rng = stream(77237, n, 7);
  const state = initialEconomy(flat);
  state.floor = 1 + Math.floor(rng() * 119);
  state.energy = 1 + Math.floor(rng() * 24);
  state.stress = Math.floor(rng() * 15);
  const offers = makeOffers(state.floor, state.upgrades, false, rng);
  state.cabin = Array.from({ length: 6 }, (_, i) =>
    i < 3 ? { ...offers[i], patience: Math.floor(rng() * 10) } : null,
  );
  const before = JSON.stringify(state),
    next = resolveEconomy(state, flat, n);
  const control = resolveFloor(
    { ...state, energy: 1_000_000, energyCap: 1_000_000 },
    stream(n, state.floor + 1, 2),
  );
  assert.deepEqual(next.cabin, control.cabin);
  assert.equal(next.coins, control.coins);
  assert.equal(next.stress, control.stress);
  assert.equal(JSON.stringify(state), before);
  assert.equal(
    next.energy - state.energy,
    -draw(state.floor + 1, flat) + savings(state, flat),
  );
  assert.equal(next.earned - state.earned, next.coins - state.coins);
  const forecast = stressForecast(state);
  assert.ok(
    next.lastPressure.delta >= forecast.lowDelta &&
      next.lastPressure.delta <= forecast.highDelta,
  );
}
assert.equal(JSON.stringify(PASSENGERS), originalSpec);
console.log(
  'Energy experiment verified: no passenger generation, bounded savings, paid recharge guards, capacity bottleneck, 1,000 non-energy parity/invariant states. Production rules unmodified.',
);
