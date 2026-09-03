import { type ChangeLine, type RunState } from './game-engine';

export type MetricKey = 'coins' | 'energy' | 'stress' | 'weight';
export type MetricChange = { key: MetricKey; label: string; before: number; after: number; delta: number; capDelta: number; tone: 'gain' | 'cost' | 'danger' | 'neutral'; sources: ChangeLine[] };

// Compare actual states, including caps/clamping. Forecasts and reset must not produce reward cues.
export function metricChanges(before: RunState, after: RunState, reason: string): MetricChange[] {
  const arrived = before.floor !== after.floor;
  const fields: Array<{ key: MetricKey; label: string; from: number; to: number; capDelta: number; sources: ChangeLine[] }> = [
    { key: 'coins', label: '金币', from: before.coins, to: after.coins, capDelta: 0, sources: arrived ? after.lastEarnings.sources : [] },
    { key: 'energy', label: '电量', from: before.energy, to: after.energy, capDelta: after.energyCap - before.energyCap, sources: arrived ? after.lastEnergy.sources : [] },
    { key: 'stress', label: '躁动', from: before.stress, to: after.stress, capDelta: after.stressCap - before.stressCap, sources: arrived ? after.lastPressure.sources : [] },
  ];
  return fields.flatMap(({ key, label, from, to, capDelta, sources }) => {
    const delta = to - from;
    if (!delta && !capDelta && !sources.length) return [];
    const tone = key === 'stress' ? delta > 0 ? 'danger' : delta < 0 || capDelta > 0 ? 'gain' : 'neutral'
      : delta > 0 || capDelta > 0 ? 'gain' : delta < 0 ? 'cost' : 'neutral';
    const lines = sources.length ? [...sources] : delta ? [{ label: reason, amount: delta }] : [];
    if (sources.length) {
      const adjustment = delta - sources.reduce((sum, line) => sum + line.amount, 0);
      if (adjustment) lines.push({ label: key === 'energy' ? '电量上限截取' : '躁动下限修正', amount: adjustment });
    }
    return [{ key, label, before: from, after: to, delta, capDelta, tone, sources: lines }];
  });
}
