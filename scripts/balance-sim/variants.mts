// Process-local rule variants for side-by-side comparison. Production defaults live in lib/.
// A shard applies exactly one variant before running; nothing here changes the shipped game.
import { AGITATION_RULES, FARE_RULES, MOTOR_RULES, V9_AGITATION } from '../../lib/balance-v832.ts';
import { BOX_PRICES, CHARGE_PRICES, EMERGENCY_PRICES } from '../../lib/power-box.ts';
import { CALM_RULES, INSULATION_RULES, RISK_RULES, SHOP_PRICES, SOUNDPROOF_RULES, START_RULES } from '../../lib/game-engine.ts';
import { LEGEND_RULES } from '../../lib/legends.ts';

export const VARIANTS: Record<string, () => void> = {
  baseline: () => {},
  insul1: () => { INSULATION_RULES.coinsPerLink = 1; },
  insul2: () => { INSULATION_RULES.coinsPerLink = 2; INSULATION_RULES.cap = 4; },
  late51: () => { MOTOR_RULES.lateStart = 51; },
  slope4: () => { MOTOR_RULES.lateSlope = 4; },
  l51s6: () => { MOTOR_RULES.lateStart = 51; MOTOR_RULES.lateSlope = 6; },
  l46s7: () => { MOTOR_RULES.lateStart = 46; MOTOR_RULES.lateSlope = 7; },
  l46s8: () => { MOTOR_RULES.lateStart = 46; MOTOR_RULES.lateSlope = 8; },
  n5: () => { CHARGE_PRICES.splice(0, 4, 2, 1.75, 1.5, 1.25); EMERGENCY_PRICES.base = 4; EMERGENCY_PRICES.topTransformer = 3; MOTOR_RULES.surchargeFrom = 11; START_RULES.energy = 50; MOTOR_RULES.lateSlope = 5; MOTOR_RULES.lateCap = 12; BOX_PRICES.splice(0, 3, 15, 35, 60); SOUNDPROOF_RULES.riskCap = 99; CALM_RULES.relief = 3; MOTOR_RULES.lateStart = 56; },
  n5x40s55: () => { VARIANTS.n5x40(); START_RULES.energy = 55; },
  n5x40s60: () => { VARIANTS.n5x40(); START_RULES.energy = 60; },
  n5x40: () => { CHARGE_PRICES.splice(0, 4, 2, 1.75, 1.5, 1.25); EMERGENCY_PRICES.base = 4; EMERGENCY_PRICES.topTransformer = 3; MOTOR_RULES.surchargeFrom = 11; START_RULES.energy = 50; MOTOR_RULES.lateSlope = 5; MOTOR_RULES.lateCap = 12; BOX_PRICES.splice(0, 3, 15, 35, 60); SOUNDPROOF_RULES.riskCap = 99; CALM_RULES.relief = 3; MOTOR_RULES.lateStart = 56; SHOP_PRICES.extraAbility = 40; },
  n5x30: () => { CHARGE_PRICES.splice(0, 4, 2, 1.75, 1.5, 1.25); EMERGENCY_PRICES.base = 4; EMERGENCY_PRICES.topTransformer = 3; MOTOR_RULES.surchargeFrom = 11; START_RULES.energy = 50; MOTOR_RULES.lateSlope = 5; MOTOR_RULES.lateCap = 12; BOX_PRICES.splice(0, 3, 15, 35, 60); SOUNDPROOF_RULES.riskCap = 99; CALM_RULES.relief = 3; MOTOR_RULES.lateStart = 56; SHOP_PRICES.extraAbility = 30; },
  n5noExtra: () => { CHARGE_PRICES.splice(0, 4, 2, 1.75, 1.5, 1.25); EMERGENCY_PRICES.base = 4; EMERGENCY_PRICES.topTransformer = 3; MOTOR_RULES.surchargeFrom = 11; START_RULES.energy = 50; MOTOR_RULES.lateSlope = 5; MOTOR_RULES.lateCap = 12; BOX_PRICES.splice(0, 3, 15, 35, 60); SOUNDPROOF_RULES.riskCap = 99; CALM_RULES.relief = 3; MOTOR_RULES.lateStart = 56; SHOP_PRICES.extraAbility = 9999; },
  n4: () => { CHARGE_PRICES.splice(0, 4, 2, 1.75, 1.5, 1.25); EMERGENCY_PRICES.base = 4; EMERGENCY_PRICES.topTransformer = 3; MOTOR_RULES.surchargeFrom = 11; START_RULES.energy = 50; MOTOR_RULES.lateSlope = 5; MOTOR_RULES.lateCap = 12; BOX_PRICES.splice(0, 3, 15, 35, 60); SOUNDPROOF_RULES.riskCap = 99; CALM_RULES.relief = 3; V9_AGITATION.lateCrowdingFloor = 51; },
  n4noLateCrowd: () => { CHARGE_PRICES.splice(0, 4, 2, 1.75, 1.5, 1.25); EMERGENCY_PRICES.base = 4; EMERGENCY_PRICES.topTransformer = 3; MOTOR_RULES.surchargeFrom = 11; START_RULES.energy = 50; MOTOR_RULES.lateSlope = 5; MOTOR_RULES.lateCap = 12; BOX_PRICES.splice(0, 3, 15, 35, 60); SOUNDPROOF_RULES.riskCap = 99; CALM_RULES.relief = 3; },
  n1: () => { CHARGE_PRICES.splice(0, 4, 2, 1.75, 1.5, 1.25); EMERGENCY_PRICES.base = 4; EMERGENCY_PRICES.topTransformer = 3; MOTOR_RULES.surchargeFrom = 11; START_RULES.energy = 50; BOX_PRICES.splice(0, 3, 20, 40, 65); },
  n2: () => { CHARGE_PRICES.splice(0, 4, 2, 1.75, 1.5, 1.25); EMERGENCY_PRICES.base = 4; EMERGENCY_PRICES.topTransformer = 3; MOTOR_RULES.surchargeFrom = 11; START_RULES.energy = 50; BOX_PRICES.splice(0, 3, 20, 40, 65); MOTOR_RULES.lateSlope = 7; MOTOR_RULES.lateCap = 12; },
  n3: () => { CHARGE_PRICES.splice(0, 4, 2, 1.75, 1.5, 1.25); EMERGENCY_PRICES.base = 4; EMERGENCY_PRICES.topTransformer = 3; MOTOR_RULES.surchargeFrom = 11; START_RULES.energy = 50; BOX_PRICES.splice(0, 3, 20, 40, 65); MOTOR_RULES.lateSlope = 5; MOTOR_RULES.lateCap = 12; },
  cheapPowerMotor21: () => { CHARGE_PRICES.splice(0, 4, 2, 1.75, 1.5, 1.25); EMERGENCY_PRICES.base = 4; EMERGENCY_PRICES.topTransformer = 3; MOTOR_RULES.surchargeFrom = 21; START_RULES.energy = 50; },
  cheapPowerMotor11: () => { CHARGE_PRICES.splice(0, 4, 2, 1.75, 1.5, 1.25); EMERGENCY_PRICES.base = 4; EMERGENCY_PRICES.topTransformer = 3; MOTOR_RULES.surchargeFrom = 11; START_RULES.energy = 50; },
  cheapPowerMotor31s45: () => { CHARGE_PRICES.splice(0, 4, 2, 1.75, 1.5, 1.25); EMERGENCY_PRICES.base = 4; EMERGENCY_PRICES.topTransformer = 3; MOTOR_RULES.surchargeFrom = 31; START_RULES.energy = 45; },
  start50: () => { START_RULES.energy = 50; },
  start40: () => { START_RULES.energy = 40; },
  start40tips: () => { START_RULES.energy = 40; V9_AGITATION.lowTip = 0; },
  start50legend5: () => { START_RULES.energy = 50; },
  hr2: () => { RISK_RULES.highRiskBonus = 2; },
  chargeUp: () => { CHARGE_PRICES.splice(0, 4, 3, 2.6, 2.2, 1.9); EMERGENCY_PRICES.base = 6; EMERGENCY_PRICES.topTransformer = 5; },
  hr2chargeUp: () => { RISK_RULES.highRiskBonus = 2; CHARGE_PRICES.splice(0, 4, 3, 2.6, 2.2, 1.9); EMERGENCY_PRICES.base = 6; EMERGENCY_PRICES.topTransformer = 5; },
  slope20: () => { MOTOR_RULES.lateSlope = 20; },
  lateCrowd: () => { V9_AGITATION.lateCrowdingFloor = 51; },
  slope20LateCrowd: () => { MOTOR_RULES.lateSlope = 20; V9_AGITATION.lateCrowdingFloor = 51; },
  slope20LateCrowdIncident: () => { MOTOR_RULES.lateSlope = 20; V9_AGITATION.lateCrowdingFloor = 51; V9_AGITATION.incidentChance = 0.3; },
  slope15LateCrowd: () => { MOTOR_RULES.lateSlope = 15; V9_AGITATION.lateCrowdingFloor = 51; },
};
export function applyVariant(name = 'baseline') {
  const v = VARIANTS[name]; if (!v) throw Error('unknown variant ' + name);
  v();
  return { AGITATION_RULES, FARE_RULES, MOTOR_RULES, V9_AGITATION, BOX_PRICES, CHARGE_PRICES, LEGEND_RULES };
}
