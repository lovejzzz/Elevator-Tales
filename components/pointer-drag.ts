// v9.12 pointer drag: replaces native HTML5 drag-and-drop for riders. A small portrait ghost follows the pointer
// (moved with transforms in requestAnimationFrame, no React work per move), then springs into the target seat
// or back to where it came from. Touch keeps tap-to-place, so page scrolling is never hijacked.
import { animate } from 'motion';

export type DropTarget = { slot: number } | { offers: true };
type Options = {
  source: HTMLElement;
  imageSrc: string;
  onStart: () => void;
  onTarget: (target: DropTarget | null) => void;
  /** Returns true when the drop was accepted. */
  onDrop: (target: DropTarget | null) => boolean;
  onEnd: () => void;
};
const THRESHOLD = 6, SIZE = 84;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function dropTargetAt(x: number, y: number): DropTarget | null {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.closest('.juice-drag')) continue;
    const slot = el.closest('.standing-slot');
    if (slot) { const i = [...document.querySelectorAll('.standing-slot')].indexOf(slot); if (i >= 0) return { slot: i }; }
    if (el.closest('.candidate-panel')) return { offers: true };
  }
  return null;
}
const same = (a: DropTarget | null, b: DropTarget | null) => JSON.stringify(a) === JSON.stringify(b);
const targetRect = (t: DropTarget | null) => (t && 'slot' in t ? document.querySelectorAll('.standing-slot')[t.slot]?.getBoundingClientRect() ?? null : null);

/** Call from onPointerDown. Does nothing for touch or non-primary buttons. */
export function beginPointerDrag(event: PointerEvent, opts: Options) {
  if (event.pointerType === 'touch' || event.button !== 0) return;
  const startX = event.clientX, startY = event.clientY;
  let ghost: HTMLDivElement | null = null, x = startX, y = startY, frame = 0, target: DropTarget | null = null;
  const place = () => { frame = 0; if (ghost) ghost.style.transform = `translate(${x - SIZE / 2}px, ${y - SIZE / 2}px) rotate(-4deg) scale(1.06)`; };
  const move = (e: PointerEvent) => {
    x = e.clientX; y = e.clientY;
    if (!ghost) {
      if (Math.hypot(x - startX, y - startY) < THRESHOLD) return;
      ghost = document.createElement('div'); ghost.className = 'juice juice-drag'; ghost.setAttribute('aria-hidden', 'true');
      ghost.style.backgroundImage = `url(${opts.imageSrc})`; ghost.style.width = ghost.style.height = `${SIZE}px`;
      document.body.appendChild(ghost); opts.source.classList.add('is-drag-source'); document.body.classList.add('is-dragging');
      opts.onStart();
    }
    const next = dropTargetAt(x, y); if (!same(next, target)) { target = next; opts.onTarget(target); }
    if (!frame) frame = requestAnimationFrame(place);
  };
  const up = () => {
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    if (!ghost) return;
    if (frame) cancelAnimationFrame(frame);
    // The press ended a drag, not a click: swallow the click that follows.
    window.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); }, { capture: true, once: true });
    const g = ghost, accepted = opts.onDrop(target);
    const dest = accepted ? targetRect(target) : opts.source.getBoundingClientRect();
    opts.source.classList.remove('is-drag-source'); document.body.classList.remove('is-dragging'); opts.onEnd();
    if (!dest || reduced()) { g.remove(); return; }
    const tx = dest.left + dest.width / 2 - SIZE / 2, ty = dest.top + dest.height / 2 - SIZE / 2;
    void animate(g, { transform: `translate(${tx}px, ${ty}px) rotate(0deg) scale(${accepted ? 1.15 : .9})`, opacity: accepted ? 0 : .2 }, { type: 'spring', stiffness: 420, damping: 32 }).then(() => g.remove());
  };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
}
