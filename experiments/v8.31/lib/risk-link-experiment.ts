import { ADJACENT } from './game-data';
import type { Rider } from './game-engine';

/** Research-only tuning. Normal play never supplies this option.
 * No named faction, unlock, or player-facing build identifier is added. */
export type RiskLinkTuning = { coinsPerMember: number; agitationPerEdge: number; payoutChance?: number };
export function experimentalRiskLinks(cabin: Array<Rider | null>, tuning?: RiskLinkTuning) {
  if (!tuning) return { edges: 0, coins: 0, agitation: 0 };
  const controlled = (slot: number) => ADJACENT.some(([a,b]) => {
    const other = a === slot ? b : b === slot ? a : -1;
    return other >= 0 && ['cop','lawyer'].includes(cabin[other]?.kind ?? '');
  });
  const edges = ADJACENT.filter(([a,b]) => cabin[a]?.kind === 'thief' && cabin[b]?.kind === 'thief' && !controlled(a) && !controlled(b)).length;
  return { edges, coins: edges * 2 * tuning.coinsPerMember * (tuning.payoutChance ?? 1), agitation: edges * tuning.agitationPerEdge };
}

/** Bonus randomness only; the extra pressure remains a visible fixed cost.
 * One roll per edge, shared by both endpoints, independent between edges. */
export function rollExperimentalRiskIncome(cabin: Array<Rider|null>, tuning: RiskLinkTuning | undefined, rng:()=>number) {
  if (!tuning) return 0;
  const {edges}=experimentalRiskLinks(cabin,tuning),chance=tuning.payoutChance??1;
  let coins=0;
  for(let i=0;i<edges;i++) if(chance>=1||rng()<chance)coins+=2*tuning.coinsPerMember;
  return coins;
}
