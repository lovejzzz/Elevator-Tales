# v8.36 research checkpoint — 2026-09-06

## Latest revision: R836-02 censored alive at120

This section supersedes the archived candidate below. Current gameplay checkpoint `dabec4b`: original public v8.35 prices, one role-minimum offer from31, localExtra0. No mechanical changes during this continuous browser sample. Public remains v8.35; long-run acceptance is unresolved.

Owned muted browser `et-v836-02`, timeOrigin1788676432324.9, visible UI only, no state injection or future RNG access. Stopped observation at120 shop, alive and repairable:0/60 power,190 coins,7/8 agitation, income1468/spending1278, no reserve. Not a win, death or terminal game. Session closed after recording final screenshot and research-stop. Raw observations: `player-lab/results/v836-02/browser.jsonl` in the research workspace.

Upgrades: battery30 at10, meter25 at20, reinforced45 at30, relay30 at40. Reserve bought50/70/80/100; used68/78/98/117. Paid dismissals36 Coach8 and62 high-risk Mechanic8. Shop-entry coins100:136,110:182,120:190: the later recovery disproves a steadily declining-cash interpretation. Many tight power checkpoints coexist with a financially sustainable late run.

The48 fresh same-policy synthetic comparisons had candidate maximum65; this120-floor counterexample demonstrates limited policy coverage, not a measured human success rate or proof of universal dominance. Do not nerf Ghost/Steady based on eligibility alone: capped Ghost savings can substitute for Steady's saving. Any ablation must include adaptive placements and overlapping caps.

Play-reading corrections: only one old-rider move per floor; unsuccessful second moves were rejected, not random placement. The limit text was hidden in the desktop layout; selected-after-used now shows a visible cabin hint. Uncontrolled Ghost delay repeats on destination floors divisible by3, not once per journey. Tourist medium bonus reads departure agitation, not post-ascent agitation. Added regression cases for both timings and clearer bilingual short cards; shortened English action to Ascend. No gameplay parameter changes in this wording checkpoint.

Separate forced-muted injected UI fixtures (not games): Ghost/Tourist/Nurse in Chinese and English at1440×900 and1280×800; all card text bounds and page height passed. The apparent62px card overflow came from decorative pseudo-element sheen, not clipped rules; check rendered text bounds instead of raw scrollHeight. Actual selected-move hint and Ascend were also inspected. Screenshots: `player-lab/results/v836-copyqa/`.

Verification for this wording checkpoint: full npm verify, Player Lab49, TypeScript, production build and diff whitespace checks passed. Release/internationalization checks and build repeated after the final bilingual evidence update. Owned QA browser closed. Existing Node deprecation and bundle-size warnings remain non-fatal. This completes a documented local research iteration, not final balance certification or publication.

## Archived earlier checkpoint

### Acquisition audit: carried obligations and marginal valuation

Browser shop affordability reconstructed from public fixed totals/remaining trips: selected upgrades at10/20/30/40 pass current purchase gate (available vs budget+2:41/29,52/34,45/40,58/40). Unknown ride ages set1; not hidden-state/history replay. Exact prior synthetic operator replays show different obligations: shop10 four4–5-stop riders makes tipjar34available vs42required; shop20 battery36vs37. Another seed meter35vs36. Positive valuation alone cannot overcome carried load. Next policy experiment should value discretionary investment room when approaching shops, not simply remove the safety gate.

Fixed Lab-only valuation bug: Steady opportunity now uses actual marginal total power with/without upgrade, accounting for overlapping Ghost savings. Added zero-marginal and one-marginal regression;53 Lab checks and TypeScript pass. Actual game remains unchanged. Raw diagnostics in `audit-browser-shop-budget.mts` and `audit-acquisition.mts`; research workspace `player-lab/V836-ACQUISITION-AUDIT.md` records limitations. No new cohort or public release.

### Cooperation payoff/price diagnostic: not adopted

Neutral `ECONOMY_RULES.cooperationIncrement` defaults2; process-only `cooperation-access` sets1 and price20 instead of30. Base cooperation1 and neighbor stacking remain.24 conditional executions (12 repeated controls+12 treatment), exact replay. Four buffer/no-battery complete transcripts identical across arms. In eight affected pairs:206 common ascents, refusals63/204→78/202, boardings216→208, longest-streak sum18→25. One observed-controlled treatment still censored120 with270coins vs216 baseline. Fewer censors does not compensate for degraded intake.

Reject adoption under the prospective conditional gate; price reduction's early acquisition effect is not measured by prepaid fixtures.52 Lab checks, TypeScript, full verify/build pass. Live cooperation remains30coins/+2. Research workspace `player-lab/V836-COOPERATION-STUDY.md` contains parameters/results.344 earlier whole-run executions plus64 conditional executions are separate counts. Next audit policy acquisition against successful player evidence rather than continue scalar nerfs; conditional tails do not measure natural frequency of strong builds.

### Rejected fixed late-motor curve

Process-only switch `MOTOR_RULES.lateSteps`, default false:71–90 motor7,91+ motor8 capped, other rules/prices intact.24 conditional runs (12 repeated baseline,12 treatment), exact replay. Baseline reproduces prior outcomes. Treatment ends79–108 with no censor, versus3 baseline120 censors;11/12 common-exposure pairs have MORE space-available refusals. Strong observed-controlled cases go7→15 and3→9 refusals, longest2→4 and1→5. This is a counterexample to equating shorter survival with better balance. Reject adoption: live motor remains6, no full-run or holdout spent on this failing development arm.

51 Lab checks, TypeScript, full verify/build pass. Shared schedule/forecast/advance notice handles the disabled experiment without altering normal rules. Research workspace `player-lab/V836-LATE-MOTOR-STUDY.md` and results/v836-late-motor-development contain protocol and paired analysis. Counts:344 prior whole-run synthetic executions plus40 conditional executions, including12 repeated controls. Next investigate cooperation upgrade's marginal payoff alongside purchase price, preserving ordinary relations; no income change selected yet.

### Invested continuation coverage

Added optional explicit initial-world fixtures to the trusted Lab runtime and exact replay, without changing ordinary runs or policy inputs.50 Lab regressions, TypeScript and full game verify pass; four old normal trajectories retain every step hash. No live game parameters changed.

Six loadout/start-cabin combinations×two seeds plus four cap comparisons:16 conditional61→120 probes, not16 full games. Baseline observed battery/meter/reinforced/relay with controlled Ghost/Exorcist start reaches120 in both seeds,216/156coins from60 starting coins;48/44 actual Relay power. Earnings setup also reaches120 once without Relay. Energy at shops remains nearly empty while income sustains purchases. This matches the qualitative real-browser counterexample without copying hidden RNG.

Provider cap remains inconclusive as a remedy: observed neutral94→120 and99→99; controlled120→120 and120→91. Both arms2/4 censors. Buffer set dies79–97 in these limited probes; no universal weakness claim. One apparent rich-player missed dismissal was checked: all dismissal allowances already spent at78, so the action was genuinely unavailable. See research workspace `player-lab/V836-CONTINUATION-STUDY.md` for prospective protocol, all outcomes and next comparison.344 earlier synthetic full-run executions plus16 conditional fixtures are separate counts.

### Subsequent savings diagnostic (no gameplay adoption)

`scripts/player-lab/audit-savings.mts` enumerated8192 static placements/Steady states. Ghost-provider cap changes340; Steady's apparent zero-energy occupancy benefit occurs in1254 states but actually saves power in849. Do not infer causal saving from occupancy eligibility. Scenario equality assertion verifies the cap is the only override.

Eight new development full runs, seeds193842701+i*97 for i0–1, planner/operator, committed shops, horizon160: baseline29/56 and46/39; cap29/48 and46/39. Each step-hash replayed. All eight bought zero permanent upgrades. Post-hoc replay audit: only baseline planner1 had cap exposure (departure35/36/37/50). The equal operator outcomes do not test the invested loop. Reject adopting this cap from these data; next coverage must explicitly include invested continuation fixtures, separately labeled from whole runs. Research workspace `player-lab/V836-SAVINGS-STUDY.md` records the prospective protocol and full results. Cumulative344 synthetic executions include repeated controls, not independent seeds.

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
