// v10 symbol icons: line art in the cabin's Art Deco style, drawn in the symbol's colour (currentColor).
// 热闹 a starburst · 安静 a closed eye · 秩序 a column · 江湖 a masquerade mask · 人间 a lit house · 幽冥 a crescent moon.
import type { SymbolKey } from '@/lib/symbols';

const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4, inner = 5.2, outer = i % 2 ? 8.6 : 10.2;
  return `M${(12 + inner * Math.cos(a)).toFixed(2)} ${(12 + inner * Math.sin(a)).toFixed(2)}L${(12 + outer * Math.cos(a)).toFixed(2)} ${(12 + outer * Math.sin(a)).toFixed(2)}`;
}).join('');

const DRAW: Record<SymbolKey, React.ReactNode> = {
  lively: <><circle cx="12" cy="12" r="2.6" /><path d={RAYS} /></>,
  quiet: <><path d="M3.5 10.5Q12 17.5 20.5 10.5" /><path d="M6.4 13.4 5.2 15.6M9.3 15 8.7 17.4M14.7 15l.6 2.4M17.6 13.4l1.2 2.2" /></>,
  order: <><path d="M5 5h14M6.5 7.5h11M8.5 7.5v9.5M12 7.5v9.5M15.5 7.5v9.5M6.5 17h11M5 19.5h14" /></>,
  street: <><path d="M2.8 9.6C2.8 8 4 7 5.6 7h12.8C20 7 21.2 8 21.2 9.6c0 3.4-1.9 6.4-4.7 6.4-2 0-2.9-1.9-4.5-1.9s-2.5 1.9-4.5 1.9c-2.8 0-4.7-3-4.7-6.4Z" /><path d="M6.4 10.8q1.8-1.4 3.6 0M14 10.8q1.8-1.4 3.6 0" /></>,
  hearth: <><path d="M3.5 11.5 12 4.5l8.5 7M6 9.6V19.5h12V9.6" /><rect x="10" y="12.5" width="4" height="4" rx=".5" fill="currentColor" stroke="none" /></>,
  spirit: <><path d="M15.5 3.8a8.4 8.4 0 1 0 4.9 12.5 6.8 6.8 0 0 1-4.9-12.5Z" /><path d="M6 5.2v2.6M4.7 6.5h2.6" /></>,
};

export function SymbolIcon({ symbol, size = 14 }: { symbol: SymbolKey; size?: number }) {
  return <svg className={`sym-icon sym-icon-${symbol}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{DRAW[symbol]}</svg>;
}
