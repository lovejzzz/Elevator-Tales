# Decision clarity — v4.8

Presentation only: no changes to game rules, passenger economics, progression, or probabilities.

## Passenger briefs

- Destination, remaining floors, load, patience and fuse all have explicit labels/units.
- Base arrival coins/energy stay visible after selection and boarding. Upgrade tips are separate because they do not participate in fare multipliers.
- All 18 roles have complete, unconditional-to-read ability descriptions. No ellipsis, clamping or hover-only rules.
- Short desktop windows scroll the candidate list; new floors reset it to the beginning. Mobile cards use natural page height.

## Decision feedback

- Placement/removal, floor settlement and upgrades compare actual before/after values for coins, energy, pressure and load, including changed caps.
- Each changed instrument gets a keyed numeric pop and border glow, plus a dedicated synthesized audio cue. Repeated changes retrigger.
- Pressure relief is beneficial even though negative; loading a passenger is neutral rather than an arbitrary loss.
- Net-zero transactions retain their individual sources. Receipts reconcile clamped totals and identify departing passengers.
- A persistent last-action receipt is available via “本次变化明细”; resets do not create fake gains/losses.
- Muting stops both playing and scheduled notes. Delayed arrivals read current mute preference.
- Reduced motion retains textual feedback without movement/flashes. No audio capability is required to play.

## Verification

- Mechanics tests cover all 18 briefs, upgrade tips, placement/removal, repeated placement, signed cue choice, cap changes, zero-net energy and clamped pressure/energy accounting.
- Mocked audio checks cover one shared context, cue frequencies, staggered starts, mute, cancellation of future notes and unavailable-audio fallback.
- Browser: click placement, withdrawal/reboarding, native portrait drag, lover pairing, consecutive departures, courier arrival with energy cancellation, full receipt contents and per-floor candidate scroll reset.
- Browser: desktop 1280×720 and 1512×982, mobile 390×844; no horizontal overflow or clipped ability text in the exercised cards. Desktop instrument rail fits without hiding its receipt button at 720 px.
- Browser: reduced-motion CSS disables metric animations/rings while settlement remains functional; mute toggle remains usable. No browser errors/warnings in exercised flows.
- TypeScript and production build pass. The three existing initialization/persistence EffectSetState lint errors are unchanged; changed support modules and verification scripts pass lint.

Sound scheduling is tested programmatically; final loudness/timbre preference still requires human listening on the intended speakers/headphones.
