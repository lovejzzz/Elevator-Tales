// Portraits are static card illustrations; gameplay and connections never live in the bitmap.
import type { PassengerKind } from './game-data';

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const publicAsset = (path: string) => `${publicBasePath}${path}`;
export const PASSENGER_ART = {
  style: 'v9.1 Art Deco travel poster: flat gouache shapes, bottle-green backdrop, brass and cream with one accent colour; legends add a gold sunburst; no text.',
  usage: 'runtime-portrait',
  interaction: ['inspect', 'place', 'reseat', 'dismiss'],
  pivot: [0.5, 1],
  footprint: 'one of six engine-owned slots',
  motion: 'static portrait; UI transition only, no simulated walking',
} as const;
/** One square portrait per rider and legend (v9.1); legends are recognised by their gold sunburst and frame. */
export function portraitAsset(kind: PassengerKind) {
  return { src: publicAsset(`/assets/riders/${kind}.jpg`), columns: 1, rows: 1, cell: 0 };
}

/** Object icons for shop abilities and power-box lines (one painted item each). */
export const shopIcon = (key: string) => publicAsset(`/assets/shop/${key}.jpg`);
