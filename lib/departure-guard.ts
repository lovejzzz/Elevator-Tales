import { boxOf, emergencyAllowance, nextShopFloor, type RunState } from './game-engine';
import { energyForecast, sectorForecast } from './game-forecast';
import { motorCost } from './balance-v832';
import { boxedMotorCost, emergencyUnitPrice } from './power-box';

/** Riders assumed per floor when the shop estimates the next sector's power need. */
export const SECTOR_NEED_RIDERS = 5;

export type DepartureRisk = {
  /** Worst-case power after the next ascent is at or below zero. */
  fatal: boolean;
  /** Power needed right now to survive the next ascent in the worst case. */
  need: number;
  /** In-transit units the player can actually buy now (sector cap, capacity and coins). */
  affordable: number;
  unitPrice: number;
  /** Floor where power runs out at the current cabin's pace, if before the next shop. */
  failFloor: number | null;
};

/** Pure check behind the ascend guard: a floor that can end the run needs a second press. */
export function departureRisk(state: RunState): DepartureRisk {
  const worst = state.energy + energyForecast(state).lowDelta;
  const need = Math.max(0, 1 - worst);
  return { fatal: state.status === 'playing' && worst <= 0, need, affordable: emergencyAllowance(state), unitPrice: emergencyUnitPrice(boxOf(state)), failFloor: sectorForecast(state).failFloor };
}

/** Shop estimate for the coming sector: motor power plus a typical cabin. Riders who return power are not counted. */
export function sectorNeed(state: RunState): { from: number; to: number; motor: number; riders: number; total: number } {
  const from = state.floor + 1, to = nextShopFloor(state.floor);
  let motor = 0;
  for (let f = from; f <= to; f++) motor += boxedMotorCost(motorCost(f), boxOf(state), f);
  const riders = (to - from + 1) * SECTOR_NEED_RIDERS;
  return { from, to, motor, riders, total: motor + riders };
}
