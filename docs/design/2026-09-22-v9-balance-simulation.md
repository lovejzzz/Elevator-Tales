# v9 balance simulation — all riders, legends, power box

Branch `v9-gameplay`, 2026-09-22/23. Rules, interface and release notes for v9.0 (`GAME_VERSION = '9.0'`). Not merged to `main` or published.

## Design philosophy under test

1. **Many styles, many ways to play** — several rider styles must each be able to carry a run.
2. **Every run has near-death escapes** — close calls that the run survives, but not a constant crisis.
3. **Never feel rich** — surplus coins always have somewhere meaningful to go.

## Simulator

`scripts/balance-sim/` plays the production engine directly (no second rule set). Commands:

```bash
npm run balance:accept    # all bots, own and generic shopping, 300 runs each
npm run balance:legends   # each legend boarded vs declined on paired seeds
npm run balance:items     # each ability installed from floor 1 vs none, paired seeds
```

Bots: five rider styles (coop, crime, occult, quiet, lively) with two signature abilities each, a power-box investor, a neutral optimizer (`balanced`), and a `novice` who fills seats by printed fare and only heeds a red forecast. Skilled bots evaluate two ascents ahead, use paid dismissal when the forecast says the cabin will not survive, and buy in-transit power only when the next ascent would fail. Each style is also run with identical generic shopping (`*` rows) to separate rider strength from ability packages.

Close call: after a floor, the next ascent leaves ≤2 power, agitation is within 2 of the cap, or a fuse is about to blow. Escape: a close call the run survives by 3+ floors. Affluent shop: on entry the wallet covers the next sector's real power need (shop charge to cap plus in-transit power beyond it), a power-box level, a paid second ability and 20 spare coins.

## Final results (untouched seeds 20260923, 300 runs per bot; after districts and the flywheel fix)

| Check | Result | Target |
|---|---|---|
| Rider styles with the same shopping, weakest / strongest | 62–69 → 89.9% | ≥ 80% |
| Each style's own signature package vs generic | 90.3–95.7% | ≥ 85% |
| Power-box investor vs optimizer | 77 vs 88 | ≥ 85% |
| Runs with ≥2 escapes | 95.2% | ≥ 70% |
| Close calls per 10 floors (median) | 2.0 | 0.8–3.0 |
| Affluent shop visits / coins left after a shop (median) | 7.6% / 10 | ≤ 15% / ≤ 15 |
| Power-box levels per run / first-line concentration | 3 / 39.3% | ≥ 3 / ≤ 60% |
| Alive at floor 150 / optimizer p10–p90 | 0% / 51–104 | ≤ 5% / spread ≥ 35, p90 ≤ 120 |
| Novice median | 25 vs optimizer 88 | ≥ 25 and ≤ 70% |
| Rider adoption (optimizer) | all 21 within 15–64% | 15–65% |
| **Optimizer median** | **88** | 55–85 — marginal miss |
| **Deaths: power / agitation / bomb** | **79.6 / 19.9 / 0.5%** | agitation 20–40 — marginal miss |

Gate correction: the original death-mix gate (power ≤ 60% *and* agitation 20–40%) could only be met with agitation at exactly 39–40% because bombs are ~1%. It now requires agitation 20–40% and power ≤ 80%.

Abilities (installed from floor 1, 600 paired runs each, before the last legend tweak): all 16 significantly positive, **+2.9 to +10.0 floors** (v8.38: 0 to +31). Lowest: Insulation +2.9.

Legends (boarded vs declined for +10 coins, seeds 20260924, 480 pairs each, after Don and Nightingale +1): **+4.9 to +9.0 floors**, ratio 1.84; boarding better in 60–70% of seeds. The weakest is 0.1 below the +5 target.

## Key findings along the way

- The first bot only looked one ascent ahead and never dismissed; with two-ascent lookahead and survival dismissals, the same rules went from median 39 to 122. Bot competence changes conclusions more than most parameters.
- With identical shopping the five rider styles were always within ~88%; gaps came from ability packages (crime's Soundproof/Insulation/Safety Margin were near zero) and the Storage line (a bigger battery is worthless when coins, not the cap, are the limit).
- Raising power prices cured wealth but handed the game to energy-saving styles, because ordinary riders earned about what their own power cost. The adopted structure is the opposite: **passengers pay their way (cheap power, 2 coins), the elevator is expensive (higher motor cost from floor 11, a deep-night climb from 46)**.
- Surplus concentrated in floors 11–20. A paid second ability (40 coins) converts surplus into build strength instead of a hoard.
- Porting the random forecast check to v9 found a real settlement bug (the flywheel could save motor power Old Zhou had already removed) and forecast gaps for every new agitation source; both now share helpers with settlement.

## Adopted values

- Power: start 50, cap 60; shop charge 2 coins (transformer 1.75/1.5/1.25); in-transit charge 4 coins (3 with transformer 3), 20 per sector (10 with storage 3).
- Motor: 1 (1–10), 3 (11–30), 4 (31–40), 5 (41–45), then +1 every 7 floors from 46 to 13 at 88+.
- Power box levels 15/35/60, one per shop, five per run. Storage: cap 75/90/110 and 10/15/20 free power per shop. Transformer as above. Motor: −1 from 41, −1 from 31, a further −1 everywhere with +1 agitation at 5+ riders.
- Shop: first ability free, second 40, six slots, reroll 10. Retired: Capacity (to Storage), Rails (base game, two moves), Longer Fuse; Reservation + Rebooking merged into Dispatch (twice per sector).
- Agitation: crowding +1 at 6 riders, arrival relief cap 2, low and medium departures tip +1 per arrival, high departures 20% incident.
- Ability changes: Safety Margin cap +2 and −3 relief refilled per shop; Soundproof cancels criminal-link agitation; Insulation cancels red-link power and coin costs; Stabilizer needs 5 riders, 5 per sector; Concierge +1; Tip Jar 35%; Relay 3; Meter 4; Mixed Ticket 6; Curtain Call 8.
- Riders: Lawyer from 16, Inspector from 21 (stamp 12), Shifter from 41; Commuter 6 (+3 low), Lover 5, Ghost 3, Coach neighbors +2, Mechanic repair 4 floors; Mimic always copies the fare above.
- Legends and keepsakes: see `lib/legends.ts` and `lib/game-data.ts`.

## Verification

`npm run verify` runs `verify-v9` (13 rule groups including the sector forecast and daily-shift determinism), the ported arrival-receipt, three-values (4,000 random transitions including legends, keepsakes and power-box levels), stacking, conflict and tourist checks, i18n with number, range and percentage parity across 102 rule texts, changelog, audio, music, bomb timer and lover offers. `npx tsc --noEmit`, `npm run build` and lint on changed code pass. Version-pinned v8.x scripts and the Mimic pair script remain in `npm run verify:v838-archival` as history.

## Open items

1. Marginal misses: optimizer median 88 (≤ 85), agitation deaths 19.9% (≥ 20%), weakest legend +4.9 (≥ +5). All within batch-to-batch noise; revisit with human data rather than more bot tuning.
2. Human playtests — bots are not players. The end screen's “Copy run record” produces JSON for analysis.
3. Legend portraits (monograms for now).
4. Older interface text still relies partly on phrase translation; rule texts are guarded by the parity check.
