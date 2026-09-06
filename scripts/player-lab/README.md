# Player Lab · v8.32

Run the real game rules quickly, expose only public observations to decision policies, and preserve every legal action for replay. This is a research instrument, **not a calibrated human player or a fun score**. It replaces the old default simulation; historical runners are explicitly named `archival`.

## Run from the repository

Use the repository's existing Node and npm dependencies. No API key, new package or external model service is required.

```sh
npm run verify:player-lab
npm run simulate -- --runs 10 --horizon 100 --policies planner,opportunist --seed-base 8326001 --out .player-lab/study-a
npm run lab -- replay --file .player-lab/study-a/planner-0.private-replay.json
npm run lab -- model --dir .player-lab/model-a --new
npm run lab -- model --dir .player-lab/model-a --actions '[{"type":"place","rider":"p1","slot":0},{"type":"depart"}]' --reason 'Choice from the previous public observation'
npm run lab -- ui-scan --file /absolute/path/to/recorded-ui-log.jsonl
```

Output paths must be new; existing evidence is never overwritten. `.player-lab/` is ignored by Git. `baseline` always means this checkout. Named `--scenario` experiments apply absolute catalog overrides inside the isolated process only; they do not change the dev server or validate scenario prose. Inspect each manifest before comparing batches.

## Seven behavioral hypotheses

- `novice`: only the first two cards, at most two riders; no reseating or dismissal. Uses the guided opening.
- `merchant`: income versus visible operating and agitation costs.
- `explorer`: values new roles and relationships as well as income.
- `minimalist`: deliberately carries at most one rider, an adversarial low-load baseline.
- `planner`: visible sector energy budget and three-floor, two-sample lookahead across at most four finalists.
- `opportunist`: the same bounded planning budget, but deliberately tests short risk-link windows and useful high agitation rather than always buying silence.
- `investor`: identical departure scoring/search to `planner`, but invests before charging to full and does not automatically clear agitation. A purchase must preserve the ability to fund the next sector's motor baseline plus one power; passenger costs remain a risk. Introduced after UI R01 reached floor 100 alive, not calibrated to reproduce that run.

These labels exist only in research. `--opening policy-default` preserves guided novice and ordinary non-novice starts. Use `--opening ordinary` or `--opening guided` to hold openings fixed across policies; manifests/results record the choice. Persona comparisons are not isolated causal effects or human win rates. Opportunity counts currently check single-card placements; zero adoption cannot justify deleting a role.

## Information and verification boundaries

### Separate shop behavior from departure behavior

Use `--shop-style committed` in a batch to keep the selected departure policy but replace shopping with invest-first decisions constrained by the existing visible riders' prefix power budget, plus a declared two-power buffer. This uses the same preview service and upgrade effects as the game. It assumes scheduled departures and one baseline passenger after the cabin empties; unknown offers, Ghost delays and agitation failures are not guaranteed away. No random recharge is prepaid. The default `native` preserves each historical policy's behavior. Manifests record the choice.

This is not automatically the better shopper: compare it with charge-first and motor-only investment, including early failures, actual purchases, late cash, risky-bank payouts and agitation-band use. A policy label is not a game build or evidence of a balanced play style.

Follow [the strategy-diversity acceptance agreement](../../docs/design/2026-09-05-strategy-diversity.md): preserve strong conditional payoffs, investigate universal choices and missing role opportunities, and never rank agitation as an unconditional cost.

`game.mts` is the only checkout binding, using relative imports. There is no second game engine. Placement, dismissal, shopping, reserve cells and settlement call production functions. The UI's free withdrawal of a newly boarded rider is reproduced and regression-tested.

Observations expose exact forecasts, progress, retained repairs, reserve cells, public shop effects and known bands. Sealed fares, real random IDs and copy seeds are masked. Imagined futures use an independent stream, never the actual upcoming offers. The visible sector budget checks every prefix, so the next shop's free charge cannot rescue a death before arrival. Unknown offers, Ghost delays and future profile changes can still invalidate this estimate.

Every generated trajectory is replayed and its state hashes and economy checked. The manifest records game files, test files, parameters, seeds and split. Record directories contain per-floor public observations, shop decisions, private replay inputs, summaries and a diverse review queue. Private replay files are for the replay engine, not model decision inputs. Source or policy changes require a fresh batch; previously examined seeds are development evidence, not a fresh holdout.

`model` presents one public state at a time and accepts legal actions plus a reason. A full model run is still not UI play. For visual and interaction acceptance, operate a separately owned browser, mute **both** music and effects, record screenshots and public DOM, and do not edit/HMR the source during a counted game.

The UI log scanner only checks a narrow Chinese repair-wording case and mute button labels. It cannot certify layout, animation, English completeness, actual silence or enjoyment. A later audible incident demonstrated that off switches alone are insufficient: launch owned QA browsers with `--mute-audio`, verify the actual process flag, and set both game preferences off before navigation. Never use real speaker output for audio regressions. Human/player-like review remains necessary.

## Interpret results cautiously

Alive at the horizon means censored, not a win or a death. “No safe plan found” means no safe plan in the bounded search, not proof that the situation is impossible. Safe single-step entry into a maintenance floor is only a rescue window; repair affordability and legal exit still matter.

Review per-decade cash flow, paid dismissals versus declined offers, role adoption, actual state/bank payouts and the last five decisions. Reproduce meaningful counterexamples before tuning parameters. Validate promising candidates on fresh seeds and through complete muted UI games; do not tune only to a pleasing average floor.

### Inspector relationship audit

`audit-role-opportunities.mts INPUT_DIR OUTPUT_JSON` audits rejected offers in replayed post-decision cabins, enumerating free withdrawal of new offers and insertion into an empty seat. It checks every recorded state hash and rejects production-source mismatches except changelog copy. These local alternatives do not cover old-rider moves, paid dismissal, all simultaneous boarding combinations or future survival. Do not equate next-floor safety or an estimated power budget with a worthwhile choice.

The candidate now removes four legacy Inspector conflicts (Tourist, Lover, Musician, Nurse). `inspector-quiet-relations` remains a historical scenario alias and is now identical to the candidate graph; use `inspector-legacy-relations` to restore the four old conflict rules for a new comparison. Relations can influence encounter partners as well as placement, so matched seeds do not guarantee identical future offers. Earlier batches remain frozen and require their recorded source for strict replay.
