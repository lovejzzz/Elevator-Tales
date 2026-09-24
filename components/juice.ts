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
export function popText(el: Element | null, text: string, tone: Tone = 'gold', big = false) {
  if (!el) return;
  const c = centre(el), t = layer(`juice-pop juice-${tone} ${big ? 'is-big' : ''}`); t.textContent = text; t.style.left = `${c.x}px`; t.style.top = `${c.y}px`;
  t.style.transform = 'translate(-50%,-50%)';
  if (reduced()) { void animate(t, { opacity: [1, 1, 0] }, { duration: big ? 1.4 : 1 }).then(() => t.remove()); return; }
  const inner = document.createElement('span'); inner.textContent = t.textContent; t.textContent = ''; t.appendChild(inner); inner.style.display = 'inline-block';
  void animate(inner, { scale: [.3, 1] , y: [0, -18] }, { type: 'spring', stiffness: 520, damping: 14 })
    .then(() => animate(inner, { y: -46, opacity: 0 }, { duration: big ? .9 : .6, ease: 'easeIn', delay: big ? .5 : .25 })).then(() => t.remove());
}

/** A full-width banner across the cabin: close calls, new records, district title cards. */
export function banner(anchor: Element | null, title: string, sub: string, tone: 'gold' | 'red' | 'district' | 'midnight' = 'gold', ms = 1900) {
  if (!anchor) return;
  const c = centre(anchor), el = layer(`juice-banner juice-banner-${tone}`);
  el.innerHTML = '';
  const h = document.createElement('strong'); h.textContent = title; el.appendChild(h);
  if (sub) { const s = document.createElement('span'); s.textContent = sub; el.appendChild(s); }
  el.style.left = `${c.x}px`; el.style.top = `${c.y - c.h * .12}px`; el.style.width = `${Math.min(c.w * .92, 620)}px`;
  const frames = reduced() ? [{ opacity: 1 }, { opacity: 1, offset: .85 }, { opacity: 0 }] : [
    { transform: 'translate(-50%,-50%) scaleX(.2)', opacity: 0, letterSpacing: '.4em' },
    { transform: 'translate(-50%,-50%) scaleX(1.04)', opacity: 1, offset: .14 },
    { transform: 'translate(-50%,-50%) scaleX(1)', opacity: 1, offset: .22, letterSpacing: '.06em' },
    { transform: 'translate(-50%,-50%) scaleX(1)', opacity: 1, offset: .82 },
    { transform: 'translate(-50%,-60%) scaleX(1)', opacity: 0 },
  ];
  el.animate(frames, { duration: ms, easing: 'ease-out' }).onfinish = () => el.remove();
}

/** A speech bubble above a rider (boarding or getting off). */
export function bubble(anchor: Element | null, text: string, ms = 1700) {
  if (!anchor) return;
  const r = anchor.getBoundingClientRect(), el = layer('juice-bubble'); el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`; el.style.top = `${r.top + 6}px`;
  el.animate(reduced() ? [{ opacity: 1 }, { opacity: 1, offset: .85 }, { opacity: 0 }] : [
    { transform: 'translate(-50%,-80%) scale(.6)', opacity: 0 },
    { transform: 'translate(-50%,-110%) scale(1.05)', opacity: 1, offset: .12 },
    { transform: 'translate(-50%,-110%) scale(1)', opacity: 1, offset: .85 },
    { transform: 'translate(-50%,-130%) scale(.96)', opacity: 0 },
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

export function clearJuice() { document.querySelectorAll('.juice').forEach(el => el.remove()); }
