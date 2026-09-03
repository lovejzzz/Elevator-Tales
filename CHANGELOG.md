# Elevator Tales Changelog

Every public update must add a new entry here and in `lib/changelog.ts`. Record the player-visible change, exact balance parameters, experiment size, conclusion, and remaining questions. The current version is **v8.5**.

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
