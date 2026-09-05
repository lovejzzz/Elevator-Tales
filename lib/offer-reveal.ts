import { passengerCardGrade, passengerCategory, type PassengerKind } from './game-data';
import type { Rider } from './game-engine';

/** Presentation never reorders, rerolls, or peeks at sealed traits. */
export function offerReveal(offers: Rider[], seen: PassengerKind[]) {
  const known = new Set(seen);
  const debutIds = offers.filter(rider => {
    if (known.has(rider.kind)) return false;
    known.add(rider.kind); return true;
  }).map(rider => rider.id);
  const cue = debutIds.length ? 'debut' : offers.some(rider => passengerCategory(rider.kind) === 'special' || passengerCardGrade(rider.kind) === 'legendary') ? 'rare' : null;
  return { debutIds, cue } as const;
}
