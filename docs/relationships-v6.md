# Elevator Tales — v6 mechanics and validation

## Implemented rules
- Initial electricity 20, capacity 24. Travel costs 2; all savings combined can reduce this to 1, never generate electricity.
- Every ten floors, a permanent charging service sells 1 electricity for 2 coins. Recommended refill targets the next leg plus a 2-electricity buffer. The shop shows the reserved charging budget and warns before an underpowered departure.
- A passenger who has traveled at least one floor may be dismissed while doors are open. Compensation is 4 + remaining stops × 2. No arrival reward or arrival agitation relief. Already earned en-route income is retained. This does not reveal hidden fare.
- Installed-upgrade inventory is available from the header and shop. It reports current cumulative effects, installation counts and capacity limits.
- Every identity has cooperation and conflict preferences. A liked adjacent character grants +3 arrival coins (contract adds +2 per installation); an avoided adjacent character adds +1 agitation on even floors unless a liked neighbor is present. Existing special abilities remain.
- Mystery unlocks at floor 10: weight 1–3, route 2–7, patience margin 2–6, randomized preferences, hidden fare 8–40 fixed on generation and revealed only at arrival.
- Shifter unlocks at floor 20: weight 1–4, fare 28–48 and preferences reroll after each arrival while still aboard. Destination and existing patience do not reset. Overload after a change adds 2 agitation on the next travel and appears in the forecast.
- Mimic unlocks at floor 20: one distinct attribute from each adjacent passenger, up to three (weight, fare, relationship preferences). Same neighbor set keeps the assignment, source values update live, missing neighbors remove their contributions. Other mimics supply base properties only; hidden copied fare stays hidden. No copied skills, routes or fuses.
- Existing battery upgrade is replaced by cooperation contract; solar by unique efficiency wiring. Electricity capacity remains 24.

## Automated checks
- Standard mechanics regressions, 2,000 forecast/receipt states, audio tests.
- 5,000 randomized complete states including all 21 identities: forecast bounds, receipt sums, immutable transitions and post-copy weight limits.
- Explicit tests for dismissal idempotency, no overdraft, no hidden-fare leak, charging bounds, single-use upgrades and nonrecursive copy.
- Historical electricity experiments remain reproducible against a frozen v5 baseline in experiments/v5.
- Type checks and targeted lint passed. Production build passed.

## 10,000 full-game simulations
Real production engine, 5,000 runs per policy, seed base 660301, horizon 600. No simulation reached the horizon. See v6-simulation-results.json.

| Policy | Median floor | Mean floor | 10th–90th percentile | Best |
| --- | ---: | ---: | --- | ---: |
| No dismissal | 69 | 71.3 | 46–93 | 182 |
| Paid dismissal | 99 | 105.3 | 68–147 | 326 |

Paid-dismissal policy averaged 5.46 dismissals and 56.18 compensation per game. Fuse failures fell from 90 to 3; power failures rose from 1 to 80, consistent with a cash tradeoff. Agitation caused the vast majority of failures in both policies. Both policies reached the first shop in at least 99.96% of runs. Forecast errors: zero.

These are two specific greedy bot policies, not optimal strategies or human playtest results. Both charge before purchasing upgrades; the dismissal policy may spend future charging budget to remove current risk. Hidden fare is valued using a fixed prior rather than its actual value. Policies share starting seeds but diverging random-event consumption changes later offers, so results are not exact matched trajectories. Different bot policies need separate testing; these runs establish functionality and useful counterplay, not proven fun, retention or ideal balance.

## Browser verification
- Actual touch-sized UI flow: initial start, board lovers and courier, travel floors 1–5, inspect an existing rider, reject unaffordable dismissal, confirm an affordable dismissal (14 → 8 coins; earned remains 14; rider removed).
- Local-only React test fixtures (not shipped hooks): floor 9 departure into a 0-electricity shop; +1 charging, low-power leave confirmation, recommended refill, purchase efficiency wiring, open installed inventory from shop, return and leave.
- New-rider fixture: board all three through visible controls, inspect copied hidden fare, depart; Mystery reveals 22 in the arrival receipt; Shifter revision advances; Mimic changes from two copied fields to one after its neighbor leaves.
- Desktop 1440×900, mobile 390×844, small mobile 320×568 visually inspected. Small-mobile document remained exactly 320×568 with departure button visible; core play needs no page scroll. Long rule dialogs and desktop candidate list can scroll internally.
- Browser errors empty.

## Art
Three original noir portraits retain the existing dark/gold painterly style. Generation prompts are recorded in passenger-art-v6-prompts.json; runtime metadata is in lib/passenger-assets.ts.

