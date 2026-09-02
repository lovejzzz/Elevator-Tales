import assert from 'node:assert/strict';
import { disposeGameAudio, playGameSound, playMetricSounds } from '../lib/game-audio';
import { initialRun } from '../lib/game-engine';
import { metricChanges } from '../lib/metric-feedback';

const priorWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const voices: Array<{ frequency: number; starts: number[]; stops: number[] }> = [];
let created = 0; let closed = 0; let resumed = 0;
class FakeAudioContext {
  state = 'suspended'; currentTime = 10; destination = {};
  constructor() { created += 1; }
  async resume() { resumed += 1; this.state = 'running'; }
  async close() { closed += 1; this.state = 'closed'; }
  createOscillator() {
    const voice = { frequency: 0, starts: [] as number[], stops: [] as number[] }; voices.push(voice);
    return { type: 'sine', frequency: { setValueAtTime(value: number) { voice.frequency = value; } }, connect(node: unknown) { return node; }, disconnect() {}, start(at: number) { voice.starts.push(at); }, stop(at = 10) { voice.stops.push(at); }, onended: null };
  }
  createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
}

try {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { AudioContext: FakeAudioContext } });
  playGameSound(false, 'coin');
  assert.equal(created, 0, 'muted interactions must not create audio');
  playGameSound(true, 'place');
  assert.equal(created, 1); assert.equal(resumed, 1);
  const firstCount = voices.length;
  const state = initialRun();
  playMetricSounds(true, metricChanges(state, { ...state, coins: 6, energy: 12, stress: 1 }, 'test'));
  assert.equal(created, 1, 'all cues should reuse one audio context');
  const cues = voices.slice(firstCount);
  assert.equal(cues.length, 6, 'three two-note metric cues');
  assert.deepEqual(cues.filter((_, i) => i % 2 === 0).map((voice) => Number(voice.starts[0].toFixed(2))), [10.08, 10.22, 10.36], 'simultaneous metric sounds should be gently staggered');
  assert.equal(cues[0].frequency, 1046.5, 'coin uses its dedicated chime');
  assert.equal(cues[2].frequency, 293.66, 'energy cost uses a descending cue');
  assert.equal(cues[4].frequency, 174.61, 'pressure uses its low warning cue');
  disposeGameAudio();
  assert.equal(closed, 1);
  assert.ok(voices.every((voice) => voice.stops.length === 2), 'muting/disposal stops even scheduled future notes');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { AudioContext: class { constructor() { throw new Error('audio unavailable'); } } } });
  assert.doesNotThrow(() => playGameSound(true, 'arrive'), 'audio restrictions must not block gameplay');
} finally {
  disposeGameAudio();
  if (priorWindow) Object.defineProperty(globalThis, 'window', priorWindow);
  else Reflect.deleteProperty(globalThis, 'window');
}
console.log('Audio verified: mute, shared context, distinct metric cues, staggered timing, cancellation, and unavailable-audio fallback.');
