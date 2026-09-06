# v8.37 research checkpoint 01 — NOT a balanced release

This local checkpoint preserves the v8.37 work in progress. The visible/public version remains v8.36 deliberately: this is not a public update, and does not authorize claiming release acceptance. Before publishing, add a detailed bilingual v8.37 entry in `lib/changelog.ts` and `CHANGELOG.md` and pass the release invariant.

## Implemented scope

- Twenty unique permanent shop upgrades, with one purchase per shop/four installed slots and owned-item exclusion; new options include timing, reservation, red-link protection, overflow storage and arrival-count rewards.
- Curtain Call: at least two normal arrivals and at most one rider remaining grants six cabin coins, once per floor. Other proposed blanket income cuts and Overflow Cell buffs were not adopted.
- Actual per-rider arrival receipts and exit animation; receipts exclude cabin-wide bonuses. A remaining door-layer occlusion is documented below.
- Death energy ledger now separates gross cost, offsets/recharge and net change. Warden/Ghost card summaries explicitly exclude motor savings.
- Joint shop/charge investigations, paid item studies and deterministic replay instrumentation. Opt-in next-shop boarding horizon with explicit censoring/shop-arrival metrics; fixed-depth remains the default.

## Acceptance status

| Requirement | Evidence | Status |
|---|---|---|
| Engine/lab regression, types, build | All four checkpoint commands exited0; logs retained; not a substitute for usability or balance | PASSED |
| No hidden-future decision access | Regression checks on sealed-fare invariance and public-seeded imagined futures | Covered within tested interfaces |
| Trustworthy evaluation model | Known short-horizon failure rescued; longer horizon also regresses another case | NOT PASSED |
| All 20 upgrades and 19 roles meaningful | Broad interaction checks, targeted paid studies, support witnesses; complete positive/negative acquisition dossier unfinished | INCOMPLETE |
| Independent policy comparison | 32 candidate seeds × four policies completed and replay-verified | Evidence collected, balance NOT PASSED |
| Typical end 30–60, >60 at most20% target | Operator exceeds60 in13/32; diverse19/32, median72.5 | FAILED |
| Frozen, strongly muted real game | Same browser/document to actual69F energy death; source freeze verified | Completed on pre-copy-correction snapshot |
| Readable UI and exit payouts | Shop charge action below first viewport; doors cover some exit payouts; some generic shop timing copy misleading | NOT PASSED |
| Normal human duration roughly25, generally under40minutes | Tool-assisted elapsed time is not human playtime | NOT MEASURED |
| Public release | No deployment; visible version8.36 | NOT RELEASED |

## Findings that constrain the next change

The actual run ended at69F with−1 power,6 coins,stress7; income616/spending610. It spent almost all shop money charging, installed only Rebooking, and dismissed nobody. It does not demonstrate coin surplus. The final sector's repeated refusal of profitable riders waiting for power-saving offers may feel passive; count this separately from difficulty.

Across64 operator/diverse candidate games,51 died from energy and13 from agitation.19 energy deaths had affordable unused charge at the prior shop; exhaustive legal extra-charge quantities rescued6 original death endpoints. This is hindsight diagnosis, not a policy or proof of reaching the following shop. Some apparent unused cash finances later paid decisions.

Twenty-four matched role omission studies continued to the next shop. Courier was not essential to next-shop reach in seven selected forks, but other Couriers could still arrive later; this is not a system-wide dependency test. Nurse/Warden had both beneficial and costly cases. A Nurse-associated death was avoided while retaining the Nurse by refusing a later Coach.

Fixed-five-turn versus next-shop boarding lookahead:24 pairs, both22 shop arrivals, one rescue and one regression; measured total runtime20.98s versus24.88s on this host. Keep the new mode experimental. These fork states overlap within eight already-inspected development seeds; they are not24 independent holdout games.

## Reproduction

Use the repository lockfile and Node version compatible with `package.json` (>=22.13). After dependency installation:

```
npm run verify
npm run verify:player-lab
npx tsc --noEmit
npm run build
```

Ordinary candidate policy batch, one example (use a new output directory):

```
npm run lab -- run --policies diverse --runs 32 --horizon 100 --opening ordinary --shop-style committed --seed-base 193865001 --split development --out /absolute/new-output-directory
```

Historical cohort seeds are now development data, not fresh holdout seeds. Historical files have earlier source manifests; do not bypass the CLI's source-hash check and claim current-source parity. Research scripts that verify every historical world hash explicitly distinguish that replay claim from policy-regeneration parity.

Primary external evidence lives in the shared workspace `player-lab/`: `V837-ACCEPTANCE.md`, `V837-ACCEPTANCE-PLAY.md`, `V837-HOLDOUT-DEATH-RESOURCE-REVIEW.md`, `V837-ROLE-CONTINUATION.md`, `V837-BOARDING-HORIZON.md`, and their `results/` data. The checkpoint evidence archive records these and the selected candidate trajectories without including browser credentials or unrelated history. Its archive checksum and this commit ID belong in the external checkpoint index (avoids a self-referential commit hash).

## Next required work

1. Repair and visually verify payout layering, shop charge/upgrade visibility and effect-specific timing text, with all audio muted.
2. Finish the20-item positive/negative acquisition dossier and distinguish access, selection, trigger and payoff failures.
3. Calibrate using both model rescue and regression cases; then test necessary balance changes with a new independent cohort. Do not hard-kill at a floor or alter prices based on player success.
4. Freeze final candidate, recheck UI/real-play coverage, write bilingual release notes, and publish only with explicit outstanding-status disclosure. The active goal remains unfinished.
