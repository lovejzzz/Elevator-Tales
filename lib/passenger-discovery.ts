import { DARK_LEGEND_KINDS, PASSENGER_ORDER, type PassengerKind } from './game-data';

/** v9.20: dark legends are archived too (their own section); the header count still reads PASSENGER_ORDER only. */
const ARCHIVED: PassengerKind[] = [...PASSENGER_ORDER, ...DARK_LEGEND_KINDS];

export function sanitizeDiscoveredPassengers(value: unknown): PassengerKind[] {
  if (!Array.isArray(value)) return [];
  const saved = new Set(value.filter((kind): kind is PassengerKind => typeof kind === 'string' && ARCHIVED.includes(kind as PassengerKind)));
  return ARCHIVED.filter((kind) => saved.has(kind));
}

export function addDiscoveredPassengers(current: PassengerKind[], visible: PassengerKind[]): PassengerKind[] {
  const discovered = new Set([...current, ...visible]);
  return ARCHIVED.filter((kind) => discovered.has(kind));
}
