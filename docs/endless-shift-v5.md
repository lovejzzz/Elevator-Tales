# Elevator Tales v5 — endless shift

## Rules shipped

- No winning floor or hard endpoint. Highest reached floor is the primary result and a device-local endless record; legacy discovery progress is retained separately.
- All passenger trip labels use remaining stops. Ghost delays can increase the count.
- Every 30 completed floors increases travel cost by 1 energy and adds 1 agitation per occupied journey. Floors 1–30 use tier 0, 31–60 tier 1, and so on.
- Agitation: 0–2 riders −1/station, 3 neutral, 4–5 +1, 6 +2. Each normal arrival removes 1. Character-specific events still apply. There is no former midnight-hot-zone earnings bonus.
- At two-thirds of the current agitation cap (rounded up), patience consumes 2 per station instead of 1, based on departure state. Impatient exits add 2 agitation and receive no arrival reward. Reaching the cap ends the shift, except for a paid repair opportunity at the ten-floor shop.
- Every 10 floors offers three individually priced cards. Each is available once per shop; multiple purchases or skipping are allowed. Stock and prices do not reroll when buying. Express remains unique per run.
- Base prices: battery 35, solar 55, calm 35, concierge 50, reinforced 45, express 65. Each later shop adds 12; each existing copy adds 15. Battery immediately adds 8 energy and 5 capacity; calm removes 6 agitation and adds 3 capacity.
- At a checkpoint, resource failure can be repaired with paid cards. Simultaneous energy/agitation failure requires fixing both. A fatal fuse is not rescuable. Leaving without sufficient repair ends the run.
- Wallet is spendable, gross earned remains separate, and spending is their difference. Money and upgrades reset between runs; highest floor persists.

## Questions tested

1. Can the run continue through floor 60, and can later shops still function?
2. Does ignoring agitation have a meaningful survival cost?
3. Does spending income improve survival relative to hoarding?
4. Is shop affordability forcing choices without making the first shop inaccessible?
5. Can purchase sequences double-charge, overspend, reroll stock, erase gross earnings, or bypass a resource failure?
6. Do departure forecasts and actual settlement receipts agree?

## Simulation protocol

Final rules: 10,000 games, four visible-state heuristic policies with 2,500 seeds each (seed base 91007). Independent holdout: 4,000 games with 1,000 seeds each (seed base 791921). The 300-floor simulation horizon is only a safety censor, not a game endpoint; no run reached it.

Policies share starting seeds, but decisions consume random events differently, so they are not identical matched passenger sequences. Balanced uses earnings, energy, agitation forecast and purchase utility. Ignore-agitation removes agitation penalties and avoids calm cards. Hoard uses balanced boarding but buys nothing. Greedy overweights money and ignores agitation. These are simple heuristics, not human players or optimal search; they do not use old-passenger reseating. All use the guided opening.

| Policy | Mean floor, 10,000-game batch | Mean floor, holdout | Median, main batch | Reach 60, main batch |
| --- | ---: | ---: | ---: | ---: |
| Balanced | 76.69 | 76.61 | 77 | 96.4% |
| Ignore agitation | 26.76 | 26.42 | 27 | 0% |
| Hoard | 50.19 | 50.16 | 50 | 15.2% |
| Greedy | 26.06 | 26.21 | 26 | 0% |

Balanced main-batch p10/p90: 67/87; maximum: 98. Average 10.59 purchases, 1,274.15 gross earned and 883.63 spent. At 13,582 of 17,851 shop visits (76.1%), the wallet could not buy all three cards; only 19 visits could afford none. The first shop was reached in 100% of balanced runs. All six upgrade types were purchased.

Balanced deaths: 1,333 energy, 1,014 agitation, 109 simultaneous, 44 fuse. All 2,500 ignore-agitation runs and all 2,500 greedy runs ended from agitation. No forecast-bound violations occurred across 439,260 main-batch journeys or 175,401 holdout journeys.

Exploratory price multipliers 1.3 and 1.6 (800 runs each, before the final simultaneous-repair adjustment) reduced balanced mean survival to approximately 69 and 62 floors and encouraged purchase avoidance in this heuristic. Retained base pricing; those small exploratory batches are not evidence of optimal prices.

## Verification

- Engine tests explicitly cover floor 60 shop → 61 playing, floor 1,000 shop, uncapped future destinations, and all difficulty boundaries.
- Paid shop tests: exact deductions, gross-income preservation, insufficient funds, double purchase, absent stock, purchases outside shops, multiple cards, unique express, healthy skip, unpaid crisis loss, and simultaneous paid repair.
- 2,000 randomized states through floor 180 check forecast bounds and receipt/earnings invariants, alongside character, placement, lover, and fuse regressions.
- Audio regression tests: mute, shared context, distinct metric cues, staggered timing, cancellation and unavailable-audio fallback.
- Browser flow: physically board passengers, observe remaining-stop countdown, travel to the 10th floor, purchase two different cards, confirm wallet 115 → 50 → 0 while gross stays 115, disable purchased/unaffordable cards, and leave with upgrade effects applied to newly offered passengers.
- Desktop 1280×720 and mobile 390×844 shop layout checked; mobile dialog scrolls without horizontal overflow.
- Type check, support-module lint and production build pass. The main component retains two pre-existing synchronous-effect lint findings for storage initialization/persistence.

## Interpretation and limits

The mechanical loop now distinguishes resource management from blind boarding, and coins have a measurable survival use. These tests do not prove fun, addiction, optimal balance, or a human skill ceiling. Stronger planning and reseating may outperform the agents substantially. Survival clustering near floors 60–90 should be watched in playtests: the repeating 30-floor difficulty steps may eventually need smoothing. Next useful evidence is human first-session comprehension, reasons for refusal/purchase, and whether different upgrade paths feel meaningfully different.

Reproduce: `npm run verify`; `npx tsx scripts/simulate-balance.ts 2500`; `ET_SEED=791921 npx tsx scripts/simulate-balance.ts 1000`.
