# v8.32 design acceptance

This release preserves conditional power rather than equalizing every action or synthetic policy's average floor. There are no player-facing build names, adaptive prices, lineup-targeted punishment or forced floor-60 death.

## Frozen final rules

Agitation: low 0–2, medium 3–4, high 5+, base failure cap 8. Cap upgrades do not move bands. State is never sold or converted to power. Mechanic work, medium Tourist rewards, high Drunk premiums, controlled/uncontrolled bad-rider partnerships and stable upper-neighbor Mimic draws retain their distinct conditions and costs.

Final fixed-seed integration after the Mimic mixing fix: four public-information policies × ten common seeds, 40 synthetic trajectories, 1339 ascents and 3719 exact replay actions. Three trajectories passed floor 60, none passed 80 or reached the 100-floor censor. Planner median 44 (34–64); risk-window median 40.5 (29–66). Both delivered all 19 roles. Their banked bad-rider payouts were 20/148 coins and high-Drunk premiums 10/150 coins respectively. The other two, immediate-score policies had median 19: they lack the same three-floor imagination, so this is not evidence that economic or exploratory builds are inherently weak. Six trajectories had at least five consecutive free-seat refusals; no power death retained over 200 coins. These are model diagnostics, not human rates.

## Shop decision

Retain Stabilizer 45 coins, Express 45, Expanded Battery 35; four permanent slots and at most one purchase per shop. Bought abilities never reappear. Charging remains 2 coins/power and soothing 8 coins/point. Capacity buys 10 capacity, not free power.

All actual target offers were reviewed: Stabilizer 37, Express 33, Capacity 28. Only 2/6/10 respectively could be bought while retaining the model's visible commitment plus two-power buffer. The adaptive estimator rejects all Express offers and almost all Capacity offers because its historic direct-return estimate omits future turnover or discretionary capacity usage.

Every one of these 18 budget-qualified entries received a buy-versus-skip branch, with the same planner/adaptive continuation for both branches, ending after 20 floors or death. All 36 executions replay exactly; repeated controls and shared prefixes are not new independent games. All three abilities have useful conditional witnesses and bad timing witnesses:

- Stabilizer: one floor-20 purchase reaches 40 with 148 coins vs 74 without buying; another floor-40 purchase dies at 49 while skipping reaches 60.
- Express: one floor-40 purchase reaches 60 with 208 coins vs 109; another purchase dies two floors earlier, and four other common-endpoint comparisons retain less cash.
- Capacity: a floor-40 purchase actually uses 70 power and reaches 60 with 217 coins vs 109; another purchase dies two floors earlier, and most other common-endpoint cases retain less cash.

Cash is not the sole objective: energy, agitation, unpaid riders, future costs and remaining gear differ. These are adaptive continuation witnesses, not attribution of the whole cash difference to the card itself or proof of optimal play. Retain conditional investment, do not uniformly discount cards to make the estimator buy them.

## Difficulty and pacing decision

Accept expert breakthrough beyond 60 rather than introduce a hard ending or hidden punishment. The final model cohort meets the predeclared <=4/40 above-60, zero floor-100 censor and <=1/40 above-80 targets. These thresholds are engineering design checks, not a claim that 7.5% of human players pass 60. Earlier deep UI research includes 67/74-floor deaths and a technical interruption at 91; they do not establish a population frequency either.

Keep the intended 25–40-minute human session target. Tool execution speed and research wall time cannot verify it. The current design judgment accepts short interactions, optional quick reveals and distinct decade checkpoints; representative human timing remains an explicit observation item, not a fabricated test result.

## Verification scope and known limits

Rule checks cover state bands, forecast/settlement boundaries, multiplier exclusions, risk banking, pair-stable copying, progression, legal placement/dismissal and no repeated shop abilities. Player Lab includes 44 regression groups and exact action replay. UI research checked Chinese/English, desktop and narrow layouts, emergency repair, purchase warnings and failed runs. Forced-muted tests do not claim to have evaluated sound aesthetics.

No finite study proves that every possible mature strategy is perfectly equal. This release is accepted on observed conditional strengths, real costs and alternatives; low-adoption discovery, late investment pressure and human pace remain bounded watch items. Prior candidate experiments remain identified as historical, not silently relabeled as final-source evidence.
