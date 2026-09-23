// v9.8 juice: decorative DOM effects (fly-ins, particle bursts, pop numbers, banners, speech bubbles).
// Each effect creates short-lived elements on <body> and removes them when its animation ends.
// Motion is skipped under prefers-reduced-motion; banners and bubbles still appear, without movement.

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
  el.animate([
    { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
    { transform: `translate(${(b.x - a.x) * .5}px, ${(b.y - a.y) * .5 - 60}px) scale(${(1 + scale) / 2}) rotate(-6deg)`, opacity: 1, offset: .55 },
    { transform: `translate(${b.x - a.x}px, ${b.y - a.y}px) scale(${scale}) rotate(0deg)`, opacity: 0 },
  ], { duration: 360, easing: 'cubic-bezier(.3,.7,.3,1)' }).onfinish = () => el.remove();
}

/** A burst of particles at a point (gold for money, green for links, blue for calm, red for trouble). */
export function burst(x: number, y: number, tone: 'gold' | 'green' | 'blue' | 'red' = 'gold', count = 14, spread = 70) {
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
export function burstAt(el: Element | null, tone: 'gold' | 'green' | 'blue' | 'red' = 'gold', count = 14, spread = 70) {
  if (!el) return; const c = centre(el); burst(c.x, c.y, tone, count, spread);
}

/** A number or word that pops up and floats away (big payouts, "+1 calm"). */
export function popText(el: Element | null, text: string, tone: 'gold' | 'green' | 'blue' | 'red' = 'gold', big = false) {
  if (!el) return;
  const c = centre(el), t = layer(`juice-pop juice-${tone} ${big ? 'is-big' : ''}`); t.textContent = text; t.style.left = `${c.x}px`; t.style.top = `${c.y}px`;
  const move = reduced() ? [{ opacity: 1 }, { opacity: 0 }] : [
    { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
    { transform: 'translate(-50%,-90%) scale(1.25)', opacity: 1, offset: .25 },
    { transform: 'translate(-50%,-110%) scale(1)', opacity: 1, offset: .7 },
    { transform: 'translate(-50%,-160%) scale(.9)', opacity: 0 },
  ];
  t.animate(move, { duration: big ? 1400 : 1000, easing: 'ease-out' }).onfinish = () => t.remove();
}

/** A full-width banner across the cabin: close calls, new records, district title cards. */
export function banner(anchor: Element | null, title: string, sub: string, tone: 'gold' | 'red' | 'district' = 'gold', ms = 1900) {
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

export function clearJuice() { document.querySelectorAll('.juice').forEach(el => el.remove()); }
