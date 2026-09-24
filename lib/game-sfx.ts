// v9.8 juice: synthesized sound effects with a small reverb. Separate from game-audio (metric cues), same mute flag.
// Everything is generated with WebAudio, so there are no files to load and nothing can fail to decode.

export type Sfx =
  | 'ding' | 'doorClose' | 'doorOpen' | 'hum' | 'clink' | 'register' | 'link' | 'conflict' | 'heartbeat'
  | 'rumble' | 'calm' | 'stamp' | 'sell' | 'record' | 'district' | 'tick' | 'board' | 'whoosh' | 'closeCall' | 'deal' | 'shimmer' | 'sizzle' | 'defuse' | 'explosion' | 'boxOpen';

type Bus = { ctx: BaseAudioContext; out: GainNode; wet: GainNode };
let bus: (Bus & { ctx: AudioContext }) | null = null;
const live = new Set<AudioScheduledSourceNode>();
/** v9.18.3 mix safety: a brick-wall limiter so stacked effects never clip, and an 11 kHz low-pass that keeps bright
 * partials and noise from turning into fizz. (The old -18 dB compressor added about 8 dB of automatic make-up gain,
 * which pushed sharp sample transients and reverb hiss up with it.) `SFX_MIX` is tuned in the offline
 * render check (window.__sfxQa in development). */
export const SFX_MIX = { out: .9, wet: .16, limit: { threshold: -4, ratio: 20, attack: .002, release: .12 }, lowpass: 11000, maxVoices: 40, maxPartial: 9000 };

function makeBus(ctx: BaseAudioContext): Bus {
  const out = ctx.createGain(); out.gain.value = SFX_MIX.out;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = SFX_MIX.limit.threshold; limiter.knee.value = 0; limiter.ratio.value = SFX_MIX.limit.ratio; limiter.attack.value = SFX_MIX.limit.attack; limiter.release.value = SFX_MIX.limit.release;
  const tame = ctx.createBiquadFilter(); tame.type = 'lowpass'; tame.frequency.value = SFX_MIX.lowpass; tame.Q.value = .5;
  out.connect(tame).connect(limiter).connect(ctx.destination);
  // A short generated room: decaying stereo noise as the impulse response.
  const length = Math.floor(ctx.sampleRate * 1.2), impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const data = impulse.getChannelData(ch); for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3; }
  const reverb = ctx.createConvolver(); reverb.buffer = impulse;
  const wet = ctx.createGain(); wet.gain.value = SFX_MIX.wet;
  wet.connect(reverb).connect(tame);
  return { ctx, out, wet };
}
function ensureBus(): Bus | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (bus && bus.ctx.state !== 'closed') { if (bus.ctx.state === 'suspended') void bus.ctx.resume().catch(() => undefined); return bus; }
  const ctx = new AudioCtx();
  bus = { ...makeBus(ctx), ctx };
  return bus;
}
/** Too many overlapping voices only add mud (and load); past the cap, new decorative voices are skipped. */
const crowded = (b: Bus) => b === bus && live.size >= SFX_MIX.maxVoices;

type ToneOpts = { at: number; dur: number; gain: number; type?: OscillatorType; attack?: number; glideTo?: number; wet?: boolean };
function tone(b: Bus, freq: number, o: ToneOpts) {
  const { ctx } = b, osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, o.at);
  if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, o.at + o.dur);
  g.gain.setValueAtTime(.0001, o.at);
  g.gain.exponentialRampToValueAtTime(o.gain, o.at + Math.min(o.dur * .5, o.attack ?? .006));
  g.gain.exponentialRampToValueAtTime(.0001, o.at + o.dur);
  g.gain.setValueAtTime(0, o.at + o.dur + .01);
  osc.connect(g); g.connect(b.out); if (o.wet !== false) g.connect(b.wet);
  live.add(osc); osc.start(o.at); osc.stop(o.at + o.dur + .05);
  osc.onended = () => { live.delete(osc); osc.disconnect(); g.disconnect(); };
}
function bell(b: Bus, freq: number, at: number, dur: number, gain: number) {
  // Inharmonic partials give a metallic, lift-bell colour; partials above SFX_MIX.maxPartial are dropped (they fizz).
  [[1, 1], [2.76, .45], [5.4, .22], [8.93, .1]].forEach(([ratio, level], i) => { if (freq * ratio <= SFX_MIX.maxPartial) tone(b, freq * ratio, { at, dur: dur / (1 + i * .6), gain: gain * level, attack: .004 }); });
}
type NoiseOpts = { at: number; dur: number; gain: number; freq: number; q?: number; sweepTo?: number; filter?: BiquadFilterType };
function noise(b: Bus, o: NoiseOpts) {
  const { ctx } = b, len = Math.max(1, Math.floor(ctx.sampleRate * o.dur)), buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = o.filter ?? 'bandpass'; f.frequency.setValueAtTime(o.freq, o.at); f.Q.value = o.q ?? 1.2;
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, o.at + o.dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(.0001, o.at); g.gain.exponentialRampToValueAtTime(o.gain, o.at + o.dur * .2); g.gain.exponentialRampToValueAtTime(.0001, o.at + o.dur); g.gain.setValueAtTime(0, o.at + o.dur + .005);
  src.connect(f).connect(g); g.connect(b.out); g.connect(b.wet);
  live.add(src); src.start(o.at); src.stop(o.at + o.dur + .02);
  src.onended = () => { live.delete(src); src.disconnect(); f.disconnect(); g.disconnect(); };
}

// v9.10 recorded samples (Kenney Casino Audio and Interface Sounds, CC0; licences in public/audio/sfx).
// Loaded on first use; any effect without a decoded sample falls back to its synthesized version.
// v9.18.3: the chip-stack rattle behind 'register' read as crackle and was the loudest thing in the mix (it played on
// every floor paying 20+, e.g. each Bomber delivery), so the cash register is synthesized again; the other samples
// play at about half their old level to sit with the synthesized effects (checked with renderSfxOffline).
export const SAMPLES: Partial<Record<Sfx, { files: string[]; gain: number }>> = {
  deal: { files: ['card-slide-1', 'card-slide-2', 'card-slide-3', 'card-slide-4'], gain: .18 },
  board: { files: ['card-place-1', 'card-place-2', 'card-place-3'], gain: .2 },
  clink: { files: ['chip-lay-1', 'chip-lay-2', 'chip-lay-3'], gain: .14 },
  sell: { files: ['chips-handle-1', 'chips-handle-2'], gain: .28 },
  stamp: { files: ['card-shove-1', 'card-shove-2'], gain: .22 },
  conflict: { files: ['error_004'], gain: .22 },
  tick: { files: ['tick_001', 'tick_002'], gain: .18 },
  whoosh: { files: ['card-fan-1'], gain: .28 },
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
  // A 4 ms fade-in: a recorded sample that starts off zero would otherwise click.
  const g = b.ctx.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(spec.gain, at + .004);
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
    loadSamples(b);
    if (crowded(b) && !['defuse', 'explosion', 'ding', 'record'].includes(name)) return;
    schedule(b, name, b.ctx.currentTime + (opts.delay ?? 0), opts.pitch ?? 0);
  } catch { /* Sound is optional and must never block play. */ }
}

function schedule(b: Bus, name: Sfx, at: number, pitch: number) {
  const p = 2 ** (pitch / 12);
  // Recorded sample first (chips pitch up gently along a chain); a bell tail keeps the register and stamp bright.
  if (playSample(b, name, at, name === 'clink' ? 2 ** (Math.min(pitch, 7) / 24) : 1)) {
    if (name === 'register') bell(b, 1760, at + .12, .9, .04);
    if (name === 'stamp') bell(b, 1568, at + .1, .7, .025);
    return;
  }
  switch (name) {
    case 'ding': bell(b, 1318.5, at, 1.6, .08); bell(b, 1046.5, at + .32, 1.8, .07); break;
    case 'doorClose': noise(b, { at, dur: .32, gain: .035, freq: 700, sweepTo: 240, q: .9 }); tone(b, 70, { at: at + .28, dur: .12, gain: .07, type: 'triangle', wet: false }); break;
    case 'doorOpen': noise(b, { at, dur: .34, gain: .07, freq: 260, sweepTo: 900, q: .9 }); break;
    case 'hum': tone(b, 55, { at, dur: .75, gain: .045, type: 'triangle', glideTo: 82, attack: .12, wet: false }); noise(b, { at, dur: .7, gain: .015, freq: 180, q: 3, filter: 'lowpass' }); break;
    case 'clink': tone(b, 2093 * p, { at, dur: .16, gain: .04, attack: .003 }); tone(b, 3136 * p, { at: at + .01, dur: .09, gain: .018, attack: .003 }); break;
    case 'register': noise(b, { at, dur: .08, gain: .06, freq: 3000, q: 2 }); bell(b, 1760, at + .06, .9, .06); bell(b, 2217, at + .16, 1, .05); break;
    case 'link': [0, 4, 7].forEach((st, i) => tone(b, 784 * p * 2 ** (st / 12), { at: at + i * .06, dur: .5, gain: .035, attack: .005 })); break;
    case 'conflict': tone(b, 233 * p, { at, dur: .32, gain: .04, type: 'triangle' }); tone(b, 247 * p, { at, dur: .32, gain: .035, type: 'triangle' }); break;
    case 'heartbeat': [0, .22, .9, 1.12].forEach((t, i) => tone(b, i % 2 ? 48 : 60, { at: at + t, dur: .16, gain: .14, type: 'sine', glideTo: 38, attack: .01, wet: false })); break;
    case 'rumble': noise(b, { at, dur: .9, gain: .06, freq: 120, sweepTo: 70, q: .7, filter: 'lowpass' }); tone(b, 49, { at, dur: .8, gain: .05, type: 'triangle', wet: false }); break;
    case 'calm': noise(b, { at, dur: .6, gain: .025, freq: 1800, sweepTo: 500, q: .8 }); bell(b, 880, at + .12, 1.2, .04); break;
    case 'stamp': tone(b, 90, { at, dur: .14, gain: .12, type: 'triangle', glideTo: 55, wet: false }); noise(b, { at, dur: .07, gain: .04, freq: 1800, q: 1 }); bell(b, 1568, at + .08, .7, .03); break;
    case 'sell': tone(b, 2349, { at, dur: .12, gain: .035, glideTo: 1760 }); tone(b, 2637, { at: at + .07, dur: .18, gain: .03 }); break;
    case 'record': [0, 4, 7, 12, 16].forEach((st, i) => tone(b, 523.25 * 2 ** (st / 12), { at: at + i * .09, dur: .9, gain: .04, type: 'triangle', attack: .01 })); bell(b, 2093, at + .5, 1.6, .04); break;
    case 'district': noise(b, { at, dur: 1.1, gain: .025, freq: 400, sweepTo: 2600, q: .6 }); [0, 7, 12].forEach((st, i) => tone(b, 392 * 2 ** (st / 12), { at: at + .35 + i * .12, dur: 1.3, gain: .035, type: 'triangle', attack: .01 })); break;
    // Sine ticks: a square wave this short aliases into a harsh click.
    case 'tick': tone(b, 1800 * p, { at, dur: .04, gain: .03, type: 'sine', attack: .002, wet: false }); break;
    case 'board': tone(b, 330 * p, { at, dur: .12, gain: .045, type: 'triangle', glideTo: 440 * p }); noise(b, { at, dur: .06, gain: .015, freq: 2600, q: 2 }); break;
    case 'whoosh': noise(b, { at, dur: .35, gain: .03, freq: 600, sweepTo: 2400, q: .8 }); break;
    case 'deal': noise(b, { at, dur: .05, gain: .04, freq: 3200 * p, q: 1.2 }); tone(b, 900 * p, { at, dur: .04, gain: .018, type: 'triangle', wet: false }); break;
    case 'shimmer': [0, 4, 7, 11, 14].forEach((st, i) => tone(b, 1568 * 2 ** (st / 12), { at: at + i * .045, dur: .6, gain: .018, attack: .005 })); break;
    // v9.18.2 Bomber: a burning fuse crackles, a defusal rings out, an explosion booms. v9.18.3: the fuse is a soft
    // mid-band crackle (the old high-pass hiss read as distortion) and the defusal chord opens without a noise burst.
    case 'sizzle': noise(b, { at, dur: .26, gain: .016, freq: 3400, q: .8 }); [0.05, .13].forEach(t => noise(b, { at: at + t * p, dur: .025, gain: .026, freq: 2400, q: 3 })); break;
    case 'defuse': [0, 7, 12, 16, 19].forEach((st, i) => tone(b, 587.33 * 2 ** (st / 12), { at: at + i * .075, dur: .9, gain: .05, type: 'triangle', attack: .02 })); bell(b, 1174.66, at + .45, 1.8, .07); bell(b, 1567.98, at + .58, 1.6, .045); break;
    case 'explosion': noise(b, { at, dur: 1.8, gain: .12, freq: 700, sweepTo: 60, q: .6, filter: 'lowpass' }); tone(b, 70, { at, dur: 1.4, gain: .16, type: 'sine', glideTo: 28, attack: .01, wet: false }); noise(b, { at: at + .05, dur: .35, gain: .05, freq: 2600, q: .8 }); [0.3, .55, .8, 1.1].forEach(t => noise(b, { at: at + t, dur: .08, gain: .025, freq: 1600, q: 1.5 })); break;
    case 'closeCall': tone(b, 220, { at, dur: 1.2, gain: .04, type: 'triangle', glideTo: 440, attack: .3 }); bell(b, 1318.5, at + .9, 1.4, .05); break;
    case 'boxOpen': noise(b, { at, dur: .12, gain: .07, freq: 1400, sweepTo: 3200, q: 1 }); tone(b, 392 * p, { at: at + .06, dur: .18, gain: .09, type: 'triangle', glideTo: 523.25 * p }); [0, 4, 7].forEach((st, i) => tone(b, 1046.5 * p * 2 ** (st / 12), { at: at + .16 + i * .05, dur: .5, gain: .045, attack: .005 })); break;
  }
}

/** v9.18.3 QA (development only): render a sequence of effects offline through the same bus and report the peak
 * (1.0 = clipping), the loudest sample-to-sample jump (a click shows as a jump well above the signal's own slope) and
 * the RMS of the last 100 ms (a lingering hiss). */
export async function renderSfxOffline(sequence: Array<{ name: Sfx; at: number; pitch?: number }>, seconds = 3, withSamples = true) {
  const rate = 44100, ctx = new OfflineAudioContext(2, Math.ceil(rate * seconds), rate), b = makeBus(ctx);
  if (withSamples) await Promise.all([...new Set(Object.values(SAMPLES).flatMap(v => v!.files))].filter(f => !buffers.has(f)).map(f => fetch(`${SFX_BASE}${f}.mp3`).then(r => r.arrayBuffer()).then(d => ctx.decodeAudioData(d)).then(buf => { buffers.set(f, buf); }).catch(() => undefined)));
  for (const s of sequence) schedule(b, s.name, s.at, s.pitch ?? 0);
  const out = await ctx.startRendering();
  let peak = 0, jump = 0, tail = 0; const n = out.length, tailFrom = n - Math.floor(rate * .1);
  for (let ch = 0; ch < out.numberOfChannels; ch++) { const d = out.getChannelData(ch); for (let i = 1; i < n; i++) { peak = Math.max(peak, Math.abs(d[i])); jump = Math.max(jump, Math.abs(d[i] - d[i - 1])); if (i >= tailFrom) tail += d[i] * d[i]; } }
  return { peak: +peak.toFixed(3), jump: +jump.toFixed(3), tailRms: +Math.sqrt(tail / (n - tailFrom) / out.numberOfChannels).toFixed(4) };
}

/** A small random pitch offset in semitones so repeated effects do not sound identical. */
export const randomPitch = (range = 2) => Math.random() * range * 2 - range;
export const chance = (p: number) => Math.random() < p;

export function disposeSfx() {
  live.forEach(node => { try { node.stop(); } catch { /* already ended */ } });
  live.clear();
  if (bus) { void bus.ctx.close().catch(() => undefined); bus = null; }
}
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') (window as unknown as { __sfxQa?: unknown }).__sfxQa = { renderSfxOffline, SFX_MIX };
