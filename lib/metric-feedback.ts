import { totalWeight, type ChangeLine, type RunState } from './game-engine';
import { PASSENGERS } from './game-data';

export type MetricKey = 'coins' | 'energy' | 'stress' | 'weight';
export type MetricChange = { key: MetricKey; label: string; before: number; after: number; delta: number; capDelta: number; tone: 'gain' | 'cost' | 'danger' | 'neutral'; sources: ChangeLine[] };

// Compare actual states, including caps/clamping. Forecasts and reset must not produce reward cues.
export function metricChanges(before: RunState, after: RunState, reason: string): MetricChange[] {
  const arrived = before.floor !== after.floor;
  const fields: Array<{ key: MetricKey; label: string; from: number; to: number; capDelta: number; sources: ChangeLine[] }> = [
    { key: 'coins', label: '金币', from: before.coins, to: after.coins, capDelta: 0, sources: arrived ? after.lastEarnings.sources : [] },
    { key: 'energy', label: '能源', from: before.energy, to: after.energy, capDelta: after.energyCap - before.energyCap, sources: arrived ? after.lastEnergy.sources : [] },
    { key: 'stress', label: '躁动', from: before.stress, to: after.stress, capDelta: after.stressCap - before.stressCap, sources: arrived ? after.lastPressure.sources : [] },
    { key: 'weight', label: '载重', from: totalWeight(before.cabin), to: totalWeight(after.cabin), capDelta: after.weightCap - before.weightCap, sources: arrived ? before.cabin.flatMap((rider) => rider && !after.cabin.some((other) => other?.id === rider.id) && PASSENGERS[rider.kind].weight ? [{ label: `${PASSENGERS[rider.kind].name}离开轿厢`, amount: -PASSENGERS[rider.kind].weight }] : []) : [] },
  ];
  return fields.flatMap(({ key, label, from, to, capDelta, sources }) => {
    const delta = to - from;
    if (!delta && !capDelta && !sources.length) return [];
    const tone = key === 'stress' ? delta > 0 ? 'danger' : delta < 0 || capDelta > 0 ? 'gain' : 'neutral'
      : key === 'weight' ? capDelta > 0 ? 'gain' : to > 8 && delta > 0 ? 'cost' : 'neutral'
      : delta > 0 || capDelta > 0 ? 'gain' : delta < 0 ? 'cost' : 'neutral';
    const lines = sources.length ? [...sources] : delta ? [{ label: reason, amount: delta }] : [];
    if (sources.length) {
      const adjustment = delta - sources.reduce((sum, line) => sum + line.amount, 0);
      if (adjustment) lines.push({ label: key === 'energy' ? '能源上限截取' : '躁动下限修正', amount: adjustment });
    }
    return [{ key, label, before: from, after: to, delta, capDelta, tone, sources: lines }];
  });
}
