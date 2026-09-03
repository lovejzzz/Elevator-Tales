# Elevator Tales · service-linked rest / fuse ordering

## Scope

User approved fixing the bomb/impatience loophole and reducing long empty
cruising, with publication to the existing public URL. Initial electricity
remains 20/24. Passenger skills, relationship bonuses, fares, upgrade prices
and endless scoring are otherwise unchanged.

## Changes

- After destination settlement but BEFORE patience removes passengers, latch
  whether a bomb fuse has expired. Simultaneous patience expiry cannot erase
  fatal failure. Reaching the destination on the same step remains safe.
- Start with 3 empty-rest charges. An empty departure spends one to waive that
  step's long-shift fatigue; spacious-cabin relief and electricity use remain.
- Each successful delivery restores 1 charge, capped at 3. Boarding, free
  withdrawal, dismissing, impatience loss and shopping do not restore charges.
- At zero charges, empty trips remain legal but incur normal long-shift
  fatigue. They are not categorically forbidden and there is still no end floor.
- The meter shows the remaining charges, is animated and opens the rule
  explanation. The departure forecast explicitly shows exhaustion / spending.
- Narrow-screen typography was adjusted after a 320×568 browser check found
  the added label overflowing into the load meter.

## Method

Actual engine, legal placements and paid shops; no independent approximate
simulator. All 37 previous strategy configurations were retained. Six added
policies value successful deliveries for rest or alternate service/rest.
Mystery fares remain masked in decisions; lookahead uses its own RNG and no
future offers. Strategies do not deliberately exploit the old bomb bug.

- Discovery: 43 policies × 100 seeds = 4,300 games.
- Holdout: 14 policies × 300 disjoint seeds = 4,200 games.
- Conditional stress cases: 6 policies × 4 contexts × 100 seeds = 2,400 games.
- Total: **10,900 games**, 950,054 checked transitions.
- No pressure/electricity forecast mismatches. No runs hit the 600-floor
  simulation horizon (the horizon is a test guard, not a game endpoint).
- 231 unordered two-character rosters: 29,568 four-step journeys;
  1,330 triple rosters: 7,980 arrangement/context checks;
  126,310 checked transitions plus 10,000 copy checks.
- Default verification includes 26 bomb timing cases and 5,000 new randomized
  states varying empty-rest reserves, in addition to prior 7,000 states.

## Holdout results

Each row uses the same 300 seed indices. Mean floor is a simulated heuristic
performance measure, not a prediction of human enjoyment or difficulty.

| Policy | Mean floor | Empty departures after floor 80 |
|---|---:|---:|
| Two-rider service/rest + calm spending | 115.78 | 26.94% |
| Rest-aware lookahead | 115.22 | 30.86% |
| Conservative flexible occupancy | 114.39 | 27.06% |
| Rest-aware conservative | 112.97 | 28.04% |
| Calming-character preference | 105.68 | 28.09% |
| Balanced three-rider cap | 97.98 | 27.01% |
| Shifter preference | 97.81 | 27.01% |
| Mimic preference | 96.63 | 26.45% |
| Lover preference | 96.54 | 27.41% |
| Always carry someone (ablation) | 95.60 | 0% |
| Stop boarding at 80 | 93.79 | 89.11% |
| Police/thief preference | 90.73 | 24.51% |

The two leading policies differ by 0.56 floors (paired bootstrap descriptive
95% interval −0.58 to 1.70); the leader wins 50.33% of paired seeds against
lookahead, ties 2%. This is not evidence of a decisive universal advantage.

The old empty-bank policy averaged 298.77 in the prior 300-seed holdout and
now averages 93.79. Always-carry ablation is unchanged at 95.60; ordinary
service rules were not made harder. Flexible play keeps a meaningful short
rest advantage without extending for hundreds of empty floors.

The three strongest normal policies continue boarding until mean floors
113.41, 113.38 and 112.29 respectively, about two floors before their ending.
They do not finish with long retired/cash-only phases.

Conditional cases favor lookahead in cash-poor, midgame and late-build starts;
the conservative policy narrowly leads under a high-agitation start.
These conditional fixtures are not population-weighted outcomes.

## Interpretation and remaining risks

This closes the confirmed bomb exploit and the long empty-cruise advantage.
It does NOT prove absence of a global best policy: a finite heuristic pool
cannot do that. Calm spending and conservative occupancy remain strong.
Fixed character preferences underperform flexible selection, but their bots
are not optimized equally and this alone does not justify nerfing characters.
The new small rest resource is a clarity/complexity tradeoff to watch in human
playtests; statistical simulation cannot establish fun.

The previous audit's thief/police bonus stacking, potentially disadvantageous
mimic changes and nonadjacent helper behavior remain recorded in the v6 report;
they were not silently changed in this narrow release.
Existing local best-floor history is preserved; old and new balance outcomes
should not be treated as directly comparable personal skill measurements.

## Reproduction

Historical v6 audit scripts now import the frozen modules in experiments/v6;
their original result files still identify the original source revision.
Current audits use the v61 scripts. JSON reports include seeds, configurations,
per-game outcomes, forecast checks and descriptive paired comparisons.

Run npm run verify, the v61 relationship audit, and the v61 tournament with
train / validate / stress modes. The release runtime is entirely client-side;
browser validation follows taps → game state → forecasts/metrics/result.

## Browser checks before publication

- Real tap flow: seat the guided lover pair, travel nine steps, receive
  40 coins, charge from 2 to 22 at the tenth-floor shop for 40 coins, leave.
  Rest stayed at zero across charging and shop exit; fresh offers had positive
  remaining stops. Empty-only run reached the same shop without money, with
  both charging controls correctly disabled.
- Local-only injected scenario: at floor 81 with one rest charge and stress 8,
  successive real departure clicks produced floor 82 / stress 7 / rest 0,
  then floor 83 / stress 8 / rest 0. The rule dialog forecast matched +1.
- Local-only bomb scenario: floor 43, fuse 1, patience 2, high agitation:
  next departure showed the fatal fuse result at floor 44.
- 1440×900 desktop, 390×844 phone and 320×568 small phone inspected.
  No main-page scrolling on the phone sizes; rest and load no longer overlap.
  Rule modal remains independently scrollable.
- No captured browser errors. HMR-only fixture screenshots can retain old
  offers after component edits; final real-flow check used a clean reload.
- These injected fixtures are test-only browser state, not production hooks.
