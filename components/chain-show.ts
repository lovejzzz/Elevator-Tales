// v10.3 the chain cash-in show. A chain of same-symbol riders getting off together is the rarest big payout in the
// game, so it gets the loudest moment: the WebGL layer (cabin-fx) jumps a bolt from card to card along the chain while
// this DOM part slams the multiplier in, rolls the total up and pours the coins into the wallet.
// One timeline drives both; times are seconds from the moment the arrival settles.
import { CHAIN_RULES, SYMBOLS, type SymbolKey } from '@/lib/symbols';
import { playSfx } from '@/lib/game-sfx';
import { burstAt, flashClass, walletGain } from './juice';

export type ChainShowData = { symbol: SymbolKey; path: Array<[number, number | null]>; multiplier: number; fares: number; bonus: number };

/** When each part plays. The first hop waits for the riders' own payouts to fade, so no text sits on other text. */
export const CHAIN_TIMING = { start: 1.05, hop: 0.27, settle: 0.4, hold: 1.7 };
export const SYMBOL_HEX: Record<SymbolKey, string> = { lively: '#f0a040', quiet: '#7ab4f0', order: '#e6c27a', street: '#b58ae6', hearth: '#8fd18f', spirit: '#7fd6d0' };
export const hopAt = (i: number) => CHAIN_TIMING.start + i * CHAIN_TIMING.hop;
export const payoffAt = (k: number) => hopAt(k - 1) + CHAIN_TIMING.settle;
/** How long the arrival holds the cabin for the show (ms). */
export const chainShowMs = (k: number, reduced: boolean) => reduced ? 2200 : Math.round((payoffAt(k) + CHAIN_TIMING.hold) * 1000);
/** 1 for ×3, 2 for ×6, 3 for ×12 and up. */
export const chainTier = (multiplier: number) => multiplier >= 12 ? 3 : multiplier >= 6 ? 2 : 1;
/** The multiplier the chain has reached after `n` riders lit. */
const multiplierAt = (n: number) => n < CHAIN_RULES.from ? 1 : CHAIN_RULES.base * 2 ** (n - CHAIN_RULES.from);

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function playChainShow(chain: ChainShowData, opts: { zh: boolean; sound: boolean; onPaid?: () => void }) {
  const stage = document.querySelector<HTMLElement>('.elevator-stage');
  if (!stage) return () => {};
  const reduced = reducedMotion(), k = chain.path.length, tier = chainTier(chain.multiplier), color = SYMBOL_HEX[chain.symbol];
  const name = opts.zh ? `${SYMBOLS[chain.symbol].zh}连锁` : `${SYMBOLS[chain.symbol].en} chain`;
  let paid = false;
  const pay = () => { if (!paid) { paid = true; opts.onPaid?.(); } };
  const timers: number[] = [], later = (s: number, fn: () => void) => { timers.push(window.setTimeout(fn, s * 1000)); };
  const seats = () => [...stage.querySelectorAll<HTMLElement>('.standing-grid:not(.link-label-layer) .standing-slot')];

  // The cabin dims around the chain; each chained seat steps forward as its bolt lands.
  stage.style.setProperty('--chain', color);
  later(reduced ? 0.2 : CHAIN_TIMING.start - 0.15, () => { stage.dataset.chain = String(tier); });
  chain.path.forEach(([slot], i) => later(reduced ? 0.2 : hopAt(i), () => {
    seats()[slot]?.classList.add('is-chained'); stage.querySelector(`.arrival-grid [data-slot="${slot}"]`)?.classList.add('is-chained');
    if (!reduced) playSfx(opts.sound, 'zap', { pitch: i * 2 });
  }));

  // The multiplier card appears once the chain pays (from the fourth rider), centred in the cabin.
  const hud = document.createElement('div');
  hud.className = 'juice chain-hud'; hud.setAttribute('aria-hidden', 'true'); hud.dataset.tier = '1';
  hud.style.setProperty('--chain', color);
  const nameEl = document.createElement('span'), countEl = document.createElement('span'), multEl = document.createElement('strong'), totalEl = document.createElement('b');
  nameEl.className = 'ch-name'; countEl.className = 'ch-count'; multEl.className = 'ch-mult'; totalEl.className = 'ch-total';
  nameEl.textContent = name; for (const el of [nameEl, multEl, countEl, totalEl]) hud.appendChild(el);
  const place = () => {
    const r = stage.getBoundingClientRect();
    hud.style.left = `${r.left + r.width / 2}px`; hud.style.top = `${r.top + r.height * 0.46}px`; hud.style.width = `${Math.min(r.width * 0.86, 520)}px`;
  };
  const setCount = (n: number) => {
    const m = multiplierAt(n);
    countEl.textContent = opts.zh ? `${n} 人同站下车` : `${n} off together`;
    multEl.textContent = `×${m}`; hud.dataset.tier = String(chainTier(m));
    if (!reduced) { multEl.classList.remove('is-slam'); void multEl.offsetWidth; multEl.classList.add('is-slam'); }
  };
  const first = CHAIN_RULES.from - 1;
  later(reduced ? 0.2 : hopAt(first), () => { place(); document.body.appendChild(hud); stage.dataset.chainHud = '1'; setCount(first + 1); });
  for (let i = first; i < k; i++) {
    later(reduced ? 0.2 : hopAt(i), () => {
      if (i > first) setCount(i + 1);
      if (reduced) return;
      const t = chainTier(multiplierAt(i + 1));
      playSfx(opts.sound, 'slam', { pitch: (t - 1) * 3 });
      stage.classList.remove('chain-shake-1', 'chain-shake-2', 'chain-shake-3'); void stage.offsetWidth; stage.classList.add(`chain-shake-${t}`);
    });
  }

  // Payoff: the total rolls up and the coins pour from the card into the wallet.
  later(reduced ? 0.3 : payoffAt(k), () => {
    hud.classList.add('is-paid');
    countEl.textContent = opts.zh ? `${k} 人车费 ${chain.fares} → ${chain.fares + chain.bonus}` : `${k} fares ${chain.fares} → ${chain.fares + chain.bonus}`;
    const wallet = document.querySelector('[data-metric="coins"]');
    if (reduced) { totalEl.textContent = `+${chain.bonus}`; pay(); return; }
    playSfx(opts.sound, 'jackpot', { pitch: (tier - 1) * 2 });
    const t0 = performance.now(), dur = 520 + tier * 180;
    const roll = (now: number) => { const p = Math.min(1, (now - t0) / dur), e = 1 - (1 - p) ** 3; totalEl.textContent = `+${Math.round(chain.bonus * e)}`; if (p < 1 && hud.isConnected) requestAnimationFrame(roll); };
    requestAnimationFrame(roll);
    const w = wallet?.getBoundingClientRect();
    if (!w || !w.width) { pay(); return; }
    const from = multEl.getBoundingClientRect(), x0 = from.left + from.width / 2, y0 = from.top + from.height / 2;
    const dx = w.left + w.width / 2 - x0, dy = w.top + w.height / 2 - y0, count = [0, 18, 30, 46][tier];
    let landed = 0;
    for (let c = 0; c < count; c++) {
      const coin = document.createElement('span'); coin.className = 'coin-flight chain-coin'; coin.style.left = `${x0}px`; coin.style.top = `${y0}px`; document.body.appendChild(coin);
      const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * (60 + tier * 30);
      coin.animate([
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r * 0.6 - 30}px)) scale(1.15)`, opacity: 1, offset: .32 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.5)`, opacity: .9 },
      ], { duration: 640 + Math.random() * 200, delay: 120 + c * (14 - tier * 2), easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' }).onfinish = () => {
        coin.remove();
        if (landed++ % 3 === 0) playSfx(opts.sound, 'clink', { pitch: Math.min(12, landed / 3) });
        if (landed === count) { pay(); flashClass(wallet, 'wallet-bump', 700); walletGain(`+${chain.bonus}`, 'gold', true); burstAt(wallet, 'gold', 14 + tier * 8, 70 + tier * 30); }
      };
    }
  });

  const end = reduced ? 2.1 : payoffAt(k) + CHAIN_TIMING.hold;
  later(end - 0.35, () => { hud.classList.add('is-leaving'); stage.dataset.chainLeaving = '1'; });
  const cleanup = () => {
    timers.forEach(clearTimeout); pay(); hud.remove();
    delete stage.dataset.chain; delete stage.dataset.chainLeaving; delete stage.dataset.chainHud; stage.classList.remove('chain-shake-1', 'chain-shake-2', 'chain-shake-3');
    stage.querySelectorAll('.is-chained').forEach(s => s.classList.remove('is-chained'));
    document.querySelectorAll('.chain-coin').forEach(c => c.remove());
  };
  timers.push(window.setTimeout(cleanup, end * 1000));
  return cleanup;
}
