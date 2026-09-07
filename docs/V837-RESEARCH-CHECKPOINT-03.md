# v8.37 research checkpoint 03 — not release-ready

Extends checkpoint02 (10f15bc). Public version remains8.36. No public deployment. The goal and original acceptance gates remain unchanged.

## Implemented since checkpoint02

- Shop cards specify actual trigger timing, including manual rebooking/reservation and new-bomb-only fuse upgrades; Chinese and English copy updated. Shop explicitly says coin charging is shop-only.
- Desktop shop separates upgrades from services. Compact desktops keep40px power/coin values while placing labels inline, removing duplicate card headings, and reducing spacing. English ordinary/crisis/full-installation fixtures at1440×900 and1280×720 all fit with zero internal scroll and no obscured action buttons. These are injected UI tests, not game runs. Owned muted browser was closed.
- Simulator control-budget search accounts for legal cash and removal options. Bomb deadline accounting includes known police duration, not imaginary future protection. This addresses three local bomb failure cases but is not a complete long-term pressure model.
- Death review records remaining action options, bomb deadlines and simultaneous energy/agitation resource breaches. A resource breach is not automatically an independently established cause.
- Two disabled experimental finalist selectors are available: broad passenger-cohort diversity and exact reservation-only action deduplication. `runOne` records the selected option. Neither is enabled by default.

## Evidence and decisions

- Mid-motor increase candidate failed untouched difficulty holdout: diverse still exceeded60 in10/32 runs. No automatic adoption of higher operating costs.
- Inspector forced-choice6 paired positions/12 branches did not improve terminal floors. Ordinary24-run catalog test of4–7→2–5 trips and8→10 fares improved participation but had mixed whole-run outcomes. Neither change adopted; no causal role-strength ranking from survival correlation.
- Thirty-two full-opening broad-cohort runs:8 pairs farther,7 earlier,1 equal. Disabled; same passenger set can hide meaningful spatial differences.
- Thirty-two reservation-only deduplication runs:2 pairs farther,14 equal endpoints,0 earlier. Original33F agitation regression remains. Development evidence only, insufficient independent calibration; still disabled.
- The33F failure can be postponed to39F by retaining the caregiver, but then energy fails before40shop. Longer lookahead alone reproduces33F. Do not call a changed death reason or a local postponement a complete rescue.
- The previous candidate's19 apparently undercharged deaths were tested with93 legal extra-charge quantities:6 local rescues,9 incompatible with recorded later payments,4 not rescued. Cash on death is not automatically excess money. All32 post60 candidate survivors had negative subsequent cash flow; early savings, not proven infinite late income, extended survival.

## Acceptance ledger

Rules/types/build: fresh logs in the external checkpoint index are authoritative.71 lab regression groups and20item/19role/30115joint transitions are expected; this is rules coverage, not balance proof.

Model: INCOMPLETE. Known33F regression, shopping/whole-sector commitments, rollout selection and conditioned role value remain unresolved. Historical inspected seeds are development seeds.

Difficulty/economy: FAILED. The original median/duration and rare>60 gates have not been met by an adopted candidate. Do not relax thresholds to match observed results.

Content: INCOMPLETE. Original Buffer rarely triggers; tested replacement was not adopted. Express acquisition and meaningful positive/negative cases for all upgrades/roles remain unfinished. No claim that all20 upgrades are useful.

UI: desktop shop improvements verified within stated fixtures. Latest short-height changes still require Chinese recheck, small-screen/enlargement checks and final full muted play. Prior69F real-browser game is retained evidence, not a new post-change playthrough.

Release: INCOMPLETE. Final independent seeds, frozen muted full game, final balance values, bilingual8.37 changelog and publication still required. This checkpoint is for reproducible research, not the public release candidate.

## Reproduce

Run `npm run verify`, `npm run verify:player-lab`, `./node_modules/.bin/tsc --noEmit`, `npm run build`. External archive `player-lab/results/v837-research-checkpoint-03/INDEX.json` identifies this commit, evidence hash and logs. Experimental catalog records require their saved overrides before replay. Scripts contain absolute local GAME imports; adjust them when moving machines. Earlier base trajectories are retained in checkpoints01/02 or the documented prior result directories. Never restart exclusive-result writers over existing outputs.
