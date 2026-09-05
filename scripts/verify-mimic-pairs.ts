import assert from 'node:assert/strict';
import { initialRun, type Rider, type RunState } from '../lib/game-engine';
import { energyForecast, stressForecast } from '../lib/game-forecast';
import { copyConnection, planPlacement } from '../lib/game-interaction';
import { riderProfile } from '../lib/rider-profile';

const rider = (kind: Rider['kind'], id: string, copySeed?: number): Rider => ({
  kind, id, copySeed, destination: 20, boardedAt: 1, patience: 0, fareBonus: 0,
});
const mimic = rider('mimic', 'mimic-instance-1', 713);
const source = rider('mechanic', 'mechanic-instance-1');
const pairCabin = (column: number, copy = mimic, above = source): RunState['cabin'] => {
  const cabin: RunState['cabin'] = Array(6).fill(null);
  cabin[column] = above;
  cabin[column + 3] = copy;
  return cabin;
};
const baseline = riderProfile(mimic, pairCabin(0), 3);
assert.equal(baseline.copies.length, 1);
assert.equal(baseline.copies[0].sourceId, source.id);
assert.deepEqual(copyConnection(pairCabin(0),0,3),{copySlot:3,sourceSlot:0,field:baseline.copies[0].field});
assert.equal(copyConnection(pairCabin(0),0,1),null);

// Fresh passengers may legally be repositioned repeatedly. Exercise the same
// placement path used by drag, tap and preview, not a separate simulator rule.
let state = { ...initialRun(), cabin: pairCabin(0) };
let legalMoves = 0;
for (let cycle = 0; cycle < 1000; cycle++) {
  const column = cycle % 3;
  const nextColumn = (column + 1) % 3;
  const sourceMove = planPlacement(state, source, nextColumn);
  assert(sourceMove.ok && sourceMove.changed);
  state = sourceMove.next;
  legalMoves++;
  assert.equal(riderProfile(mimic, state.cabin).copies.length, 0,
    'moving the source away deactivates the copy');

  const copyMove = planPlacement(state, mimic, nextColumn + 3);
  assert(copyMove.ok && copyMove.changed);
  state = copyMove.next;
  legalMoves++;
  assert.deepEqual(riderProfile(mimic, state.cabin), baseline,
    'the same pair retains its result after moving to another column');

  // Other occupants, floor, agitation and object reconstruction cannot reroll.
  const restored: RunState = JSON.parse(JSON.stringify(state));
  restored.floor = cycle + 1;
  restored.stress = cycle % 8;
  restored.cabin[(nextColumn + 1) % 3] = rider('tourist', `other-${cycle}`);
  restored.cabin[(nextColumn + 2) % 3 + 3] = rider('nurse', `care-${cycle}`);
  assert.deepEqual(riderProfile(restored.cabin[nextColumn + 3]!, restored.cabin), baseline);
}

// Moving the same source away and then back must not reset its association.
for (let column = 0; column < 3; column++) {
  let trial = { ...initialRun(), cabin: pairCabin(column) };
  const away = planPlacement(trial, source, (column + 1) % 3);
  assert(away.ok);
  trial = away.next;
  const back = planPlacement(trial, source, column);
  assert(back.ok);
  assert.deepEqual(riderProfile(mimic, back.next.cabin), baseline);
}

// The top row cannot copy sideways or downward, even when every neighbor is full.
for (let slot = 0; slot < 3; slot++) {
  const cabin = Array.from({ length: 6 }, (_, i) => rider('mechanic', `full-${i}`));
  cabin[slot] = mimic;
  assert.equal(riderProfile(mimic, cabin, slot).copies.length, 0);
}

// A new instance is a new draw, not a promise of a different outcome. Check
// both outcomes are reachable, including among passengers of the same kind.
const fields = new Set<string>();
for (let i = 0; i < 128; i++) {
  const newSource = rider('mechanic', `new-instance-${i}`);
  const cabin = pairCabin(1, mimic, newSource);
  const copied = riderProfile(mimic, cabin);
  fields.add(copied.copies[0].field);
  assert.equal(copied.copies[0].sourceId, newSource.id);
  assert.deepEqual(riderProfile(mimic, JSON.parse(JSON.stringify(cabin))), copied);
  assert.deepEqual(riderProfile(mimic, pairCabin(1)), baseline,
    'trying a new passenger cannot erase the original pair result');
}
assert.deepEqual([...fields].sort(), ['energy', 'fare']);

// A marginal 50/50 split is insufficient: using raw FNV parity made EVERY
// Mimic's source vector either identical to or the inverse of every other one.
// Fixed identity fixtures catch that structural coupling without rerolling.
const matrix = Array.from({length:64},(_,i)=>{
  const copy=rider('mimic',`copy-${i}`,713+i*97);
  return Array.from({length:128},(_,j)=>{
    const above=rider('tourist',`source-${j}`);
    return riderProfile(copy,pairCabin(0,copy,above)).copies[0].field==='energy'?1:0;
  });
});
const patterns=new Set(matrix.map(row=>row.join('')));
assert(patterns.size>=32,'Fixed pairs collapse into a tiny number of shared draw patterns');
const pairAgreements=matrix.flatMap((row,i)=>matrix.slice(i+1).map(other=>row.filter((bit,j)=>bit===other[j]).length/row.length));
assert(pairAgreements.every(rate=>rate>.125&&rate<.875),'Different Mimics must not be perfectly coupled or inverted');
const energyFraction=matrix.flat().reduce<number>((sum,value)=>sum+value,0)/(64*128);
assert(energyFraction>.4&&energyFraction<.6,'Broad deterministic distribution smoke check, not a probability certificate');

// A missing legacy seed still has stable identity; copying a hidden fare does
// not reveal it. Previewing never consumes the game's random stream or state.
const legacyMimic = rider('mimic', 'legacy-without-seed');
assert.deepEqual(riderProfile(legacyMimic, pairCabin(0, legacyMimic)),
  riderProfile(legacyMimic, pairCabin(2, legacyMimic)));
let hiddenFareCases = 0;
for (let i = 0; i < 32; i++) {
  const sealed = rider('mystery', `sealed-${i}`);
  const copied = riderProfile(mimic, pairCabin(0, mimic, sealed));
  if (copied.copies[0].field === 'fare') {
    assert(copied.hidden);
    const setup={...initialRun(),cabin:[sealed,null,null,null,null,null]};
    const placed=planPlacement(setup,mimic,3);
    assert.equal(placed.tone,'place','copying is not automatically a positive combo');
    assert(placed.next.message.includes('基础车费 封存'),'placement feedback must not reveal hidden fare');
    hiddenFareCases++;
  }
}
assert(hiddenFareCases > 0);
const previewState = { ...initialRun(), cabin: pairCabin(0) };
const before = JSON.stringify(previewState);
const originalRandom = Math.random;
try {
  Math.random = () => { throw new Error('Preview must not consume randomness'); };
  for (let i = 0; i < 100; i++) {
    riderProfile(mimic, previewState.cabin);
    energyForecast(previewState);
    stressForecast(previewState);
    planPlacement(previewState, source, 1);
  }
} finally {
  Math.random = originalRandom;
}
assert.equal(JSON.stringify(previewState), before);

console.log(JSON.stringify({
  rule: 'immediately-above source; fixed per Mimic instance and source instance',
  passed: true, legalMoves, relocatedPairChecks: 1000, distinctSourceChecks: 128,
  previewRepetitions: 100,
  pairMatrix:{copies:64,sources:128,patterns:patterns.size,energyFraction},
  limits: 'Rule regression only; not a browser playtest or balance evaluation.',
}, null, 2));
