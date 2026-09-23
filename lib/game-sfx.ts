// v9.8 juice: synthesized sound effects with a small reverb. Separate from game-audio (metric cues), same mute flag.
// Everything is generated with WebAudio, so there are no files to load and nothing can fail to decode.

export type Sfx =
  | 'ding' | 'doorClose' | 'doorOpen' | 'hum' | 'clink' | 'register' | 'link' | 'conflict' | 'heartbeat'
  | 'rumble' | 'calm' | 'stamp' | 'sell' | 'record' | 'district' | 'tick' | 'board' | 'whoosh' | 'closeCall' | 'deal' | 'shimmer';

type Bus = { ctx: AudioContext; out: GainNode; wet: GainNode };
let bus: Bus | null = null;
const live = new Set<AudioScheduledSourceNode>();

function ensureBus(): Bus | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (bus && bus.ctx.state !== 'closed') { if (bus.ctx.state === 'suspended') void bus.ctx.resume().catch(() => undefined); return bus; }
  const ctx = new AudioCtx();
  const out = ctx.createGain(); out.gain.value = .55;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
  out.connect(comp).connect(ctx.destination);
  // A short generated room: decaying stereo noise as the impulse response.
  const length = Math.floor(ctx.sampleRate * 1.4), impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const data = impulse.getChannelData(ch); for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.6; }
  const reverb = ctx.createConvolver(); reverb.buffer = impulse;
  const wet = ctx.createGain(); wet.gain.value = .22;
  wet.connect(reverb).connect(comp);
  bus = { ctx, out, wet };
  return bus;
}

type ToneOpts = { at: number; dur: number; gain: number; type?: OscillatorType; attack?: number; glideTo?: number; wet?: boolean };
function tone(b: Bus, freq: number, o: ToneOpts) {
  const { ctx } = b, osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, o.at);
  if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, o.at + o.dur);
  g.gain.setValueAtTime(.0001, o.at);
  g.gain.exponentialRampToValueAtTime(o.gain, o.at + (o.attack ?? .006));
  g.gain.exponentialRampToValueAtTime(.0001, o.at + o.dur);
  osc.connect(g); g.connect(b.out); if (o.wet !== false) g.connect(b.wet);
  live.add(osc); osc.start(o.at); osc.stop(o.at + o.dur + .05);
  osc.onended = () => { live.delete(osc); osc.disconnect(); g.disconnect(); };
}
function bell(b: Bus, freq: number, at: number, dur: number, gain: number) {
  // Inharmonic partials give a metallic, lift-bell colour.
  [[1, 1], [2.76, .45], [5.4, .22], [8.93, .1]].forEach(([ratio, level], i) => tone(b, freq * ratio, { at, dur: dur / (1 + i * .6), gain: gain * level, attack: .003 }));
}
type NoiseOpts = { at: number; dur: number; gain: number; freq: number; q?: number; sweepTo?: number; filter?: BiquadFilterType };
function noise(b: Bus, o: NoiseOpts) {
  const { ctx } = b, len = Math.max(1, Math.floor(ctx.sampleRate * o.dur)), buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = o.filter ?? 'bandpass'; f.frequency.setValueAtTime(o.freq, o.at); f.Q.value = o.q ?? 1.2;
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, o.at + o.dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(.0001, o.at); g.gain.exponentialRampToValueAtTime(o.gain, o.at + o.dur * .2); g.gain.exponentialRampToValueAtTime(.0001, o.at + o.dur);
  src.connect(f).connect(g); g.connect(b.out); g.connect(b.wet);
  live.add(src); src.start(o.at); src.stop(o.at + o.dur + .02);
  src.onended = () => { live.delete(src); src.disconnect(); f.disconnect(); g.disconnect(); };
}

// v9.10 recorded samples (Kenney Casino Audio and Interface Sounds, CC0; licences in public/audio/sfx).
// Loaded on first use; any effect without a decoded sample falls back to its synthesized version.
export const SAMPLES: Partial<Record<Sfx, { files: string[]; gain: number }>> = {
  deal: { files: ['card-slide-1', 'card-slide-2', 'card-slide-3', 'card-slide-4'], gain: .55 },
  board: { files: ['card-place-1', 'card-place-2', 'card-place-3'], gain: .7 },
  clink: { files: ['chip-lay-1', 'chip-lay-2', 'chip-lay-3'], gain: .45 },
  register: { files: ['chips-stack-1', 'chips-stack-2'], gain: .8 },
  sell: { files: ['chips-handle-1', 'chips-handle-2'], gain: .6 },
  stamp: { files: ['card-shove-1', 'card-shove-2'], gain: .8 },
  conflict: { files: ['error_004'], gain: .35 },
  tick: { files: ['tick_001', 'tick_002'], gain: .3 },
  whoosh: { files: ['card-fan-1'], gain: .45 },
};
const SFX_BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/audio/sfx/`;
const buffers = new Map<string, AudioBuffer>();
let samplesRequested = false;
function loadSamples(b: Bus) {
  if (samplesRequested || typeof fetch === 'undefined') return;
  samplesRequested = true;
  for (const file of new Set(Object.values(SAMPLES).flatMap(v => v!.files)))
    void fetch(`${SFX_BASE}${file}.mp3`).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.statusText)))).then(data => b.ctx.decodeAudioData(data)).then(buf => { buffers.set(file, buf); }).catch(() => undefined);
}
function playSample(b: Bus, name: Sfx, at: number, rate: number): boolean {
  const spec = SAMPLES[name]; if (!spec) return false;
  const ready = spec.files.filter(f => buffers.has(f)); if (!ready.length) return false;
  const src = b.ctx.createBufferSource(); src.buffer = buffers.get(ready[Math.floor(Math.random() * ready.length)])!;
  src.playbackRate.value = rate * (.96 + Math.random() * .08);
  const g = b.ctx.createGain(); g.gain.value = spec.gain;
  src.connect(g); g.connect(b.out); g.connect(b.wet);
  live.add(src); src.start(at); src.onended = () => { live.delete(src); src.disconnect(); g.disconnect(); };
  return true;
}
/** Warm up the audio bus and start loading samples (call from the click that turns sound on). */
export function preloadSfx() { try { const b = ensureBus(); if (b) loadSamples(b); } catch { /* optional */ } }

/** Play one effect. `pitch` shifts it in semitones (used for rising coin and link chains). */
export function playSfx(enabled: boolean, name: Sfx, opts: { pitch?: number; delay?: number } = {}) {
  if (!enabled) return;
  try {
    const b = ensureBus(); if (!b) return;
    const at = b.ctx.currentTime + (opts.delay ?? 0), p = 2 ** ((opts.pitch ?? 0) / 12);
    loadSamples(b);
    // Recorded sample first (chips pitch up gently along a chain); a bell tail keeps the register and stamp bright.
    if (playSample(b, name, at, name === 'clink' ? 2 ** (Math.min(opts.pitch ?? 0, 7) / 24) : 1)) {
      if (name === 'register') bell(b, 1760, at + .12, .9, .05);
      if (name === 'stamp') bell(b, 1568, at + .1, .7, .03);
      return;
    }
    switch (name) {
      case 'ding': bell(b, 1318.5, at, 1.6, .09); bell(b, 1046.5, at + .32, 1.8, .08); break;
      case 'doorClose': noise(b, { at, dur: .32, gain: .05, freq: 900, sweepTo: 260, q: .8 }); tone(b, 70, { at: at + .28, dur: .12, gain: .08, type: 'triangle', wet: false }); break;
      case 'doorOpen': noise(b, { at, dur: .34, gain: .045, freq: 260, sweepTo: 1100, q: .8 }); break;
      case 'hum': tone(b, 55, { at, dur: .75, gain: .05, type: 'sawtooth', glideTo: 82, attack: .12, wet: false }); noise(b, { at, dur: .7, gain: .02, freq: 180, q: 3, filter: 'lowpass' }); break;
      case 'clink': tone(b, 2093 * p, { at, dur: .16, gain: .045, attack: .002 }); tone(b, 3136 * p, { at: at + .01, dur: .09, gain: .02, attack: .002 }); break;
      case 'register': noise(b, { at, dur: .08, gain: .08, freq: 3000, q: 2 }); bell(b, 1760, at + .06, .9, .07); bell(b, 2217, at + .16, 1, .06); break;
      case 'link': [0, 4, 7].forEach((st, i) => tone(b, 784 * p * 2 ** (st / 12), { at: at + i * .06, dur: .5, gain: .04, attack: .004 })); break;
      case 'conflict': tone(b, 233 * p, { at, dur: .32, gain: .05, type: 'square' }); tone(b, 247 * p, { at, dur: .32, gain: .04, type: 'square' }); break;
      case 'heartbeat': [0, .22, .9, 1.12].forEach((t, i) => tone(b, i % 2 ? 48 : 60, { at: at + t, dur: .16, gain: .16, type: 'sine', glideTo: 38, wet: false })); break;
      case 'rumble': noise(b, { at, dur: .9, gain: .07, freq: 120, sweepTo: 70, q: .7, filter: 'lowpass' }); tone(b, 49, { at, dur: .8, gain: .06, type: 'triangle', wet: false }); break;
      case 'calm': noise(b, { at, dur: .6, gain: .04, freq: 2400, sweepTo: 500, q: .6 }); bell(b, 880, at + .12, 1.2, .045); break;
      case 'stamp': tone(b, 90, { at, dur: .14, gain: .14, type: 'triangle', glideTo: 55, wet: false }); noise(b, { at, dur: .07, gain: .06, freq: 1800, q: 1 }); bell(b, 1568, at + .08, .7, .04); break;
      case 'sell': tone(b, 2349, { at, dur: .12, gain: .04, glideTo: 1760 }); tone(b, 2637, { at: at + .07, dur: .18, gain: .035 }); break;
      case 'record': [0, 4, 7, 12, 16].forEach((st, i) => tone(b, 523.25 * 2 ** (st / 12), { at: at + i * .09, dur: .9, gain: .05, type: 'triangle' })); bell(b, 2093, at + .5, 1.6, .05); break;
      case 'district': noise(b, { at, dur: 1.1, gain: .035, freq: 400, sweepTo: 3200, q: .5 }); [0, 7, 12].forEach((st, i) => tone(b, 392 * 2 ** (st / 12), { at: at + .35 + i * .12, dur: 1.3, gain: .04, type: 'triangle' })); break;
      case 'tick': tone(b, 1800 * p, { at, dur: .03, gain: .025, type: 'square', wet: false }); break;
      case 'board': tone(b, 330 * p, { at, dur: .12, gain: .05, type: 'triangle', glideTo: 440 * p }); noise(b, { at, dur: .06, gain: .02, freq: 2600, q: 2 }); break;
      case 'whoosh': noise(b, { at, dur: .35, gain: .04, freq: 600, sweepTo: 2800, q: .7 }); break;
      case 'deal': noise(b, { at, dur: .05, gain: .06, freq: 3800 * p, q: .9, filter: 'highpass' }); tone(b, 900 * p, { at, dur: .04, gain: .02, type: 'triangle', wet: false }); break;
      case 'shimmer': [0, 4, 7, 11, 14].forEach((st, i) => tone(b, 1568 * 2 ** (st / 12), { at: at + i * .045, dur: .6, gain: .022, attack: .004 })); break;
      case 'closeCall': tone(b, 220, { at, dur: 1.2, gain: .05, type: 'sawtooth', glideTo: 440, attack: .3 }); bell(b, 1318.5, at + .9, 1.4, .06); break;
    }
  } catch { /* Sound is optional and must never block play. */ }
}

/** A small random pitch offset in semitones so repeated effects do not sound identical. */
export const randomPitch = (range = 2) => Math.random() * range * 2 - range;
export const chance = (p: number) => Math.random() < p;

export function disposeSfx() {
  live.forEach(node => { try { node.stop(); } catch { /* already ended */ } });
  live.clear();
  if (bus) { void bus.ctx.close().catch(() => undefined); bus = null; }
}
