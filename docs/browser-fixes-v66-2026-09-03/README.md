# Elevator Tales — browser audit fixes, 2026-09-03

Baseline: cea421ecbb45a931de963b4baeacdb10fd591ac7 (v6.5). Release UI: v6.6.

## Fixed audit findings

1. Inspector's unreachable energy saving is replaced with an even-floor compliance reward: each inspector grants 1 coin when raw passenger extra energy is zero. A failed inspection retains its agitation penalty. Stabilizer/savings do not change the inspected raw amount. No other economic prices, starting battery, or wave schedules changed.
2. Full-cabin labels have independent layout space. Portraits keep a square aspect; very short seats prioritize name, remaining stops, agitation and fuse over artwork/status decoration.
3. Dialogs initially focus their container at scrollTop 0, not an action at the bottom. Keyboard focus remains inside the modal.
4. One shared card component shows base fare and separate, non-multiplied tips on desktop and phone.
5. Card abilities explicitly state lover per-stop revenue/base multiplier, coach self income/non-coach restriction, and shared savings cap/order. Archive/upgrade copy is consistent. Redundant detail paragraphs removed.
6. 844×390 has a playable horizontal layout. Narrow 667×375 shows a portrait instruction and preserves the live run when rotated back.
7. Remaining old-passenger reseats are persistently visible beside departure controls.
8. Desktop/normal portrait phone show three candidate cards together. Short phones use a three-name switcher and complete wide cards; switching does not scroll the page. All game controls stay on screen.

## Verification

- 52,920 directed passenger pair/position/pressure cases: passed.
- 48,000 seeded randomized transitions: forecast energy/stress ranges match settlement; immutability, variable/copied profiles, retired patience/weight, receipts checked.
- 32 inspector parity/raw-energy/stabilizer/high-stress cases: passed.
- Targeted fare checks: two tip-bearing lovers pay 36 arrival coins plus 2 per-stop coins; coaches adjacent to coaches pay 46 total, no mutual multiplier.
- Existing audio checks: mute, shared context, differentiated cues, staggered timing, cancellation and unavailable-audio fallback passed.
- TypeScript and lint of changed TypeScript/TSX files: passed. Whole-repository lint still reports 19 pre-existing issues in untouched template components/hooks; these were not broadened into this task.
- Production build passed. Browser console contained only development/HMR notices; no page runtime errors were recorded.

## Browser layout sweep

Each size ran 14 layouts: all 21 candidate types in groups of three, both ordinary and upgraded/high-stress/tip-bearing runs. Cabin filled with bomb, coach, mimic, ghost, exorcist and inspector. Receipt access was present. Checks cover viewport/page bounds, departure bounds, card overflow, seat text intersections/bounds and metric content bounds.

| Viewport | Layout cases | Final failures | Minimum seat height |
| --- | ---: | ---: | ---: |
| 320×568 | 14 | 0 | 62 px |
| 375×667 | 14 | 0 | 106.5 px |
| 390×844 | 14 | 0 | 114.3 px |
| 844×390 | 14 | 0 | 97.5 px |
| 1280×800 | 14 | 0 | 65.0 px |
| 1440×900 | 14 | 0 | 104.0 px |

Total: 84 layouts / 252 candidate-card instances. Screenshots alongside this report show the final fixture at each viewport. Boundary fixtures were injected into an isolated browser React state for reproducibility; they do not represent 84 organically played full runs. Mobile checks use Chromium viewport emulation, not physical iOS Safari.

## Actual browser interaction checks

- Click first lover into seat 1, drag second lover into seat 2, travel: paired revenue +2, energy −1.
- Double-click departure at the arrival floor: advances exactly once; the two lovers with base 6/tip 3 produce 38 coins, not 44.
- First old-passenger reseat succeeds, second rejected; persistent allowance displays 0/1.
- Passenger detail opens at top; Tab enters its actions, Escape closes. Ejecting a passenger four stops early deducts 12 coins, pays no fare, changes no agitation.
- Reach 10F with zero battery: emergency shop. Install stabilizer for 45, add one battery for 3, inspect installed upgrade, leave via low-battery confirmation.
- Battery failure on next floor has prominent correct cause; restart restores 20/24 battery, floor 1 and zero coins.
- Inspector at 25→26: coins 100→101, battery 20→19; actual receipt names the compliance reward.
- Short-phone candidate switcher: second card moves into view, courier can board, page scrollY stays 0.
- Inventory opens at scrollTop 0 even at 320×568; title visible.
- Agitation failure reports “躁动失控”, separately from battery failure.
- 667×375 portrait prompt changes back to playable 390×844 with floor/state preserved.
- Post-publication smoke testing caught the floating receipt button being covered by the cabin background. The status rail now has an explicit stacking layer. Actual receipt clicks were retested at 844×390, 320×568 and 390×844, not just checked for visible bounds.

## Scope and limitations

This is a targeted bugfix and regression pass, not a new assertion that the game is perfectly balanced or free of all possible bugs. Inspector income changes require future balance monitoring alongside other low-extra-energy strategies. Asset style, starting 20/24 battery and core three-value design remain intact.
