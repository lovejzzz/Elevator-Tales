export type GameSound = 'select' | 'place' | 'combo' | 'depart' | 'arrive' | 'danger' | 'upgrade' | 'victory';
let context: AudioContext | null = null;

export function playGameSound(enabled: boolean, type: GameSound) {
  if (!enabled || typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  try {
    if (!context || context.state === 'closed') context = new AudioCtx();
    const ctx = context;
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    const notes: Record<GameSound, number[]> = { select: [440], place: [330, 440], combo: [523.25, 659.25, 783.99], depart: [220, 165], arrive: [659.25, 523.25], danger: [196, 164.81], upgrade: [392, 523.25, 659.25], victory: [392, 523.25, 659.25, 783.99] };
    const duration = type === 'select' ? .075 : type === 'place' ? .13 : .24;
    notes[type].forEach((frequency, index) => {
      const at = ctx.currentTime + index * .065;
      const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
      oscillator.type = type === 'depart' || type === 'danger' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(.0001, at);
      gain.gain.exponentialRampToValueAtTime(type === 'select' ? .018 : .035, at + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(at); oscillator.stop(at + duration + .02);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  } catch { /* Sound is optional; browser audio restrictions must never block play. */ }
}

export function disposeGameAudio() {
  if (context) { void context.close().catch(() => undefined); context = null; }
}
