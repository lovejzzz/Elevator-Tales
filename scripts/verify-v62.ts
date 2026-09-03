import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { crowdAgitation, initialRun, resolveFloor, type Rider, type RunState } from '../lib/game-engine';
import { resolveFloor as resolveBaseline } from '../experiments/v61/lib/game-engine';
import { stressForecast, energyForecast } from '../lib/game-forecast';
import { metricChanges } from '../lib/metric-feedback';

// Guard against testing a simplified/obsolete engine while shipping another.
const root = resolve(import.meta.dirname, '..');
const baseline = readFileSync(resolve(root, 'experiments/v61/lib/game-engine.ts'), 'utf8');
assert.equal(readFileSync(resolve(root, 'lib/game-engine.ts'), 'utf8'), baseline.replace('occupied >= 4 ? 1', 'occupied >= 5 ? 1'));
assert.deepEqual(Array.from({length:7}, (_, n) => crowdAgitation(n)), [-1,-1,-1,0,0,1,2]);
assert.equal(initialRun().energy, 20);
assert.equal(initialRun().energyCap, 24);

const floors = [1,2,29,30,59,60,89,119,179,999];
const kinds = [null, 'commuter', 'musician', 'nurse'] as const;
let cases = 0, fourPersonCases = 0;
// Exhaustive seats, duplicates, parity, fatigue boundaries, simultaneous
// arrivals and impatience. These are conditional fixtures, NOT full games.
for (const floor of floors) for (const event of ['travel','arrive','impatient']) {
  for (let encoding = 0; encoding < 4 ** 6; encoding++) {
    let code = encoding;
    const cabin: Array<Rider|null> = Array.from({length:6}, (_, slot) => {
      const kind = kinds[code % 4]; code = Math.floor(code / 4);
      return kind ? {kind,id:`${slot}`,destination:floor+(event==='arrive'?1:5),patience:event==='impatient'?1:20,boardedAt:floor-1,fareBonus:0} : null;
    });
    const state: RunState = {...initialRun(),floor,stress:7,cabin};
    const next = resolveFloor(state, () => .9), old = resolveBaseline(state, () => .9);
    const occupied = cabin.filter(Boolean).length;
    const pressure = stressForecast(state), energy = energyForecast(state);
    assert.equal(next.lastPressure.delta, pressure.lowDelta);
    assert.equal(pressure.lowDelta, pressure.highDelta, 'no stochastic roles in this fixture');
    assert.equal(next.lastEnergy.delta, energy.lowDelta);
    assert.equal(next.energy, old.energy);
    assert.equal(next.coins, old.coins, 'crowding must not alter same-floor fares');
    assert.deepEqual(next.cabin, old.cabin, 'same-floor arrivals/patience must not change');
    const source = (label:string) => next.lastPressure.sources.find(s => s.label === label)?.amount ?? 0;
    assert.equal(source('音乐家安抚'), occupied >= 4 ? -cabin.filter(r=>r?.kind==='musician').length || 0 : 0);
    assert.equal(source('护士安抚'), (floor+1)%2===0 ? -cabin.filter(r=>r?.kind==='nurse').length || 0 : 0);
    assert.equal(source('轿厢拥挤'), occupied===6?2:occupied===5?1:0);
    if (occupied===4) {
      fourPersonCases++;
      // Raw -1 crowd change can be clamped by the zero-stress floor.
      assert.ok(old.stress-next.stress===0 || old.stress-next.stress===1);
    } else assert.equal(next.stress, old.stress);
    for (const change of metricChanges(state,next,'专项结算')) {
      assert.equal(change.sources.reduce((sum,s)=>sum+s.amount,0),change.delta);
    }
    cases++;
  }
}
// A musician's threshold remains four including themselves, NOT five.
// This successful combination is intentional; duplicates are not silently nerfed.
const musicians = Array.from({length:4}, (_,i):Rider => ({kind:'musician',id:`m${i}`,destination:105,patience:20,boardedAt:99,fareBonus:0}));
const four = {...initialRun(),floor:99,stress:8,cabin:[...musicians,null,null]};
assert.equal(resolveFloor(four).lastPressure.delta,-1, 'four musicians offset fatigue 3 with soothing 4');
assert.equal(resolveFloor({...four,floor:999,cabin:four.cabin.map(r=>r?{...r,destination:1005}:null)}).lastPressure.delta,29, 'fixed soothing cannot cancel arbitrarily growing fatigue');
console.log(JSON.stringify({version:'v6.2',cases,fourPersonCases,sourceIdenticalToCandidate:true,duplicateSoothingStacks:true,forecastFailures:0,receiptFailures:0}));
