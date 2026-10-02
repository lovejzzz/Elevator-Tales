'use client';
// pixi-fx experiment: a WebGL layer that lights the cabin. Two canvases sit inside the elevator stage:
// `back` (above the cabin art, under the cards): the ceiling lamp's cone, dust in the light, passing floors while moving;
// `front` (above the cards, under the link labels, screen-blended so it only adds light): link beams and arcs, bursts,
// and the red glow of a cabin about to boil over. Game state comes in through props; the DOM stays the source of layout.
import { useEffect, useRef } from 'react';
import type { Rider } from '@/lib/game-engine';
import { chainMultiplier, symbolEdges, type SymbolKey } from '@/lib/symbols';
import { CHAIN_TIMING, chainTier, hopAt, payoffAt, type ChainShowData } from './chain-show';

export type CabinFxState = {
  cabin: Array<Rider | null>;
  floor: number;
  doors: string;
  stress: number;
  stressCap: number;
  /** 0–1 share of the power cap. */
  energy: number;
  powerLow: boolean;
  powerFatal: boolean;
  midnight: boolean;
  abyss: boolean;
  /** v10.3 the chain cash-in to play (keyed by the floor it paid on), or null. */
  chain: (ChainShowData & { key: number }) | null;
};

const SYMBOL_COLOR: Record<SymbolKey, number> = { lively: 0xf0a040, quiet: 0x7ab4f0, order: 0xe6c27a, street: 0xb58ae6, hearth: 0x8fd18f, spirit: 0x7fd6d0 };
const HIGH_AGITATION = 5;
type Rect = { x: number; y: number; w: number; h: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: number; size: number };

/** A soft round dot or glow, drawn once on a 2D canvas and used as a texture. */
function radialCanvas(size: number, stops: Array<[number, string]>) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d')!, grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, color] of stops) grad.addColorStop(at, color);
  g.fillStyle = grad; g.fillRect(0, 0, size, size);
  return c;
}

export function CabinFx({ layer, state }: { layer: 'back' | 'front'; state: CabinFxState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  // The ticker reads the latest game state; it is copied after each render, not during it.
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current, stage = canvas?.closest<HTMLElement>('.elevator-stage');
    if (!canvas || !stage) return;
    let disposed = false, destroy = () => {};
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    void (async () => {
      const PIXI = await import('pixi.js');
      if (disposed) return;
      const app = new PIXI.Application();
      // No WebGL (old devices, blocked GPU): stay silent and keep the SVG links.
      try { await app.init({ canvas, backgroundAlpha: 0, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true, resizeTo: stage, preference: 'webgl' }); } catch { return; }
      if (disposed) { app.destroy(); return; }
      // Only once WebGL is really drawing do the SVG link lines step aside (without WebGL they stay as the fallback).
      if (layer === 'front') stage.dataset.fx = 'on';
      if (process.env.NODE_ENV !== 'production') (window as unknown as Record<string, unknown>)[`__fx_${layer}`] = app;
      const dot = PIXI.Texture.from(radialCanvas(64, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]));
      const glow = PIXI.Texture.from(radialCanvas(256, [[0, 'rgba(255,255,255,.9)'], [0.45, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]));
      const W = () => app.screen.width, H = () => app.screen.height;

      // Card rectangles in stage coordinates, re-measured a few times a second (layout changes with the viewport).
      let slots: Array<Rect | null> = [];
      const measure = () => {
        // Client rects include any CSS transform on the stage; divide it out so cards and canvas share one space.
        const s = stage.getBoundingClientRect(), k = stage.offsetWidth ? s.width / stage.offsetWidth : 1;
        const els = [...stage.querySelectorAll<HTMLElement>('.standing-grid:not(.link-label-layer) .standing-slot')].slice(0, 6);
        slots = els.map(el => { const r = el.getBoundingClientRect(); return r.width ? { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k } : null; });
      };
      measure();
      let measureClock = 0;

      const sparks: Spark[] = [];
      const sparkLayer = new PIXI.Container();
      const sparkSprites: InstanceType<typeof PIXI.Sprite>[] = [];
      const burst = (x: number, y: number, color: number, count: number, speed: number, size = 1) => {
        for (let i = 0; i < (reduced ? Math.ceil(count / 4) : count); i++) {
          const a = Math.random() * Math.PI * 2, v = speed * (0.35 + Math.random() * 0.9);
          sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.4, life: 0, max: 0.6 + Math.random() * 0.8, color, size: size * (0.5 + Math.random()) });
        }
      };
      const drawSparks = (dt: number) => {
        for (let i = sparks.length - 1; i >= 0; i--) { const p = sparks[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.vx *= 0.985; if (p.life >= p.max) sparks.splice(i, 1); }
        while (sparkSprites.length < sparks.length) { const sp = new PIXI.Sprite(dot); sp.anchor.set(0.5); sp.blendMode = 'add'; sparkLayer.addChild(sp); sparkSprites.push(sp); }
        sparkSprites.forEach((sp, i) => { const p = sparks[i]; sp.visible = Boolean(p); if (!p) return; sp.position.set(p.x, p.y); sp.tint = p.color; const t = p.life / p.max; sp.alpha = (1 - t) * (1 - t); sp.scale.set(0.16 * p.size * (1 - t * 0.5)); });
      };

      let time = 0;
      if (layer === 'back') {
        // The lamp: a tall warm cone from the ceiling, a hot core under the dome, and a pool of light on the floor.
        const cone = new PIXI.Graphics(), pool = new PIXI.Sprite(glow), core = new PIXI.Sprite(glow);
        cone.blendMode = 'add'; pool.blendMode = 'add'; core.blendMode = 'add';
        pool.anchor.set(0.5); core.anchor.set(0.5);
        const coneBlur = new PIXI.BlurFilter({ strength: 18, quality: 3 });
        cone.filters = [coneBlur];
        const shade = new PIXI.Graphics();
        const dust = Array.from({ length: reduced ? 24 : 90 }, () => ({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 1.2, sway: Math.random() * Math.PI * 2, speed: 0.004 + Math.random() * 0.012 }));
        const dustLayer = new PIXI.Container(), dustSprites = dust.map(() => { const sp = new PIXI.Sprite(dot); sp.anchor.set(0.5); sp.blendMode = 'add'; dustLayer.addChild(sp); return sp; });
        const bands = new PIXI.Graphics(); bands.blendMode = 'add'; bands.filters = [new PIXI.BlurFilter({ strength: 10 })];
        let bandOffset = 0, flicker = 1;
        app.stage.addChild(shade, cone, pool, core, dustLayer, bands);
        app.ticker.add(tick => {
          const dt = Math.min(0.05, tick.deltaMS / 1000); time += dt;
          const st = stateRef.current, w = W(), h = H(), ratio = Math.min(1, st.stress / Math.max(1, st.stressCap));
          const moving = st.doors === 'moving' || st.doors === 'closing';
          // Low power makes the lamp stutter; high agitation makes it jitter.
          const target = st.powerFatal ? (Math.random() < 0.18 ? 0.25 : 0.85) : st.powerLow ? (Math.random() < 0.07 ? 0.45 : 0.92) : 1;
          flicker += (target - flicker) * (reduced ? 0.05 : 0.35);
          const jitter = reduced ? 0 : (st.stress >= HIGH_AGITATION ? (Math.random() - 0.5) * 0.12 : 0);
          const lamp = Math.max(0.2, (0.55 + 0.45 * st.energy) * flicker + jitter) * (moving ? 0.78 : 1);
          const color = st.abyss ? 0xb592ff : st.midnight ? 0xa9c6ff : ratio > 0.6 ? 0xffb07a : 0xffd79a;
          shade.clear().rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0.18 + (1 - lamp) * 0.32 });
          const top = h * 0.07, spread = w * (0.2 + 0.04 * Math.sin(time * 0.4));
          cone.clear().poly([w / 2 - w * 0.05, top, w / 2 + w * 0.05, top, w / 2 + spread, h * 0.92, w / 2 - spread, h * 0.92]).fill({ color, alpha: 0.3 * lamp });
          core.position.set(w / 2, top + h * 0.03); core.width = w * 0.32; core.height = h * 0.18; core.tint = color; core.alpha = 0.85 * lamp;
          pool.position.set(w / 2, h * 0.9); pool.width = w * 0.75; pool.height = h * 0.16; pool.tint = color; pool.alpha = 0.32 * lamp;
          dust.forEach((d, i) => {
            d.y -= d.speed * dt * (moving ? -14 : 1); d.sway += dt * 0.6;
            if (d.y < 0) d.y += 1; if (d.y > 1) d.y -= 1;
            const x = w / 2 + (d.x - 0.5) * spread * 2 * (0.3 + d.y * 0.7) + Math.sin(d.sway) * 8, y = top + d.y * (h * 0.85);
            const inCone = 1 - Math.min(1, Math.abs(x - w / 2) / (spread * (0.3 + d.y * 0.7) + 1));
            const sp = dustSprites[i]; sp.position.set(x, y); sp.scale.set(0.05 * d.s); sp.tint = color;
            sp.alpha = inCone * lamp * (0.35 + 0.35 * Math.sin(time * 2 + i));
          });
          // While the car moves, lit floor slabs slide down past the cabin.
          bandOffset = (bandOffset + dt * (moving ? 2.4 : 0)) % 1;
          bands.clear();
          if (moving) for (let k = 0; k < 3; k++) { const y = ((bandOffset + k / 3) % 1) * h * 1.3 - h * 0.15; bands.rect(0, y, w, h * 0.035).fill({ color, alpha: 0.12 }); }
        });
      } else {
        // Front: beams for green links, arcs for red ones, bursts, and the red rim of a boiling cabin.
        const glowLayer = new PIXI.Container(), coreLayer = new PIXI.Container();
        glowLayer.filters = [new PIXI.BlurFilter({ strength: 7, quality: 3 })];
        const beamsGlow = new PIXI.Graphics(), beamsCore = new PIXI.Graphics(), arcsGlow = new PIXI.Graphics(), arcsCore = new PIXI.Graphics();
        glowLayer.addChild(beamsGlow, arcsGlow); coreLayer.addChild(beamsCore, arcsCore);
        const rim = new PIXI.Graphics(); rim.filters = [new PIXI.BlurFilter({ strength: 40, quality: 4 })];
        const flowLayer = new PIXI.Container(), flowSprites: InstanceType<typeof PIXI.Sprite>[] = [];
        // The lamp washes the top of the scene; each card catches a little light on its upper edge.
        const wash = new PIXI.Sprite(glow); wash.anchor.set(0.5, 0.15); wash.blendMode = 'add';
        const topLights = new PIXI.Graphics(); topLights.blendMode = 'add'; topLights.filters = [new PIXI.BlurFilter({ strength: 14, quality: 3 })];
        // Arrival choreography: on each new floor, light bands sweep down the car (it is rising past them),
        // then the lamp flashes like a bell and the stage settles.
        const travel = new PIXI.Graphics(); travel.blendMode = 'add'; travel.filters = [new PIXI.BlurFilter({ strength: 6, quality: 2 })];
        const ding = new PIXI.Sprite(glow); ding.anchor.set(0.5); ding.blendMode = 'add'; ding.alpha = 0;
        // v10.3 the chain cash-in: bolts jump card to card, each lit card burns in the chain's colour, and the payoff
        // goes off as a nova (with light rays from ×6).
        const chainGlow = new PIXI.Graphics(), chainCore = new PIXI.Graphics(), rays = new PIXI.Graphics();
        chainGlow.blendMode = 'add'; chainCore.blendMode = 'add'; rays.blendMode = 'add';
        chainGlow.filters = [new PIXI.BlurFilter({ strength: 10, quality: 3 })]; rays.filters = [new PIXI.BlurFilter({ strength: 6, quality: 2 })];
        const nova = new PIXI.Sprite(glow); nova.anchor.set(0.5); nova.blendMode = 'add'; nova.alpha = 0;
        app.stage.addChild(wash, topLights, rim, glowLayer, coreLayer, flowLayer, travel, ding, rays, chainGlow, chainCore, nova, sparkLayer);
        let chainAt = -10, chainKey = stateRef.current.chain?.key ?? null, chainShow: ChainShowData | null = null, chainFired = 0, boltClock = 0, boltSeed: number[] = [];
        let arriveAt = -10;
        let arcClock = 0, arcSeed: number[] = [];
        let prevIds: Array<string | null> = stateRef.current.cabin.map(r => r?.id ?? null), prevFloor = stateRef.current.floor;
        app.ticker.add(tick => {
          const dt = Math.min(0.05, tick.deltaMS / 1000); time += dt;
          measureClock -= dt; if (measureClock <= 0) { measure(); measureClock = 0.25; }
          const st = stateRef.current, w = W(), h = H(), ratio = Math.min(1, st.stress / Math.max(1, st.stressCap));
          // Riders who left on a new floor burst gold; riders who just boarded ring softly.
          const ids = st.cabin.map(r => r?.id ?? null);
          ids.forEach((id, i) => {
            const r = slots[i]; if (!r) return;
            const cx = r.x + r.w / 2, cy = r.y + r.h * 0.45;
            if (prevIds[i] && prevIds[i] !== id && st.floor > prevFloor) { burst(cx, cy, 0xffd27a, 46, 260, 1.2); burst(cx, cy, 0xfff3c4, 16, 120, 0.8); }
            else if (id && !prevIds[i]) burst(cx, r.y + r.h, 0xfff1d0, 18, 90, 0.7);
          });
          // React owns the stage's className, so the settle animation is keyed on a data attribute it never touches.
          if (st.floor > prevFloor && !reduced) { arriveAt = time; delete stage.dataset.fxArrive; void stage.offsetWidth; stage.dataset.fxArrive = String(st.floor); }
          prevIds = ids; prevFloor = st.floor;
          const since = time - arriveAt;
          travel.clear();
          if (since < 0.45) {
            const k = since / 0.45, fade = Math.sin(Math.PI * Math.min(1, k * 1.1));
            for (let b = 0; b < 5; b++) { const y = ((k * 2.2 + b / 5) % 1) * h * 1.2 - h * 0.1; travel.rect(0, y, w, 3 + b % 2 * 2).fill({ color: 0xffe2a8, alpha: 0.22 * fade }); }
          }
          const dingK = since - 0.32;
          ding.position.set(w / 2, h * 0.11); ding.width = w * 0.9; ding.height = h * 0.5; ding.tint = 0xfff0c8;
          ding.alpha = dingK > 0 && dingK < 0.7 ? 0.75 * Math.exp(-dingK * 5) : 0;

          const edges = symbolEdges(st.cabin);
          const lampColor = st.abyss ? 0xb592ff : st.midnight ? 0xa9c6ff : 0xffd79a;
          wash.position.set(w / 2, 0); wash.width = w * 1.15; wash.height = h * 1.1; wash.tint = lampColor; wash.alpha = 0.07 + 0.06 * st.energy;
          topLights.clear();
          slots.forEach((r, i) => { if (!r || !st.cabin[i]) return; topLights.ellipse(r.x + r.w / 2, r.y + 4, r.w * 0.42, 10).fill({ color: lampColor, alpha: 0.28 }); });
          // A link is a bridge: the two facing card edges light up and a beam crosses the gap between them.
          type Bridge = { ax1: number; ay1: number; ax2: number; ay2: number; bx1: number; by1: number; bx2: number; by2: number; x1: number; y1: number; x2: number; y2: number; horizontal: boolean };
          const bridge = (a: number, b: number): Bridge | null => {
            const A = slots[a], B = slots[b]; if (!A || !B) return null;
            if (Math.abs(A.y - B.y) < 4) {
              const [L, R] = A.x < B.x ? [A, B] : [B, A], top = L.y + L.h * 0.22, bot = L.y + L.h * 0.78, y = (top + bot) / 2;
              return { ax1: L.x + L.w, ay1: top, ax2: L.x + L.w, ay2: bot, bx1: R.x, by1: top, bx2: R.x, by2: bot, x1: L.x + L.w, y1: y, x2: R.x, y2: y, horizontal: true };
            }
            const [T, U] = A.y < B.y ? [A, B] : [B, A], left = T.x + T.w * 0.24, right = T.x + T.w * 0.76, x = (left + right) / 2;
            return { ax1: left, ay1: T.y + T.h, ax2: right, ay2: T.y + T.h, bx1: left, by1: U.y, bx2: right, by2: U.y, x1: x, y1: T.y + T.h, x2: x, y2: U.y, horizontal: false };
          };
          beamsGlow.clear(); beamsCore.clear();
          let flowIndex = 0;
          for (const e of edges) {
            if (!e.shared.length) continue;
            const g = bridge(e.first, e.second); if (!g) continue;
            e.shared.forEach((sym, k) => {
              const off = (k - (e.shared.length - 1) / 2) * 9, ox = g.horizontal ? 0 : off, oy = g.horizontal ? off : 0, color = SYMBOL_COLOR[sym];
              const pulse = 0.8 + 0.2 * Math.sin(time * 2.6 + e.first * 1.7 + k);
              for (const [x1, y1, x2, y2] of [[g.ax1, g.ay1, g.ax2, g.ay2], [g.bx1, g.by1, g.bx2, g.by2]]) {
                beamsGlow.moveTo(x1 + ox * 0.3, y1 + oy * 0.3).lineTo(x2 + ox * 0.3, y2 + oy * 0.3).stroke({ width: 10, color, alpha: 0.75 * pulse, cap: 'round' });
                beamsCore.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 2, color, alpha: 0.95 * pulse, cap: 'round' });
              }
              beamsGlow.moveTo(g.x1 + ox, g.y1 + oy).lineTo(g.x2 + ox, g.y2 + oy).stroke({ width: 18, color, alpha: 0.8 * pulse });
              beamsCore.moveTo(g.x1 + ox, g.y1 + oy).lineTo(g.x2 + ox, g.y2 + oy).stroke({ width: 5, color, alpha: 0.95 * pulse });
              beamsCore.moveTo(g.x1 + ox, g.y1 + oy).lineTo(g.x2 + ox, g.y2 + oy).stroke({ width: 1.6, color: 0xffffff, alpha: 0.9 });
              beamsCore.circle(g.x1 + ox, g.y1 + oy, 3.2).fill({ color: 0xffffff, alpha: 0.9 }).circle(g.x2 + ox, g.y2 + oy, 3.2).fill({ color: 0xffffff, alpha: 0.9 });
              // Motes run along the lit edges and across the bridge, like current.
              const path: Array<[number, number, number, number]> = [[g.ax1, g.ay1, g.ax2, g.ay2], [g.x1 + ox, g.y1 + oy, g.x2 + ox, g.y2 + oy], [g.bx1, g.by1, g.bx2, g.by2]];
              for (let m = 0; m < (reduced ? 2 : 7); m++) {
                if (!flowSprites[flowIndex]) { const sp = new PIXI.Sprite(dot); sp.anchor.set(0.5); sp.blendMode = 'add'; flowLayer.addChild(sp); flowSprites.push(sp); }
                const sp = flowSprites[flowIndex++], [px1, py1, px2, py2] = path[m % 3], t = ((time * (0.28 + (m % 4) * 0.06) + m / 7 + k * 0.17) % 1), dir = m % 2 ? t : 1 - t;
                sp.visible = true; sp.position.set(px1 + (px2 - px1) * dir, py1 + (py2 - py1) * dir); sp.tint = color; sp.scale.set(0.2 + 0.07 * Math.sin(time * 9 + m)); sp.alpha = 0.95 * Math.sin(Math.PI * dir);
              }
            });
          }
          for (let i = flowIndex; i < flowSprites.length; i++) flowSprites[i].visible = false;

          // Red links crackle: a jagged arc redrawn ~14 times a second, with stray sparks.
          arcClock -= dt;
          const reroll = arcClock <= 0; if (reroll) { arcClock = 0.07; arcSeed = Array.from({ length: 64 }, () => Math.random() - 0.5); }
          arcsGlow.clear(); arcsCore.clear();
          let seed = 0;
          for (const e of edges) {
            if (!e.clashes.length) continue;
            const g = bridge(e.first, e.second); if (!g) continue;
            const flick = 0.55 + 0.45 * Math.random();
            for (const [ex1, ey1, ex2, ey2] of [[g.ax1, g.ay1, g.ax2, g.ay2], [g.bx1, g.by1, g.bx2, g.by2]]) {
              arcsGlow.moveTo(ex1, ey1).lineTo(ex2, ey2).stroke({ width: 10, color: 0xff3b2a, alpha: 0.7 * flick, cap: 'round' });
              arcsCore.moveTo(ex1, ey1).lineTo(ex2, ey2).stroke({ width: 1.8, color: 0xffb09a, alpha: 0.9 * flick, cap: 'round' });
            }
            // The arc leaps across the whole facing span, not only the gap.
            const sx = g.horizontal ? g.x1 - 14 : g.x1, sy = g.horizontal ? g.y1 : g.y1 - 14, tx = g.horizontal ? g.x2 + 14 : g.x2, ty = g.horizontal ? g.y2 : g.y2 + 14;
            const [x1, y1, x2, y2] = [sx, sy, tx, ty], len = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
            for (let c = 0; c < e.clashes.length; c++) {
              const pts: number[] = [], segs = 9, amp = 9 + 4 * c;
              for (let s = 0; s <= segs; s++) { const t = s / segs, j = s === 0 || s === segs ? 0 : arcSeed[(seed++) % 64] * amp * 2; pts.push(x1 + (x2 - x1) * t + nx * j, y1 + (y2 - y1) * t + ny * j); }
              arcsGlow.poly(pts, false).stroke({ width: 14, color: 0xff3b2a, alpha: 0.85 });
              arcsCore.poly(pts, false).stroke({ width: 2.4, color: 0xfff0e0, alpha: 1 });
              if (reroll && !reduced && Math.random() < 0.45) burst(x1 + (x2 - x1) * Math.random(), y1 + (y2 - y1) * Math.random(), 0xff7a3a, 3, 70, 0.6);
            }
          }

          // The cabin's rim warms toward red as agitation climbs, and throbs once it is high.
          const high = st.stress >= HIGH_AGITATION, beat = high && !reduced ? Math.pow(Math.max(0, Math.sin(time * 5.2)), 6) : 0;
          const heat = Math.max(0, ratio - 0.25) / 0.75;
          rim.clear();
          if (heat > 0) {
            const t = 26 + 30 * heat;
            rim.rect(0, 0, w, t).rect(0, h - t, w, t).rect(0, 0, t, h).rect(w - t, 0, t, h).fill({ color: 0xff3a24, alpha: Math.min(0.9, 0.22 + 0.5 * heat + 0.3 * beat) });
          }
          if (high && !reduced && Math.random() < 0.35 * heat) sparks.push({ x: Math.random() * w, y: h + 4, vx: (Math.random() - 0.5) * 20, vy: -60 - Math.random() * 90, life: 0, max: 1.6 + Math.random(), color: 0xff8a3a, size: 0.7 });
          // The chain show (see components/chain-show.ts for the shared timeline).
          if (st.chain && st.chain.key !== chainKey) { chainKey = st.chain.key; chainShow = st.chain; chainAt = time; chainFired = 0; }
          chainGlow.clear(); chainCore.clear(); rays.clear(); nova.alpha = 0;
          const show = chainShow, chainSince = time - chainAt;
          if (show && !reduced && chainSince < payoffAt(show.path.length) + CHAIN_TIMING.hold) {
            const k = show.path.length, color = SYMBOL_COLOR[show.symbol], pay = payoffAt(k), sincePay = chainSince - pay;
            const fade = Math.min(1, Math.max(0, (pay + CHAIN_TIMING.hold - chainSince) / 0.5));
            const centre = (slot: number) => { const r = slots[slot]; return r ? { x: r.x + r.w / 2, y: r.y + r.h * 0.45, r } : null; };
            boltClock -= dt; if (boltClock <= 0) { boltClock = 0.045; boltSeed = Array.from({ length: 96 }, () => Math.random() - 0.5); }
            let seed = 0;
            show.path.forEach(([slot, fromSlot], i) => {
              const at = hopAt(i); if (chainSince < at) return;
              const c = centre(slot); if (!c) return;
              const age = chainSince - at, kick = Math.exp(-age * 5), payFlare = sincePay > 0 ? Math.exp(-sincePay * 3) : 0;
              const lvl = chainTier(chainMultiplier(i + 1));
              if (i >= chainFired) {
                chainFired = i + 1;
                burst(c.x, c.y, color, 34 + i * 8, 230 + i * 30, 1.1);
                burst(c.x, c.y, 0xffffff, 12, 140, 0.7);
                if (chainMultiplier(i + 1) > 1) { burst(c.x, c.y, 0xffd27a, 50 + lvl * 25, 320 + lvl * 60, 1.4); }
              }
              // The card burns in the chain's colour: a hot frame that flares on the hit and settles to a glow.
              const r = c.r, a = (0.55 + 0.45 * kick + 0.5 * payFlare) * fade;
              chainGlow.roundRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 10).stroke({ width: 16, color, alpha: Math.min(1, a) });
              chainCore.roundRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, 8).stroke({ width: 2.5, color: 0xffffff, alpha: Math.min(1, a) });
              // The landing shockwave.
              if (age < 0.5) { const t = age / 0.5; chainCore.circle(c.x, c.y, 12 + t * Math.max(r.w, r.h) * 0.9).stroke({ width: 7 * (1 - t) + 1, color, alpha: (1 - t) * 0.95 }); }
              // The bolt from the previous rider: a jagged line re-rolled ~20 times a second.
              const p = fromSlot === null ? null : centre(fromSlot);
              if (p) {
                const len = Math.hypot(c.x - p.x, c.y - p.y) || 1, nx = -(c.y - p.y) / len, ny = (c.x - p.x) / len, segs = 12;
                for (let strand = 0; strand < 2; strand++) {
                  const pts: number[] = [];
                  for (let sgm = 0; sgm <= segs; sgm++) { const t = sgm / segs, j = sgm === 0 || sgm === segs ? 0 : boltSeed[(seed++) % 96] * (14 + 8 * strand) * Math.sin(Math.PI * t) * 2; pts.push(p.x + (c.x - p.x) * t + nx * j, p.y + (c.y - p.y) * t + ny * j); }
                  const ba = Math.min(1, (0.5 + 0.5 * kick + 0.6 * payFlare)) * fade * (strand ? 0.55 : 1);
                  chainGlow.poly(pts, false).stroke({ width: 18, color, alpha: ba });
                  chainCore.poly(pts, false).stroke({ width: strand ? 1.6 : 3.2, color: 0xffffff, alpha: ba });
                }
              }
            });
            // Payoff: a nova at the cabin's heart; from ×6 light rays turn behind it, from ×12 a second, wider ring.
            if (sincePay > 0) {
              const tier = chainTier(show.multiplier), grow = 1 - Math.exp(-sincePay * 7);
              nova.position.set(w / 2, h * 0.46); nova.tint = tier >= 3 ? 0xfff6dc : 0xffdf9a;
              nova.width = nova.height = Math.max(w, h) * (0.5 + 0.7 * grow) * (0.8 + 0.2 * tier);
              nova.alpha = Math.min(1, 1.1 * Math.exp(-sincePay * (3.4 - tier * 0.6))) * fade;
              if (sincePay < 0.7) { const t = sincePay / 0.7; chainCore.circle(w / 2, h * 0.46, t * Math.max(w, h) * 0.75).stroke({ width: 10 * (1 - t) + 1, color: 0xfff0c0, alpha: 1 - t }); }
              if (tier >= 3 && sincePay > 0.12 && sincePay < 0.9) { const t = (sincePay - 0.12) / 0.78; chainCore.circle(w / 2, h * 0.46, t * Math.max(w, h)).stroke({ width: 6 * (1 - t) + 1, color, alpha: 1 - t }); }
              if (tier >= 2) {
                const n = tier >= 3 ? 18 : 12, L = Math.hypot(w, h), spin = time * (tier >= 3 ? 0.5 : 0.3), ra = Math.min(1, sincePay * 4) * fade * (tier >= 3 ? 0.42 : 0.3);
                for (let q = 0; q < n; q++) {
                  const ang = spin + (q / n) * Math.PI * 2, half = Math.PI / n * 0.42;
                  rays.poly([w / 2, h * 0.46, w / 2 + Math.cos(ang - half) * L, h * 0.46 + Math.sin(ang - half) * L, w / 2 + Math.cos(ang + half) * L, h * 0.46 + Math.sin(ang + half) * L]).fill({ color: q % 2 ? 0xffd27a : color, alpha: ra });
                }
              }
              if (sincePay < dt * 1.5) for (const [slot] of show.path) { const c = centre(slot); if (c) { burst(c.x, c.y, 0xffd27a, 26 + tier * 14, 260 + tier * 70, 1.3); } }
            }
          }
          drawSparks(dt);
        });
      }
      const onVisibility = () => { if (document.hidden) app.ticker.stop(); else app.ticker.start(); };
      document.addEventListener('visibilitychange', onVisibility);
      destroy = () => { document.removeEventListener('visibilitychange', onVisibility); if (layer === 'front') delete stage.dataset.fx; app.destroy(); };
    })();
    return () => { disposed = true; destroy(); };
  }, [layer]);

  return <canvas ref={canvasRef} className={`cabin-fx cabin-fx-${layer}`} aria-hidden="true" />;
}
