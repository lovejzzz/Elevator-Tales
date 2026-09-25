// v10.1.2 keepsake icons: line art matching the symbol icons (components/symbol-icon.tsx), drawn in currentColor.
import type { KeepsakeKey } from '@/lib/legends';

const DRAW: Record<KeepsakeKey, React.ReactNode> = {
  // 老周的扳手
  wrench: <path d="M14.8 4.2a4.6 4.6 0 0 0-4.9 6.2l-6 6a1.9 1.9 0 0 0 2.7 2.7l6-6a4.6 4.6 0 0 0 6.2-4.9l-2.7 2.7-2.6-.6-.6-2.6Z" />,
  // 月老的红绳：一个同心结，两端垂下
  redString: <><path d="M12 12c-2.2-2.8-6.6-2.3-6.6.6S9.8 16.4 12 12Zm0 0c2.2-2.8 6.6-2.3 6.6.6S14.2 16.4 12 12Z" /><path d="M12 12c-.9 2.4-2.2 5.3-4 7.8M12 12c.9 2.4 2.2 5.3 4 7.8M10.6 5.2 12 7.6l1.4-2.4" /></>,
  // 教父的怀表
  pocketWatch: <><circle cx="12" cy="13.5" r="6.8" /><path d="M12 4.2v2.5M10.4 3.4h3.2M12 13.5V9.8M12 13.5l2.6 1.8" /></>,
  // 护士长的查房记录
  roundsLog: <><rect x="5.5" y="5" width="13" height="15.5" rx="1.5" /><path d="M9.5 3.5h5v3h-5ZM8.4 11l1.3 1.3 2.3-2.4M13.4 11.2h2.4M8.4 15.6l1.3 1.3 2.3-2.4M13.4 15.8h2.4" /></>,
  // 夜莺的黑胶唱片
  vinyl: <><circle cx="12" cy="12" r="8.3" /><circle cx="12" cy="12" r="5.4" /><circle cx="12" cy="12" r="1.9" /></>,
  // 灵媒的招魂铃
  bell: <><path d="M6 16.8h12l-1.5-2.2V10.5a4.5 4.5 0 0 0-9 0v4.1Z" /><path d="M10.4 19.2a1.6 1.6 0 0 0 3.2 0M12 4v1.5" /></>,
  // 大亨的股票凭证
  stock: <><path d="M5 5.5h14v13H5Z" /><path d="m7.6 15 3-3.2 2.2 2 3.6-4.2M14.4 9.6h2v2" /><circle cx="16.4" cy="17.2" r="1.3" /></>,
};

export function KeepsakeIcon({ keepsake, size = 16 }: { keepsake: KeepsakeKey; size?: number }) {
  return <svg className={`keepsake-icon keepsake-icon-${keepsake}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{DRAW[keepsake]}</svg>;
}
