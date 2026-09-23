import type { GameLocale } from '@/lib/i18n';

type Props = { value: number; cap: number; next: number; danger: number; locale: GameLocale };

/** Brass voltmeter: needle for current power, dashed needle for the worst case after the next floor.
 * The red zone is power that would not cover the next floor; values come from the engine forecast. */
export function PowerGauge({ value, cap, next, danger, locale }: Props) {
  const en = locale === 'en';
  const clamp = (n: number) => Math.max(0, Math.min(cap, n));
  // A shallow VU-meter arc from 155° to 25°, centred below the face.
  const angleOf = (n: number) => (155 - (clamp(n) / Math.max(1, cap)) * 130) * Math.PI / 180;
  const point = (n: number, r: number) => [100 + r * Math.cos(angleOf(n)), 118 - r * Math.sin(angleOf(n))];
  const arc = (from: number, to: number, r: number) => {
    const [x1, y1] = point(from, r), [x2, y2] = point(to, r);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const red = clamp(danger), amber = clamp(Math.max(danger * 2, cap * 0.25));
  const [nx, ny] = point(value, 92), [fx, fy] = point(next, 86);
  const ticks = Array.from({ length: 11 }, (_, i) => (cap * i) / 10);
  return <div className={`power-gauge ${value <= danger ? 'is-danger' : value <= amber ? 'is-warn' : ''}`}>
    <meter className="sr-only" aria-label={en ? 'Power' : '电量'} min={0} max={cap} value={clamp(value)} aria-valuetext={`${value}/${cap} · ${en ? 'next' : '下一站'} ${next}`} />
    <svg viewBox="0 12 200 78" aria-hidden="true" focusable="false">
      <path className="volt-zone zone-red" d={arc(0, red, 100)} />
      <path className="volt-zone zone-amber" d={arc(red, amber, 100)} />
      <path className="volt-zone zone-green" d={arc(amber, cap, 100)} />
      {ticks.map((t, i) => { const [ax, ay] = point(t, i % 5 ? 94 : 90), [bx, by] = point(t, 104); return <line key={i} className="volt-tick" x1={ax} y1={ay} x2={bx} y2={by} />; })}
      {next !== value && <line className="volt-next" x1="100" y1="118" x2={fx} y2={fy} />}
      <line className="volt-needle" x1="100" y1="118" x2={nx} y2={ny} />
    </svg>
  </div>;
}

/** Cash-register counter: one window per digit; a digit rolls in when it changes. */
export function RegisterNumber({ value, digits = 3 }: { value: number; digits?: number }) {
  const text = String(Math.max(0, Math.round(value))).padStart(digits, '0');
  const lead = text.length - String(Math.max(0, Math.round(value))).length;
  return <span className="register-number" aria-label={String(value)}>
    {text.split('').map((d, i) => <span key={`${text.length - i}-${d}`} className={`register-digit ${i < lead ? 'is-lead' : ''}`} aria-hidden="true">{d}</span>)}
  </span>;
}
