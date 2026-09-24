'use client';
// v9.18.2 Bomber timer: a bomb with a digital readout (seconds to two decimals) and a burning fuse that shortens with
// the time left. The run state ticks every 200 ms; between ticks this component interpolates on its own animation
// frame and writes to the DOM directly, so the readout runs smoothly without re-rendering the game.
import { useEffect, useRef } from 'react';

type Props = { ms: number; total: number; running: boolean; speed: number; state: 'live' | 'late' | 'locked' | 'carried' };
const FUSE = 'M50 20 C 56 9, 66 16, 73 9 S 88 3, 95 8';

export function BombTimer({ ms, total, running, speed, state }: Props) {
  const digits = useRef<HTMLSpanElement>(null), fuse = useRef<SVGPathElement>(null), spark = useRef<SVGGElement>(null);
  const since = useRef(0), base = useRef(ms);
  useEffect(() => { base.current = ms; since.current = performance.now(); }, [ms]);
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const left = Math.max(0, running ? base.current - (performance.now() - since.current) * speed : base.current);
      if (digits.current) digits.current.textContent = (left / 1000).toFixed(2);
      const path = fuse.current;
      if (path) {
        const length = path.getTotalLength(), share = Math.max(0, Math.min(1, left / Math.max(1, total)));
        path.style.strokeDasharray = `${length}`; path.style.strokeDashoffset = `${length * (1 - share)}`;
        const tip = path.getPointAtLength(length * share);
        spark.current?.setAttribute('transform', `translate(${tip.x} ${tip.y})`);
      }
      if (running) frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [running, speed, total, ms]);
  return <span className={`bomb-timer bomb-${state} ${running ? 'is-running' : ''} ${ms <= 10000 && state !== 'locked' ? 'bomb-critical' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 100 72">
      <path className="bomb-fuse-spent" d={FUSE} />
      <path ref={fuse} className="bomb-fuse" d={FUSE} />
      <g ref={spark} className="bomb-spark"><circle r="4.5" /><circle className="bomb-spark-core" r="2" /><path d="M-7 0 L7 0 M0 -7 L0 7 M-5 -5 L5 5 M-5 5 L5 -5" /></g>
      <rect className="bomb-cap" x="42" y="15" width="14" height="9" rx="2" />
      <circle className="bomb-body" cx="48" cy="45" r="25" />
      <circle className="bomb-shine" cx="38" cy="34" r="6" />
      <rect className="bomb-screen" x="27" y="37" width="42" height="17" rx="3" />
    </svg>
    <span ref={digits} className="bomb-digits">{(ms / 1000).toFixed(2)}</span>
  </span>;
}
