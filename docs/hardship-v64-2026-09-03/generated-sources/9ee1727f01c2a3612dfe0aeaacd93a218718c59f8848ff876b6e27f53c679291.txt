import type { MetricChange } from './metric-feedback';

export type GameSound = 'select' | 'place' | 'combo' | 'depart' | 'arrive' | 'danger' | 'upgrade' | 'victory' | 'coin' | 'charge' | 'drain' | 'relief' | 'pressure' | 'load' | 'unload';
let context: AudioContext | null = null;
const voices = new Set<OscillatorNode>();

export function playGameSound(enabled: boolean, type: GameSound, delay = 0) {
  if (!enabled || typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  try {
    if (!context || context.state === 'closed') context = new AudioCtx();
    const ctx = context;
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    const notes: Record<GameSound, number[]> = { select: [440], place: [330, 440], combo: [523.25, 659.25, 783.99], depart: [220, 165], arrive: [659.25, 523.25], danger: [196, 164.81], upgrade: [392, 523.25, 659.25], victory: [392, 523.25, 659.25, 783.99], coin: [1046.5, 1318.5], charge: [392, 587.33], drain: [293.66, 220], relief: [523.25, 783.99], pressure: [174.61, 164.81], load: [246.94], unload: [369.99] };
    const duration = type === 'select' ? .075 : ['place', 'coin', 'load', 'unload', 'drain', 'pressure'].includes(type) ? .13 : .24;
    notes[type].forEach((frequency, index) => {
      const at = ctx.currentTime + delay + index * .065;
      const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
      oscillator.type = ['depart', 'danger', 'pressure', 'drain', 'load'].includes(type) ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(.0001, at);
      gain.gain.exponentialRampToValueAtTime(type === 'select' ? .018 : .03, at + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
      oscillator.connect(gain).connect(ctx.destination);
      voices.add(oscillator); oscillator.start(at); oscillator.stop(at + duration + .02);
      oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    });
  } catch { /* Sound is optional; browser audio restrictions must never block play. */ }
}

export function metricSound(change: MetricChange): GameSound | null {
  if (!change.delta && !change.capDelta) return null;
  if (change.key === 'coins') return change.delta > 0 ? 'coin' : 'drain';
  if (change.key === 'energy') return change.delta > 0 || change.capDelta > 0 ? 'charge' : 'drain';
  if (change.key === 'stress') return change.delta > 0 ? 'pressure' : 'relief';
  return change.capDelta > 0 || change.delta < 0 ? 'unload' : 'load';
}

export function playMetricSounds(enabled: boolean, changes: MetricChange[]) {
  changes.map(metricSound).filter((cue): cue is GameSound => cue !== null)
    .forEach((cue, index) => playGameSound(enabled, cue, .08 + index * .14));
}

export function disposeGameAudio() {
  voices.forEach((voice) => { try { voice.stop(); } catch { /* already ended */ } });
  voices.clear();
  if (context) { void context.close().catch(() => undefined); context = null; }
}
