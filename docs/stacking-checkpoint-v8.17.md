# Elevator Tales v8.17 — stacking checkpoint

This checkpoint tests duplicate riders, multi-link formations, support fan-out, upgrade interaction, and random-copy behavior across all 21 riders. Program policies are diagnostic tools, not human win rates or proof of optimal play.

## Correctness fix

Rider cards state that each red adjacency conflict adds 1 agitation on even floors. The engine previously added that agitation on every floor. v8.17 makes the next destination floor's parity authoritative: even floors settle all visible red links, odd floors settle none. A green support link still suppresses only the generic red-link layer, not intrinsic or volatile rider pressure.

## Test volume

- 55,604 complete games: 8,000 strategy baselines, 37,804 all-rider normal/favor/ban comparisons, and a rejected 9,800-game Mechanic variant.
- 306,663 controlled cases: all 194,481 center-rider plus three-neighbor formations, 100,000 Mystery/Shifter trait draws, 12,000 Mimic copy assignments, 120 directed green/red stack checks, and 62 skill/upgrade curve points.
- Zero power or agitation forecast misses.

## Core curves

| Stack | Result |
| --- | --- |
| Mechanics 0→3 added to fixed demand | total power 7→6→5→4; each copy gives exactly 2 savings and never erases the motor |
| Controlled Apparitions 0→3 with enough demand | savings 0→1→2→3 |
| Couriers 1→3 arriving together | recharge 1→2→3; net floor power remains −1 because each Courier first consumes 1 |
| Lovers 1→6 in their best layouts | green edges 0→1→2→4→5→7; same-floor arrival total 6→32→58→104→130→176 |
| Cooperation Contract levels 0→5 on six Lovers | 176→204→232→260→288→316; a constant +28 per level |
| Coaches 0→3 around a Tourist | Tourist base fare 18→27→36→45 |
| Concierge levels 0→3 in the three-Coach formation | 45→48→51→54; tips remain outside the multiplier |
| Distinct Tourist professions 0→3 | bonus 0→1→2→2; hard cap holds |
| Inspectors 1→5 | 1/2/3 Inspectors pay 1/2/3; at 4/5, total power exceeds 4 and pressure becomes 4/5 |
| Celebrities 1→6 in their best layouts | attention income 0→6→6→12→6→0; five and six introduce 3/6 agitation |

One Nurse can calm and monetize up to three adjacent Drunks; one Officer can pause up to three adjacent Fuses; one Officer surrounded by three Thieves creates six directed green links and 3 controlled-income coins per floor. These results are linear and bounded by the three-neighbor geometry and six-position cabin.

## Full-game screen

Each rider received 600 normal, 600 favor, and 600 ban games on paired seeds. Favoring a rider increased duplicate-cabin time as intended: Lover rose from 7.2% to 25.2%, Commuter 2.9%→13.3%, Tourist 7.7%→15.0%, and Mechanic 9.4%→10.9%.

No favored duplicate strategy gained more than 1.09 floors. Lover changed −0.67 floors despite its high theoretical payout; Mechanic changed +1.09, Courier +0.61, and Counsel +0.79. Blind Thief favoring changed −4.50 floors because duplicated Thieves without enough Officers/Counsels retain their risk. Controlled Thief fan-out is valid; unsupported Thief spam is intentionally not.

The best late-game theoretical star is two Mechanics plus two Celebrities: 6 coins per floor for only the unavoidable 1 motor power. It requires Celebrity unlock at floor 40, multiple specific offers, and exact placement. Neither Mechanic favoring nor Celebrity favoring dominated complete games, so the formation remains a rare build payoff.

## Rejected variant

Reducing every Mechanic from 2 savings to 1 was tested for 9,800 games. Balanced mean fell to 38.54, floor-40 reach to 56.5%, and aggressive median to floor 10. Banning Mechanic still cost 11.43 floors, so the change made power overly dominant without solving the lack of alternative sustain routes.

## Decision

Keep all public rider values unchanged. Ship only the conflict-parity correctness fix and retain the stronger stacking audit as a release regression. Mechanic remains a sustain-route watch item, not a duplicate-stack exploit; future work should add or improve an alternative sustain route instead of obscuring its simple 2-power saving rule.
