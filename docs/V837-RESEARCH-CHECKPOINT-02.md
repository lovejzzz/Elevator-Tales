# v8.37 research checkpoint 02 — acceptance remains incomplete

Extends checkpoint01 (d7ab284). Not a public release: version remains8.36. Experimental Buffer tuning is OFF by default. Do not claim a balanced release or publish this checkpoint without the remaining acceptance work and bilingual release record.

## Changes since checkpoint01

- Exit receipts now render in a separate seat-aligned z16 overlay above z15 doors, while existing occupants and links remain in z6. Exact per-rider receipts and slot identity preserved. Muted1440×900/1280×720 injected browser fixtures, regular/shop arrivals and reduced-motion checks passed; screenshots inspected. This was UI QA, not another complete game.
- Opt-in `excludedIntake` applies to current and imagined future boarding, including joint-shop continuations. Empty restrictions preserve normal simulation.
- Disabled experimental Buffer replacement: two no-arrival ascents arm4 energy, next normal arrival pays once; shared settlement/forecast, public progress, observed-cycle valuation and known-schedule commitment budget. Current game still uses the original overflow mechanism.
- Planning randomness ignores unowned experimental metadata but retains owned progress/rules. Tests distinguish meaningful mechanics from irrelevant perturbations.

## Evidence changing decisions

- Inspector:64 exact historical replays,51 boarded,42 arrived,8 stamped. Of34 unstamped arrivals,28 saw no low departure and6 only one. Accumulated-two instead of consecutive-two would rescue none of these unchanged trips. Eight declined-low-state insertion cases/37 branches showed conditional benefits and real energy costs; no blanket buff adopted.
- Courier dependency:four development seeds×two policies. Consistent exclusion shortened7/8 and tied1/8, median paired loss17.5 floors. Restricted existing policies are not optimized alternatives; this is a dependency signal, not proof of universal dominance or a nerf prescription.
- Original Buffer:128 games/5,801 ascents/954 natural-charge turns had only one overflow unit. Existing ordinary-access gate failed.
- Experimental gap Buffer12:32 paid branches supplied a rescue witness, but corrected ordinary play over24 games/18 exposures bought it zero times.13 offers had nonpositive estimated net value,2 lost to other purchases,3 failed the policy commitment budget. Candidate is parked, NOT adopted.
- Corrected no-purchase experiments match all24 historical baseline final resource/death endpoints. Earlier metadata-perturbed runs must not be treated as evidence of the unpurchased item's causal effect.

## Acceptance ledger

Rules/replay/type/build regressions: rerun for this checkpoint; external logs and index are authoritative.65 lab groups plus20-item/19-role/30,115-transition joint coverage. This coverage does not prove balance.

Difficulty: STILL FAILED. Prior32-seed policy batches exceeded60 too often; no adopted economy/duration change has corrected that. Do not lower the acceptance threshold.

Content: INCOMPLETE. Buffer replacement rejected; Express acquisition and other item/role positive/negative value cases remain unfinished. No declaration that all20 products are useful.

Model: IMPROVED, NOT FULLY CALIBRATED. Public-only restrictions and experimental budget paths now consistent. Fixed/next-shop lookahead still has known rescue/regression cases. Commitment forecasts freeze schedules/profiles and are not guarantees under Ghost delays/transformations.

UI: EXIT OCCLUSION FIXED. Shop charging versus upgrade first-viewport visibility and effect-specific timing text remain open. No claim the whole UI passes.

Play: prior frozen69F muted game retained; no new full post-change game performed. New independent seeds and final frozen real play remain required after adopted balance changes.

## Reproduce and continue

Run `npm run verify`, `npm run verify:player-lab`, `npx tsc --noEmit`, `npm run build`. Research scripts/reports and saved branch records are archived externally under `player-lab/results/v837-research-checkpoint-02/`. Experiment replay must reapply each record's saved tuning; default replay is insufficient for experimental branches. Historical inspected seeds are development data now, never relabel as independent holdout.

Checkpoint archive excludes credentials, browser session bindings and unrelated files. Research scripts use absolute local GAME imports; adjust those on another machine. Refer to checkpoint01's evidence archive for original128 candidate trajectories reused by the new audits. New screenshots and reports record muted owned-browser QA and its closure.

Next: resolve the remaining UI clarity issues, replace/remove unsupported shop concepts with meaningful tested choices, investigate excessive early savings/duration using calibrated policies, and run untouched validation plus frozen muted real play. The active goal is unfinished.
