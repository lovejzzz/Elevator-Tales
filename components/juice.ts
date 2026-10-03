// v9.8 juice: decorative DOM effects (fly-ins, particle bursts, pop numbers, banners, speech bubbles).
// Each effect creates short-lived elements on <body> and removes them when its animation ends.
// Motion is skipped under prefers-reduced-motion; banners and bubbles still appear, without movement.
// v9.10: fly-ins, pop numbers and banners move on Motion springs.
import { animate } from 'motion';

export type Tone = 'gold' | 'green' | 'blue' | 'red' | 'violet';
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const centre = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; };
function layer(className: string) {
  const el = document.createElement('div'); el.className = `juice ${className}`; el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el); return el;
}

/** A copy of the rider's portrait flies from the offer card to its seat. */
export function flyPortrait(from: Element | null, to: Element | null, src: string) {
  if (!from || !to || reduced()) return;
  const a = centre(from), b = centre(to), size = Math.max(40, Math.min(a.w, a.h));
  const el = layer('juice-fly'); el.style.backgroundImage = `url(${src})`;
  el.style.width = el.style.height = `${size}px`; el.style.left = `${a.x - size / 2}px`; el.style.top = `${a.y - size / 2}px`;
  const scale = Math.max(.6, Math.min(2.2, Math.min(b.w, b.h) * .7 / size));
  // Two springs: an arc up and across, then a soft settle into the seat.
  void animate(el, { x: [0, (b.x - a.x) * .5, b.x - a.x], y: [0, (b.y - a.y) * .5 - 50, b.y - a.y], scale: [1, (1 + scale) / 2, scale], rotate: [0, -5, 0] }, { duration: .42, ease: [.3, .7, .3, 1] })
    .then(() => animate(el, { opacity: 0, scale: scale * 1.08 }, { type: 'spring', stiffness: 500, damping: 30 })).then(() => el.remove());
}

/** v9.18.1 pickpocket: a coin (with its amount) hops from one seat to another. */
export function flyCoin(from: Element | null, to: Element | null, label: string, delay = 0, tone: 'coin' | 'ghost' = 'coin') {
  if (!from || !to) return;
  // v9.18.4: measured when it starts; at settlement the cabin is still finishing its travel animation.
  window.setTimeout(() => flyCoinNow(from, to, label, tone), delay * 1000);
}
function flyCoinNow(from: Element, to: Element, label: string, tone: 'coin' | 'ghost') {
  const delay = 0, a = centre(from), b = centre(to), el = layer(tone === 'ghost' ? 'juice-coin juice-wisp' : 'juice-coin'); el.textContent = label;
  el.style.left = `${a.x}px`; el.style.top = `${a.y}px`;
  if (reduced()) { void animate(el, { opacity: [0, 1, 0] }, { duration: .9, delay }).then(() => el.remove()); return; }
  void animate(el, { x: [0, (b.x - a.x) * .5, b.x - a.x], y: [0, (b.y - a.y) * .5 - 46, b.y - a.y], scale: [.6, 1.15, .8], opacity: [0, 1, 1] }, { duration: .62, delay, ease: [.3, .7, .3, 1] })
    .then(() => animate(el, { opacity: 0, scale: .4 }, { duration: .18 })).then(() => el.remove());
}

/** A burst of particles at a point (gold for money, green for links, blue for calm, red for trouble). */
export function burst(x: number, y: number, tone: Tone = 'gold', count = 14, spread = 70) {
  if (reduced()) return;
  for (let i = 0; i < count; i++) {
    const p = layer(`juice-spark juice-${tone}`); p.style.left = `${x}px`; p.style.top = `${y}px`;
    const angle = (Math.PI * 2 * i) / count + Math.random() * .5, dist = spread * (.5 + Math.random() * .7);
    p.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist + 18}px)) scale(.2)`, opacity: 0 },
    ], { duration: 520 + Math.random() * 260, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => p.remove();
  }
}
export function burstAt(el: Element | null, tone: Tone = 'gold', count = 14, spread = 70) {
  if (!el) return; const c = centre(el); burst(c.x, c.y, tone, count, spread);
}

/** A number or word that pops up and floats away (big payouts, "+1 calm"). */
/** v10.3 visible text on the page, for placing effects so they never sit on it. Other effects' words count too (a pop
 * must not land on another pop); the effect being placed is left out. */
type Box = { left: number; top: number; right: number; bottom: number };
const EFFECT_WORDS = '.juice-pop, .juice-bubble, .wallet-gain';
function textBoxes(self?: Element): Array<{ el: HTMLElement; r: Box }> {
  const out: Array<{ el: HTMLElement; r: Box }> = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const shown = new Map<Element, boolean>();
  // Text still fading in (a card being dealt, a payout appearing) counts: it will be there in a moment.
  const visible = (el: Element): boolean => { if (shown.has(el)) return shown.get(el)!; const cs = getComputedStyle(el); const v: boolean = cs.visibility !== 'hidden' && cs.display !== 'none' && (!el.parentElement || el.parentElement === document.body || visible(el.parentElement)); shown.set(el, v); return v; };
  while (walker.nextNode()) {
    const t = walker.currentNode, el = t.parentElement;
    if (!t.textContent?.trim() || !el || (self && self.contains(el)) || el.closest('.sr-only,script,style,[role="tooltip"],.slot-number,.chain-hud,.juice-banner') || (el.closest('.juice') && !el.closest(EFFECT_WORDS)) || !visible(el)) continue;
    const range = document.createRange(); range.selectNodeContents(t);
    // Words in a small chip (a link label, a badge) take the whole chip: its icon and padding are part of what it says.
    const box = el.getBoundingClientRect();
    for (const q of range.getClientRects()) if (q.width > 2 && q.height > 4 && q.bottom > 0 && q.top < innerHeight) out.push({ el, r: box.width * box.height <= 4 * q.width * q.height ? box : q });
  }
  return out;
}
const covered = (r: Box, b: Box) => Math.max(0, Math.min(r.right, b.right) - Math.max(r.left, b.left)) * Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top));
/** An effect's resting box: its centre (scale animations keep it) and its layout size, so an entrance scale does not
 * make it look smaller than it will be. */
function restingBox(el: HTMLElement): Box {
  const r = el.getBoundingClientRect(), cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2, w = el.offsetWidth || r.width, h = el.offsetHeight || r.height;
  return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 };
}
/** Text under `cover` steps aside (hidden) for `ms`, then returns: an announcement takes the spot for a moment instead of
 * sitting on top of what is there. It keeps looking while it is up, so a rider boarded under it steps aside too. */
/** Watches the words under `cover` until it leaves (or `until`): `hit` is told about each word it covers (return true to
 * stop). The words are collected once and again only when the page changes (not counting the effects' own changes);
 * each frame just re-measures them, because cards also slide under without any DOM change (the arrival settle). */
function watchUnder(cover: HTMLElement, until: number, hit: (el: HTMLElement) => boolean, opts: { pad?: number; extra?: () => boolean; end?: () => void } = {}) {
  let done = false, candidates: HTMLElement[] = [], stale = true;
  const pad = opts.pad ?? 0;
  const stop = () => { if (done) return; done = true; observer.disconnect(); opts.end?.(); };
  const scan = () => {
    if (done) return;
    if (!cover.isConnected || performance.now() > until) { stop(); return; }
    if (stale) { candidates = [...new Set(textBoxes(cover).map(x => x.el))]; stale = false; }
    const c = restingBox(cover), b = { left: c.left - pad, right: c.right + pad, top: c.top - pad, bottom: c.bottom + pad };
    if (opts.extra?.()) { stop(); return; }
    for (const el of candidates) { const q = el.getBoundingClientRect(); if (q.width && covered(q, b) > .05 * q.width * q.height && hit(el)) { stop(); return; } }
  };
  const own = (n: Node) => { const e = n instanceof Element ? n : n.parentElement; return Boolean(e?.closest('.juice, .chain-hud, .coin-flight')); };
  const observer = new MutationObserver(records => { if (records.every(r => own(r.target) || [...r.addedNodes, ...r.removedNodes].length && [...r.addedNodes, ...r.removedNodes].every(own))) return; stale = true; scan(); });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
  const tick = () => { if (done) return; scan(); if (!done) requestAnimationFrame(tick); };
  tick();
}
/** Text under `cover` steps aside (hidden) while it is up, then returns: an announcement takes the spot for a moment
 * instead of sitting on top of what is there. It lasts as long as the cover does, with `ms` (+ a margin) as a safety stop. */
export function yieldUnder(cover: HTMLElement, ms: number) {
  const hidden = new Set<HTMLElement>();
  watchUnder(cover, performance.now() + ms + 600, el => { if (!hidden.has(el)) { el.style.visibility = 'hidden'; hidden.add(el); } return false; },
    { end: () => hidden.forEach(e => { e.style.visibility = ''; }) });
}
/** Boxes of the announcements (banners, the chain card, the cabin message) that a pop must not sit under. */
const announcementBoxes = (): Box[] => [...document.querySelectorAll<HTMLElement>('.juice-banner, .chain-hud, .cabin-feedback')].filter(e => getComputedStyle(e).visibility !== 'hidden').map(restingBox);

/** A number or word that pops up and floats away (big payouts, "+1 calm"). v10.3: it is placed once the floor's cards
 * have rendered, on the first spot around its anchor (centre, top, above, below, right, left, then wrapped inside the
 * anchor's portrait) where it covers no text; with none free, the text under it steps aside. */
export function popText(el: Element | null, text: string, tone: Tone = 'gold', big = false) {
  if (!el) return;
  requestAnimationFrame(() => requestAnimationFrame(() => popTextNow(el, text, tone, big)));
}
function popTextNow(el: Element, text: string, tone: Tone, big: boolean) {
  if (!el.isConnected) return;
  const a = el.getBoundingClientRect(), t = layer(`juice-pop juice-${tone} ${big ? 'is-big' : ''}`); t.textContent = text;
  t.style.left = '0px'; t.style.top = '0px'; t.style.visibility = 'hidden';
  if (el.closest('[role="dialog"]')) t.classList.add('in-dialog');
  const rise = 16, texts = [...textBoxes(t), ...announcementBoxes().map(r => ({ el: t, r }))];
  const fits = (x: number, y: number, w: number, h: number) => x - w / 2 > 2 && x + w / 2 < innerWidth - 2 && y - h / 2 - rise > 2 && y + h / 2 < innerHeight - 2;
  // 4px of air all round: the spring entrance overshoots a little, and touching words read as one.
  const clear = (x: number, y: number, w: number, h: number) => !texts.some(({ r }) => covered(r, { left: x - w / 2 - 4, right: x + w / 2 + 4, top: y - h / 2 - rise - 4, bottom: y + h / 2 + 4 }) > 0);
  let { width: w, height: h } = t.getBoundingClientRect();
  const cx = a.left + a.width / 2, cy = a.top + a.height / 2;
  let spot = [[cx, cy], [cx, a.top + h * .9], [cx, a.top - h / 2 - 6], [cx, a.bottom + h / 2 + 4], [a.right + w / 2 + 8, cy], [a.left - w / 2 - 8, cy]].find(([x, y]) => fits(x, y, w, h) && clear(x, y, w, h));
  if (!spot) {
    // A small card: wrap the words inside its portrait.
    const art = ['.arrival-portrait .portrait-large', '.sp-art', '.tcg-art', '.seat-art'].map(q => el.querySelector(q)).find(e => e && e.getBoundingClientRect().width > 30)?.getBoundingClientRect();
    if (art) {
      t.classList.add('is-wrapped'); t.style.maxWidth = `${art.width - 10}px`; ({ width: w, height: h } = t.getBoundingClientRect());
      const p = [art.left + art.width / 2, art.top + art.height * .45];
      if (fits(p[0], p[1], w, h) && clear(p[0], p[1], w, h)) spot = p; else { t.classList.remove('is-wrapped'); t.style.maxWidth = ''; ({ width: w, height: h } = t.getBoundingClientRect()); }
    }
  }
  const [x, y] = spot ?? [cx, cy];
  t.style.left = `${x}px`; t.style.top = `${y}px`; t.style.transform = 'translate(-50%,-50%)'; t.style.visibility = '';
  if (!spot) yieldUnder(t, big ? 1800 : 1300);
  // A pop is decoration: when something lands under it later (the arrival strip, new offers, a banner), it leaves early.
  else {
    const leave = () => { t.getAnimations().forEach(a => a.cancel()); void animate(t, { opacity: 0 }, { duration: .12 }).then(() => t.remove()); return true; };
    const announced = () => { const c = restingBox(t); return announcementBoxes().some(r => covered(r, c) > 0) && leave(); };
    watchUnder(t, performance.now() + 4000, leave, { pad: 2, extra: announced });
  }
  if (reduced()) { void animate(t, { opacity: [1, 1, 0] }, { duration: big ? 1.4 : 1 }).then(() => t.remove()); return; }
  const inner = document.createElement('span'); inner.textContent = t.textContent; t.textContent = ''; t.appendChild(inner); inner.style.display = 'inline-block';
  void animate(inner, { scale: [.3, 1], y: [0, -6] }, { type: 'spring', stiffness: 520, damping: 14 })
    .then(() => animate(inner, { y: -rise, opacity: 0 }, { duration: big ? .9 : .6, ease: 'easeIn', delay: big ? .5 : .25 })).then(() => t.remove());
}

/** v10.3 a gain or loss landing in the wallet. It used to float over the wallet's own digits and labels; it now takes
 * the place of the wallet's "next floor" line for a moment (that line is stale while the floor settles anyway), so it
 * never sits on other text. */
export function walletGain(text: string, tone: Tone = 'gold', big = false) {
  const card = document.querySelector<HTMLElement>('[data-metric="coins"]'), line = card?.querySelector<HTMLElement>('.wallet-forecast');
  if (!card || !line || !line.getClientRects().length) return;
  { const q = line.getBoundingClientRect(); if (q.top < 0 || q.bottom > innerHeight) return; }
  document.querySelectorAll('.wallet-gain').forEach(el => el.remove());
  const r = line.getBoundingClientRect(), el = layer(`wallet-gain juice-${tone} ${big ? 'is-big' : ''}`); el.textContent = text;
  el.style.left = `${r.left}px`; el.style.top = `${r.top}px`; el.style.width = `${r.width}px`; el.style.height = `${r.height}px`;
  card.classList.add('is-gaining');
  let alive = true;
  const done = () => { alive = false; el.remove(); if (!document.querySelector('.wallet-gain')) card.classList.remove('is-gaining'); };
  // The line moves or goes away when the floor changes under it (a quick departure): follow it, and leave with it.
  const follow = () => { if (!alive) return; const q = line.isConnected ? line.getBoundingClientRect() : null; if (!q || !q.width || !q.height) { done(); return; }
    el.style.left = `${q.left}px`; el.style.top = `${q.top}px`; el.style.width = `${q.width}px`; el.style.height = `${q.height}px`; requestAnimationFrame(follow); };
  requestAnimationFrame(follow);
  if (reduced()) { window.setTimeout(done, 1400); return; }
  void animate(el, { scale: [.4, 1], opacity: [0, 1] }, { type: 'spring', stiffness: 520, damping: 16 })
    .then(() => animate(el, { opacity: 0 }, { duration: .35, delay: big ? 1.1 : .8 })).then(done);
}

/** A full-width banner across the cabin: close calls, new records, district title cards. */
let bannerFreeAt = 0;
export function banner(anchor: Element | null, title: string, sub: string, tone: 'gold' | 'red' | 'district' | 'midnight' = 'gold', ms = 1900) {
  if (!anchor) return;
  // v10.3: banners take turns (the midnight bell and a district title used to land on the same floor, one over the other).
  const wait = bannerFreeAt - performance.now();
  if (wait > 0) { bannerFreeAt += ms + 120; window.setTimeout(() => showBanner(anchor, title, sub, tone, ms), wait + 120); return; }
  bannerFreeAt = performance.now() + ms;
  showBanner(anchor, title, sub, tone, ms);
}
function showBanner(anchor: Element, title: string, sub: string, tone: 'gold' | 'red' | 'district' | 'midnight', ms: number) {
  if (!anchor.isConnected) return;
  const c = centre(anchor), el = layer(`juice-banner juice-banner-${tone}`);
  el.innerHTML = '';
  const h = document.createElement('strong'); h.textContent = title; el.appendChild(h);
  if (sub) { const s = document.createElement('span'); s.textContent = sub; el.appendChild(s); }
  // v9.19.1: on phones the cabin can be scrolled out of view (the midnight bell rang below the fold); keep the banner
  // on screen by clamping it into the viewport.
  const y = Math.min(Math.max(c.y - c.h * .12, 90), window.innerHeight - 90);
  el.style.left = `${Math.min(Math.max(c.x, 60), window.innerWidth - 60)}px`; el.style.top = `${y}px`; el.style.width = `${Math.min(c.w * .92, 620, window.innerWidth - 24)}px`;
  const frames = reduced() ? [{ opacity: 1 }, { opacity: 1, offset: .85 }, { opacity: 0 }] : [
    // v10.3: no letter-spacing sweep: wide letters re-wrapped the subtitle and made the banner briefly taller than the
    // space it had cleared.
    { transform: 'translate(-50%,-50%) scaleX(.2)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scaleX(1.04)', opacity: 1, offset: .14 },
    { transform: 'translate(-50%,-50%) scaleX(1)', opacity: 1, offset: .22 },
    { transform: 'translate(-50%,-50%) scaleX(1)', opacity: 1, offset: .82 },
    { transform: 'translate(-50%,-50%) scaleX(1)', opacity: 0 },
  ];
  // v10.3: what the banner covers steps aside while it is up (measured before the entrance transform).
  yieldUnder(el, ms);
  el.animate(frames, { duration: ms, easing: 'ease-out' }).onfinish = () => el.remove();
}

/** A speech bubble above a rider (boarding or getting off). */
export function bubble(anchor: Element | null, text: string, ms = 1700) {
  if (!anchor) return;
  // v10.3: the quip comes out of the speaker's own portrait (below the symbol gems on its top corners). Above the card it
  // sat on the card overhead, the floor indicator or the cabin messages.
  const art = ['.arrival-portrait .portrait-large', '.sp-art', '.tcg-art', '.seat-art'].map(q => anchor.querySelector(q)).find(e => e && e.getBoundingClientRect().width > 20);
  const r = (art ?? anchor).getBoundingClientRect(), el = layer('juice-bubble'); el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`; el.style.top = `${r.top + Math.max(24, r.height * .16)}px`; el.style.maxWidth = `${Math.max(80, Math.min(180, r.width - 8))}px`;
  // An exit card also shows the rider's name and payout: the quip only goes in the gap between them, or not at all.
  const name = anchor.querySelector('.arrival-name')?.getBoundingClientRect(), payout = anchor.querySelector('.arrival-payout, .arrival-payout-incident')?.getBoundingClientRect();
  if (name && payout) {
    const h = el.getBoundingClientRect().height, gap = payout.top - name.bottom;
    // The payout rises 22px as it fades out; leave it that room.
    if (gap < h + 28) { el.remove(); return; }
    el.style.top = `${name.bottom + 3}px`;
  }
  // A quip is flavour: wherever it would sit on any words (a card's own, another effect's), it stays unsaid.
  { const b = el.getBoundingClientRect(), box = { left: b.left - b.width / 2, right: b.left + b.width / 2, top: b.top, bottom: b.bottom };
    if (textBoxes(el).some(({ r }) => covered(r, box) > 0)) { el.remove(); return; } }
  el.animate(reduced() ? [{ opacity: 1 }, { opacity: 1, offset: .85 }, { opacity: 0 }] : [
    { transform: 'translate(-50%,10%) scale(.6)', opacity: 0 },
    { transform: 'translate(-50%,0) scale(1.05)', opacity: 1, offset: .12 },
    { transform: 'translate(-50%,0) scale(1)', opacity: 1, offset: .85 },
    { transform: 'translate(-50%,-20%) scale(.96)', opacity: 0 },
  ], { duration: ms, easing: 'ease-out' }).onfinish = () => el.remove();
}

/** Briefly add a class (cabin pulses, wallet bumps); restarts cleanly when retriggered. */
export function flashClass(el: Element | null, className: string, ms = 700) {
  if (!el || reduced()) return;
  el.classList.remove(className); void (el as HTMLElement).offsetWidth; el.classList.add(className);
  window.setTimeout(() => el.classList.remove(className), ms);
}

/** v9.18.2 bomb explosion: white flash, two shockwave rings, fire and gold sparks, and flying debris. */
export function explode(anchor: Element | null) {
  if (!anchor) return;
  const c = centre(anchor);
  const flash = layer('juice-explode-flash'); flash.style.left = `${c.x}px`; flash.style.top = `${c.y}px`;
  if (reduced()) { void animate(flash, { opacity: [0, .9, 0] }, { duration: 1.2 }).then(() => flash.remove()); return; }
  void animate(flash, { opacity: [0, 1, 0], scale: [.2, 2.4, 3] }, { duration: .9, ease: 'easeOut' }).then(() => flash.remove());
  [0, .14].forEach(delay => {
    const ring = layer('juice-shockwave'); ring.style.left = `${c.x}px`; ring.style.top = `${c.y}px`;
    void animate(ring, { scale: [.1, 6], opacity: [.95, 0] }, { duration: 1, delay, ease: [.2, .8, .3, 1] }).then(() => ring.remove());
  });
  burst(c.x, c.y, 'red', 26, 190); burst(c.x, c.y, 'gold', 22, 150);
  window.setTimeout(() => burst(c.x, c.y, 'red', 18, 240), 160);
  for (let i = 0; i < 14; i++) {
    const bit = layer('juice-debris'); bit.style.left = `${c.x}px`; bit.style.top = `${c.y}px`;
    const angle = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 220;
    void animate(bit, { x: [0, Math.cos(angle) * dist], y: [0, Math.sin(angle) * dist + 90], rotate: [0, (Math.random() - .5) * 720], opacity: [1, 1, 0] }, { duration: 1.1 + Math.random() * .5, ease: [.2, .7, .5, 1] }).then(() => bit.remove());
  }
}

/** v9.18.3 box opening, played where the box sat: the box pops up and shakes, its lid flies off, sparks burst and
 * what was inside rises out of it. `label` is the contents ("+12 金币", "+4 电", an ability, "零件"). */
export function openBoxFx(anchor: Element | null, src: string, label: string, tone: Tone = 'gold', delay = 0) {
  if (!anchor) return;
  // Measured when it starts: at settlement the cabin is still finishing its travel animation.
  window.setTimeout(() => openBoxNow(anchor, src, label, tone), delay * 1000);
}
function openBoxNow(anchor: Element, src: string, label: string, tone: Tone) {
  const delay = 0, c = centre(anchor), size = Math.round(Math.max(56, Math.min(120, Math.min(c.w, c.h) * .62)));
  const box = layer('juice-box'); box.style.left = `${c.x - size / 2}px`; box.style.top = `${c.y - size / 2}px`; box.style.width = box.style.height = `${size}px`;
  const body = document.createElement('span'), lid = document.createElement('span');
  body.className = 'juice-box-body'; lid.className = 'juice-box-lid';
  for (const part of [body, lid]) { part.style.backgroundImage = `url(${src})`; part.style.backgroundSize = `${size}px ${size}px`; box.appendChild(part); }
  const reveal = () => { burst(c.x, c.y - size * .25, tone, 18, 90); if (label) popText(anchor, label, tone, true); };
  if (reduced()) { void animate(box, { opacity: [0, 1, 1, 0] }, { duration: 1.1, delay }).then(() => box.remove()); window.setTimeout(reveal, (delay + .3) * 1000); return; }
  void animate(box, { scale: [.4, 1.14, 1, 1.05, .92], rotate: [0, -9, 8, -4, 0], opacity: [0, 1, 1, 1, 0] }, { duration: 1.25, delay, times: [0, .18, .36, .5, 1] }).then(() => box.remove());
  void animate(lid, { y: [0, 0, -size * .95], rotate: [0, 0, -38], opacity: [1, 1, 0] }, { duration: .85, delay: delay + .3, times: [0, .15, 1], ease: 'easeOut' });
  window.setTimeout(reveal, (delay + .45) * 1000);
}

export function clearJuice() { bannerFreeAt = 0; document.querySelectorAll('.juice').forEach(el => el.remove()); }
