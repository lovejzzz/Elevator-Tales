# Elevator Tales v8.16 — all-rider balance checkpoint

This checkpoint evaluates the current 21-rider roster with the live rules, visible information, shop economy, and exact next-floor forecasts. Program policies are diagnostic tools, not human win rates or proof of optimal play.

## Frozen candidate

- Initial power: 42; capacity: 60.
- Tourist: 18 base fare, 1 power/floor, 4–7 floors, +1 coin/floor per distinct adjacent non-Tourist profession, capped at +2.
- Courier: 6 base fare, 1 power/floor, 1–3 floors, recharge 1 power on arrival.
- Coach: 20 base fare, 2 power/floor, 3–6 floors; multiplier rules unchanged.
- All other rider values remain unchanged from v8.15.

## Evidence

- 221,126 complete games across baseline and parameter experiments.
- 86,016 controlled rider trajectories comparing adjacent support, separated support, adjacent conflict, and separated conflict states.
- Final holdout uses a new seed: 33,200 games. Four whole-run styles receive 2,000 games each; every rider receives 400 normal, 400 favor, and 400 ban runs.
- All next-floor power and agitation forecasts contained the resolved outcome. Forecast misses: 0.

| Style | Mean | Median | P10 | P90 | Reach 20 | Reach 40 | Power / agitation / fuse deaths |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Balanced | 41.45 | 44 | 20 | 57 | 91.55% | 66.75% | 539 / 1,458 / 3 |
| Synergy-first | 37.87 | 43 | 18 | 54 | 85.95% | 58.30% | 640 / 1,359 / 1 |
| Frugal | 51.55 | 49 | 43 | 65 | 99.50% | 93.40% | 15 / 1,976 / 9 |
| High-risk | 22.02 | 19 | 9 | 43 | 46.40% | 15.45% | 1,495 / 504 / 1 |

The dominant failure resource changes with strategy. Conservative play solves power but remains vulnerable to agitation; aggressive loading fails mainly from power. Full-cabin greed does not dominate.

## Rider screen

Normal selection rates span 17.7%–62.2%, so no rider is an automatic reject or automatic pick under the test policy. Favoring Tourist changes mean survival by +0.20 floors, Courier −0.38, Coach −0.68, and Mechanic +0.27. The intentional risk card Thief changes −3.34 floors when over-forced.

Mechanic remains the only material watch item. Completely banning the roster's main sustained-saving specialist costs 13.95 floors, although forcing additional Mechanics provides almost no further gain. This supports treating Mechanic as a build anchor rather than a stacking exploit, but human play should determine whether a third sustain route is needed.

## Rejected variants

- Mystery hidden fare valued at zero: rejected as a policy-model error; a repeat player can value the public 8–40 range at its expectation without seeing the sealed result.
- Courier recharge 2: reduced balanced power deaths too far and shifted too much sustain value to Courier.
- Initial power 36: restored a near-even failure split but caused too many pre-stability deaths before floor 20.
- Coach power 1: removed its individual trap but made power broadly non-threatening.
- Guaranteed energy upgrade at low-power shops: barely reduced Mechanic dependence while interfering with shop variety.

Run `npm run audit:passengers -- 2500 400` for another full-roster sample. Use `ET_SEED=<integer>` for a fresh holdout and `ET_KINDS=tourist,mechanic` to limit favor/ban comparisons while keeping the four global styles.
