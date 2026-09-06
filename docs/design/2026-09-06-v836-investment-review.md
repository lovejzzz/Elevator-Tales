# v8.36 research checkpoint — 2026-09-06

## Delivery state

Local only. Public Sites and GitHub remain v8.35. Do not publish this candidate as balanced.
Neutral experiment commit: `8e0a8e9`. Gameplay candidate commit before browser: `35eb228`.
The active goal is not complete: meaningful investment improved, but long-run containment remains unaccepted.

## Candidate

Fixed upgrade prices: battery30, capacity30, calm35, concierge35, reinforced40, express35, tipjar25, relay25, crowd30, meter20.
From31 one pre-shuffle rotating offer is capped at its role minimum+1. Other two ordinary. Express applies afterward. Same RNG consumption, role, risk and other attributes. No resource-adaptive rescue.
No motor, fare, agitation, probability, original role-range or combination changes. No global support-trip cap.

## Evidence

160 synthetic executions (includes8 repeated controls, not160 independent seeds). See `player-lab/V836-STUDY.md` and four v836 result roots. Every generated game was step-hash replayed. Replayed all24 final treatment records against adopted code: only release label8.35→8.36 migrated, every state hash unchanged. Strict original replay still requires original source.

Final fresh holdout:8 games/policy/arm, seeds193837999+i*97, horizon100, committed shop; planner, opportunist, minimalist. Active-policy upgrades/game0.75→1 and1.25→1.875; mean longest refusal streak5.125→4.75 and4→3.375. Minimalist trajectories unchanged. Above60 active policies1/16→0/16. Planner median47.5→46.5, opportunist39.5→44.5. No universal survival gain. Development had100-floor censoring.

## Browser sample: R836-01

Owned headless `et-v836` launched with `--mute-audio`; process identity guard before/after commands. Music and sound localStorage both off and asserted on every observation. No user Chrome/OS audio changes. Same document timeOrigin1788672449962.6, no reload or game-state injection after start. Visible UI decisions only; no future RNG access. Screenshots and per-decision reasons: `player-lab/results/v836/browser.jsonl` and `real-*.png`.

**Censored alive at100**, not a death, win, or completed run.9/70 power,378 coins,1/8 agitation, one remaining Lover. Income1492, spending1114. First reserve-cell use98. Around29.5 minutes including automation; not a calibrated human completion time.

Purchases:10 Relay25 (leave38 power),20 Concierge35 (leave46),30 Capacity30 (70),40 Stabilizer40 (70). Reserve bought30, first used98. Subsequent shops full70. Four abilities by40 versus one in prior unrelated v8.35 sample; different randomness, not causal human A/B.

125 successful boarding actions across18 roles: Lover11, Courier19, Tourist6, Commuter15, Mechanic5, Thief11, Drunk6, Cop2, Musician3, Nurse7, Child8, Coach10, Exorcist5, Ghost7, Inspector2, Bomb4, Mystery2, Celebrity2. Mimic not selected; no high-base/zero-energy above-source opportunity worth its available placement in this run. Not evidence to delete Mimic.

Space-available offer floors:1–29 rejected all2/27 (4,29);31–59 rejected all3/26 (33,35,54),39 boardings;61–99 rejected all7/36 (63,73,77,82,91,93,95),42 boardings. Shop exit ascents excluded. These are descriptive counts, not identical to synthetic policy metrics.

## Findings

- Good: early investment is tangible; Relay encourages aligned arrivals but several failed rolls keep uncertainty. Courier/Mechanic, Nurse/Child, high-band Drunk, Coach payouts, Celebrity's one neighbor, variable Mystery fare, controlled/isolated Ghost all had moments.
-36F three-stop Drunk briefly linked to Thief, then high-band payout25 at39.75–79 Nurse/Coach/Drunk kept high band without escalating out of control. Risk was chosen and readable.
- Long trips were sometimes preferable:47F long Exorcist/Ghost selected over short high-risk Commuter.54F had to relocate Ghost and accept one Nurse conflict opportunity. Isolation reserves neighboring seats: a real cost, but apparently insufficient to stop this run.
- Main unresolved issue: shop-entry coins60:286,70:296,80:301,90:338,100:378, while near-empty power repeatedly refilled and reserve untouched until98. Strong investment plus repeated Ghost/control/three-rider stabilizer and aligned arrivals can sustain well past60. One run does not establish dominance or likelihood; it DOES expose a missing high-skill test policy.
- Test gap: planner's few-floor search and conservative investment do not represent this human-like long-horizon tactic. Do not tune to its median alone. Upgrade thresholds, zero-energy riders counted toward stabilizer, arrival synchronization, no-future-loot power budgeting and explicit support-expiry relocation need policy coverage.
- UX:1440×900 all three cards readable without internal/page scroll; rail overflow0, page overflow0; no browser errors. Same-frame animated rail values can lag actual fixed shop wallet—wait for animation before numeric assertions. Center receipt briefly covers cabin, worth revisiting. Mimic repeats upward-copy heading. No blanket small-screen/English visual claim this round.

## Next bounded work

1. Add a public-observation-only long-run policy with a fixed planning budget using the above tactics; keep current policies as controls and forbid actual future access.
2. Validate on withheld seeds and record both rejection streaks and sustainable resource surplus. Test fixed-packet counterexamples for Ghost/Steady/Relay/Capacity, not isolated nerfs based on one game.
3. Compare candidate with explicit v835-baseline and moderate-prices-only using the SAME stronger policy. Preserve source and trajectories; do not relabel this100-floor sample as a completed game.
4. Decide from those comparisons whether narrower changes suffice. No price inflation, hidden rescue, forced death floor or removal of clever combinations by default.

Regression: ordinary verify suite passed, Player Lab44 passed, v8362000 paired packets671 shortened with unchanged RNG/attributes passed, tsc and production build passed before play. Final full verify (including v836), Player Lab44, tsc, build and git diff --check all passed after documentation updates. Existing build chunk-size and Node deprecation warnings remain non-fatal.
