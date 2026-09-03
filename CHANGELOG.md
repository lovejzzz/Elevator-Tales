# Elevator Tales Changelog

Every public update must add a new entry here and in `lib/changelog.ts`. Record the player-visible change, exact balance parameters, experiment size, conclusion, and remaining questions. The current version is **v8.7**.

## v8.7 — 2026-09-03 — The midnight shift goes bilingual

- English is now the default. A `中文 / EN` switch appears in the header; Chinese mode keeps `?lang=zh` in the URL and survives refreshes.
- English covers the intro, rider cards, cabin states, cooperation and conflict, shift manual, archive, upgrade shop, results, failures, and the complete release archive.
- The document language defaults to `en` and changes to `zh-CN` with the interface.
- No rider, power, agitation, coin, difficulty-wave, or upgrade values changed in this release.
- Added localization coverage checks across rider, upgrade, rule, dynamic interface, and release-note copy.
- Full rules verification still covers 52,920 targeted rider-pair and position cases, 48,000 random state transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.
- Production and GitHub Pages static builds must both pass. The default static document declares `lang=en` and retains a direct Chinese entry point.
- Watch item: review long English rules on short 375×667 phones, shortening wording only when no decision-critical value is lost.
- Watch item: future riders and mechanics must ship with both languages so the two rulesets never drift.

## v8.6 — 2026-09-03 — High pressure without a forced death wall

- Reduced the three-floor high-pressure wave from +5 to +4 agitation per floor; the +1 preparation wave and long-run scaling are unchanged.
- Removed duplicate forecast, energy-equation, and reseating copy from the mobile action area. The normal close-and-rise button is now 74px tall; a single contextual instruction appears only while placing or reseating.
- Reframed the guided first run as one example of reading a green cooperation line, not a claim that lovers are the universal best play.
- Corrected candidate-list and animated-number accessibility semantics; the automated audit reports zero violations.
- Fixed the balance harness so simulated players reserve coins and recharge at supply stops instead of following an impossible no-charge policy.
- Ran 20,000 games and 370,594 floor settlements with zero forecast mismatches. Balanced play reached floor 10 in 99.92%, floor 20 in 44.58%, and floor 30 in 19.60% of runs, with a maximum of 100. Ignoring agitation reached floor 20 only 2.66% of the time.
- Browser-tested 1440×900, 390×844, and 375×667 layouts, including placement, green-link feedback, settlement animation, and the floor-10 shop without page scrolling.
- Watch item: balanced median remains floor 19, deliberately severe but still requiring human play feedback around the first high-pressure wall.

## v8.5 — 2026-09-03 — Version history in game

- Added a clickable version entry on desktop and mobile.
- Added an in-game changelog with changes, experiments, conclusions, and watch items.
- Added an automated release invariant so the visible version, changelog data, and this file cannot drift.
- Re-ran 52,920 directed relationship cases and 48,000 randomized transitions with zero forecast mismatches.
- Carries forward v8.4's 17,750 simulated games and 1,083,654 floor settlements.

## v8.4 — 2026-09-03 — Stacking builds

- Every active green connection pays its own arrival bonus. Every unprotected red connection adds its own even-floor agitation.
- Mechanics contribute 2 passenger-energy savings each; controlled ghosts and the eco circuit add independently.
- Lover and coach bonuses stack linearly. Duplicate nurses, musicians, inspectors, and other per-character effects resolve independently.
- Energy savings remain capped by passenger energy and never erase the elevator's 1 energy motor cost.
- Tested 17,750 games across mechanic, lover, coach, occult, calming, link-focused, and adaptive mixed strategies. Pure stacking did not dominate adaptive play.
- Verified 21 passenger relationship profiles and eight special stacking families.

## v8.3 — 2026-09-03 — Predictable mechanic support

- Replaced the mechanic's multiple-of-three trigger with a per-floor saving.
- Replaced the clock-like agitation icon with a flame.
- Compacted the ten-floor shop so its continue action remains in the viewport.

## v8.2 — 2026-09-03 — Agitation clarity

- Consolidated character values around coins, energy, and agitation.
- Put metric icons beside numeric effects and simplified shop copy.

## v8.1 — 2026-09-03 — Onboard readability

- Kept the three character metrics visible after boarding.
- Cropped portraits without distortion and strengthened boarded-state and connection feedback.

## v8.0 — 2026-09-03 — Passenger cards and archive

- Moved larger metrics beside character names and fixed long-text clipping.
- Fixed the passenger archive so only encountered characters are discovered.
