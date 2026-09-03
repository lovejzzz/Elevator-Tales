// Portraits are static card illustrations; gameplay and connections never live in the bitmap.
import { PASSENGERS, type PassengerKind } from './game-data';
export const PASSENGER_ART = {
  style: 'Waist-up cinematic midnight noir; bottle-green backdrop, brass and teal light; same human proportions; no text.',
  usage: 'runtime-sprite',
  interaction: ['inspect', 'place', 'reseat', 'dismiss'],
  pivot: [0.5, 1],
  footprint: 'one of six engine-owned slots',
  motion: 'static portrait; UI transition only, no simulated walking',
  newer: { mystery: '/assets/mystery-v6.png', shifter: '/assets/shifter-v6.png', mimic: '/assets/mimic-v6.png' },
} as const;
export function portraitAsset(kind: PassengerKind) {
  if (kind === 'mystery' || kind === 'shifter' || kind === 'mimic') return {src:PASSENGER_ART.newer[kind],columns:1,rows:1,cell:0};
  const spec=PASSENGERS[kind]; return {src:`/assets/passengers-${spec.sheet}.png`,columns:3,rows:2,cell:spec.cell};
}
