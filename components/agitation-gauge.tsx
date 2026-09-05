import { agitationBand, agitationBandRanges } from '@/lib/balance-v832';
import type { GameLocale } from '@/lib/i18n';

type Props = { value: number; cap: number; nextLow: number; nextHigh: number; locale: GameLocale };

/** Pure display: current state and forecast come from the same game engine. */
export function AgitationGauge({ value, cap, nextLow, nextHigh, locale }: Props) {
  const en = locale === 'en';
  const band = agitationBand(value);
  const label = en ? { low: 'Low', medium: 'Medium', high: 'High' }[band] : { low: '低躁动', medium: '中躁动', high: '高躁动' }[band];
  const point = (n: number, radius = 76) => {
    const angle = Math.PI * (1 - Math.max(0, Math.min(cap, n)) / cap);
    return [100 + radius * Math.cos(angle), 88 - radius * Math.sin(angle)];
  };
  const arc = (from: number, to: number, radius = 76) => {
    const [x1,y1] = point(from,radius), [x2,y2] = point(to,radius);
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  };
  const [nx,ny] = point(value,66);
  const forecast = nextLow === nextHigh ? `${nextLow}` : `${nextLow}–${nextHigh}`;
  const ranges = agitationBandRanges(cap);
  return <div className={`agitation-gauge band-${band}`}>
    <meter className="sr-only" aria-label={en ? 'Agitation' : '躁动'} min={0} max={cap} value={Math.max(0,Math.min(cap,value))} aria-valuetext={`${value}/${cap} · ${label} · ${en?'Next':'下站'} ${forecast}`} />
    <div>
      <svg viewBox="0 0 200 100" aria-hidden="true" focusable="false">
        {ranges.map(range=><path key={range.band} className={`gauge-sector sector-${range.band}`} d={arc(range.min,range.max+1)} />)}
        {[0,3,5,cap].map(mark=>{const [ax,ay]=point(mark,69),[bx,by]=point(mark,84);return <line key={mark} className="gauge-tick" x1={ax} y1={ay} x2={bx} y2={by}/>;})}
        {nextLow !== nextHigh && <path className="gauge-range" d={arc(nextLow,nextHigh,60)}/>}
        {[...new Set([nextLow,nextHigh])].map(n=>{const [x,y]=point(n,62);return <line key={n} className="gauge-future" x1="100" y1="88" x2={x} y2={y}/>;})}
        <line className="gauge-needle" x1="100" y1="88" x2={nx} y2={ny}/>
        <circle className="gauge-hub" cx="100" cy="88" r="5"/>
      </svg>
    </div>
    <strong className="gauge-state">{label}</strong>
    <div className="gauge-legend">{ranges.map(range=><span key={range.band} className={`legend-${range.band}`}><b>{en ? {low:'Low',medium:'Mid',high:'High'}[range.band] : range.label}</b><span>{range.min}–{range.max}</span></span>)}</div>
    <span className="gauge-limit">{en ? `Loss at ${cap}` : `${cap} 起失控`}</span>
  </div>;
}
