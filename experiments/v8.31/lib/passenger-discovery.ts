import { PASSENGER_ORDER, type PassengerKind } from './game-data';

export function sanitizeDiscoveredPassengers(value: unknown): PassengerKind[] {
  if (!Array.isArray(value)) return [];
  const saved = new Set(value.filter((kind): kind is PassengerKind => typeof kind === 'string' && PASSENGER_ORDER.includes(kind as PassengerKind)));
  return PASSENGER_ORDER.filter((kind) => saved.has(kind));
}

export function addDiscoveredPassengers(current: PassengerKind[], visible: PassengerKind[]): PassengerKind[] {
  const discovered = new Set([...current, ...visible]);
  return PASSENGER_ORDER.filter((kind) => discovered.has(kind));
}
