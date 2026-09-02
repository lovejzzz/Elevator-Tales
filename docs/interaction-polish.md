# Interaction polish — v4.7

Scope: presentation and input feedback only. Passenger economics, pressure rules, score thresholds and offer probabilities are unchanged.

## Presentation contract

- Preserve the midnight green / aged brass direction and existing portrait assets.
- Keep resting UI quiet; use gold for placement, mint for a newly formed relationship, and warm red for rejection.
- Show placement previews without mutating gameplay. Drag and tap commit the same validated result.
- Present resource changes together near the cabin, with persistent receipts in the status rail.
- No fake character locomotion: portrait entrance is a UI transition, not a walk cycle.
- Standard journey timing: close at 0 ms, move at 250 ms, resolve / open at 470 ms, unlock at 730 ms. Reduced-motion timing: 0 / 30 / 70 / 110 ms.
- Reuse one audio context and disconnect completed voices. Audio failure must not block input.

## Verification performed

- Unit checks: preview immutability, occupancy rejection, weight rejection, repeated drop, paired feedback, old-rider swap limit, free new-rider movement, invalid targets and ended runs.
- All existing mechanics and forecast tests pass; TypeScript check and deployment build pass.
- Browser: native portrait drag formed the guided lover pair; click placement and occupied-seat rejection preserved the correct cabin state.
- Browser: Enter on a focused seat did not depart; a normal departure locked then unlocked controls and advanced exactly one floor.
- Browser: a second old-rider move was rejected with clear feedback.
- Browser: 1280 × 720, 1130 × 768 and 390 × 844 responsive checks; corrected an intrinsic grid-height overflow and a narrow-grid overflow found during testing.
- Browser: mobile selection and departure return the cabin to view; no horizontal document overflow at 390 px.
- Browser: reduced-motion emulation produced zero-duration door transitions and no portrait animation, while departure remained functional. Emulation is cleared after testing.
- No browser error or warning logs in the exercised flows.

## Remaining limits

The three pre-existing synchronous-effect state warnings in the game component remain outside this presentation change. New interaction/audio modules and the mechanics tests pass their lint checks. Subjective motion and sound preference still benefit from human playtesting; this is not a claim that the entire game is production-complete.
