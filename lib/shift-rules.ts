import { ADJACENT, type PassengerKind } from './game-data';
import type { Rider } from './game-engine';

export const UPGRADE_SLOTS = 4;
export const DISMISSALS_PER_SECTOR = 2;
export const RISK_STASH_PER_ASCENT = 2;
export const RISK_PARTNERS: PassengerKind[] = ['thief', 'drunk', 'bomb'];

/** Public, local links. Care can keep a Thief quiet, but only control breaks
 * their agreement. A calmed Drunk or a secured Bomb opts out entirely. */
export function riskPartnerships(cabin: Array<Rider | null>) {
  const contained = (slot: number) => {
    const kind = cabin[slot]?.kind;
    const controls = kind === 'drunk' ? ['nurse'] : kind === 'thief' ? ['cop', 'lawyer'] : ['cop'];
    return ADJACENT.some(([a, b]) => {
      const other = a === slot ? b : b === slot ? a : -1;
      return other >= 0 && controls.includes(cabin[other]?.kind ?? '');
    });
  };
  const edges = ADJACENT.filter(([a, b]) => cabin[a] && cabin[b]
    && RISK_PARTNERS.includes(cabin[a]!.kind) && RISK_PARTNERS.includes(cabin[b]!.kind)
    && !contained(a) && !contained(b));
  return { edges, members: [...new Set(edges.flat())], agitation: edges.length };
}

/** Predetermined rhythm, never selected from player resources or skill. */
export function offerRiskChance(floor: number) {
  if (floor < 17) return 0;
  return Math.min(.55, .08 + Math.floor((floor - 11) / 10) * .07);
}
export const isRushFloor = (floor: number) => floor >= 17 && floor % 10 >= 7;

// Encounter packets introduce related rules together. This is opportunity,
// not a safety guarantee: duration, positions, conflicts and timing still matter.
export const OFFER_PARTNERS: Record<PassengerKind, PassengerKind[]> = {
  commuter: ['courier', 'coach'], tourist: ['commuter', 'celebrity', 'tourist', 'musician', 'mimic'],
  courier: ['mechanic', 'commuter'], mechanic: ['courier', 'inspector'], lover: ['lover'],
  musician: ['tourist'], thief: ['cop', 'thief', 'drunk'],
  cop: ['thief', 'bomb'], lawyer: ['thief'], drunk: ['nurse', 'thief', 'bomb'],
  nurse: ['drunk', 'child'], child: ['nurse', 'lover'], ghost: ['exorcist'], exorcist: ['ghost'],
  coach: ['commuter', 'courier', 'mystery'], celebrity: ['tourist', 'coach'], inspector: ['mechanic'],
  bomb: ['cop', 'thief', 'drunk'], mystery: ['coach'], shifter: ['nurse'], mimic: ['tourist'],
};
