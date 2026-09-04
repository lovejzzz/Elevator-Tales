# Elevator Tales Changelog

Every public update must add a new entry here and in `lib/changelog.ts`. Record the player-visible change, exact balance parameters, experiment size, conclusion, and remaining questions. The current version is **v8.15**.

## v8.15 — 2026-09-03 — Tourist becomes a formation investment

- Tourist base fare changes from 22 to 18 and trip length from 3–7 to 4–7 floors; power remains 2 per floor.
- Each distinct adjacent non-Tourist profession earns the Tourist +1 coin per floor, capped at +2. Other Tourists do not count and duplicate professions count once.
- Cabin state shows `Companions 0/2–2/2` and the current bonus. Candidate cards receive a travel-grid postcard surface and Companion Bonus stamp while remaining Fine rarity.
- Companion income is separate from base fare, so Coach multipliers never multiply it.
- Verified 216 directed formations. A paired 10,000-game comparison kept balanced median at floor 25 and moved average income only from 322.79 to 324.06.
- Independent holdout: 20,000 games and 367,691 floor settlements, with zero power or agitation forecast misses and balanced median still at floor 25.
- Research only: 600,000 Storyteller trials showed the raw two-Child exit rule soft-locking a slot for a median 15–19 floors. A 20% per-floor Child-call chance reduced median release to 6 floors and >20-floor locks to 4.72%–5.92%. Storyteller is not yet live.
- Watch items: whether players intentionally preserve diverse Tourist neighbors, and whether to approve the tested Storyteller parameters for a later release.

## v8.14 — 2026-09-03 — Card headers stop competing for space

- The top agitation value is now always a compact “Self +0/+1”; long cancellation or conditional rules appear only in the ability area below.
- Desktop cards use a shrinkable identity column and fixed-content value column, with a safer English-name size.
- Mobile rarity and value areas gain minimum-width constraints to prevent horizontal overflow.
- Browser verification at 1280×720 covers three Chinese candidate sets and one English set with long conditions and material badges; desktop, short-screen, phone, and landscape media rules were also reviewed line by line.
- Full rules, localization, build, and release-history regressions pass. No gameplay values changed.
- Watch item: unusually narrow desktop windows and enlarged system text settings.

## v8.13 — 2026-09-03 — This-floor decisions read at a glance

- Boarded candidate cards turn grey and translucent; riders boarded on the current floor receive a bright gold cabin ring. Existing riders are not marked as new.
- A next-floor power delta shakes in red when the current arrangement would reduce power to zero or below. The agitation delta does the same when it would reach the cap.
- Every floor immediately before a ten-floor shop clearly shows “Next: Shop” in a highlighted notice.
- Player-facing supply-stop wording is now simply “Shop”; shop instructions and departure copy are shorter.
- The current coin total now sits at the very top of the shop with a substantially larger number.
- Reduced-motion settings disable the shake and pulse while preserving the warning color and borders.
- Added shop-warning regressions for floors 9 and 39 and retained exact next-floor power/agitation forecast checks. No balance values changed.
- Watch items: danger-shake salience without distraction, and grey boarded-card legibility on dim displays.

## v8.12 — 2026-09-03 — Two-resource squeeze

- Agitation cap is 6. Removed crowding, shift pressure, empty-car rests, and the hidden high-agitation multiplier. Agitation now comes only from visible rider values, high-risk tags, rider events, and unprotected red links.
- Each Nurse or Musician cancels 1 agitation from one adjacent rider per floor. Multiple calmers stack without going below zero. Any normal arrival reduces total agitation by at most 1 that floor. Calm System now gives cap +1 and immediate −2.
- High-risk riders add +1 agitation and +8 arrival coins. They begin ramping at floor 30; offer sets guarantee at least one from floor 40, two from floor 80, and all three from floor 120.
- Initial power is 48, capacity is 60, charging costs 1 coin per power, and the reference target is 50. At least one rider is required to ascend.
- Inspector now checks total power every floor: at 4 or less it earns +1 coin; above 4 it adds +1 agitation.
- Added a copper-red high-risk material, flame badge, and cabin marker so the risk is visible before committing.
- Screened initial power 36–60, capacities 48–72, charging price 1–2, agitation caps 6–10, and six high-risk progression curves.
- Independent holdout: 40,000 games and 1,050,768 floor settlements with zero forecast misses. Balanced play averaged floor 38.07 (median 43); 96.92% reached 10, 81.20% reached 20, 57.85% reached 40, and 6.26% reached 60. Failure causes were 28.66% power and 70.89% agitation.
- Agitation-blind and greedy strategies both had median floor 9. A conservative two-rider reserve strategy had median 49, so full-cabin and pure-income strategies do not dominate.
- Watch items: whether the floor 30–40 risk ramp feels too slow in human play, and whether +8 coins is enough to tempt players into visible danger.

## v8.11 — 2026-09-03 — Mechanic savings reads fully in English

- The Mechanic card now renders its stackable 2-power-per-floor saving fully in English.
- Runtime localization coverage for all 21 riders now checks power, income, agitation, and ability rows at normal and high agitation.
- Coach copy remains general and does not name Mystery.
- No gameplay value or material tier changed.
- Full verification still covers 52,920 targeted pair/position cases, 48,000 random transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.
- Watch item: keep validating new dynamic copy against actual production candidate combinations.

## v8.10 — 2026-09-03 — Every English rider rule reads cleanly

- Completed compact-rule translations for Thief, Officer, Lawyer, Drunk, Musician, Nurse, Child, Ghost, Exorcist, Coach, Celebrity, Inspector, Bomb Carrier, Mystery, Shifter, and Mimic.
- Covered dynamic even-floor agitation, 25% incident, Inspector threshold, bomb fuse, and copied-stat phrases so runtime values cannot leave Chinese fragments behind.
- The Coach card still states only its general adjacency rule. It does not call out Mystery as a special case, and hidden-fare settlement is unchanged.
- Added runtime-card localization checks for all 21 riders at both normal and high agitation.
- Production visual testing confirmed fully English candidate cards, unclipped card copy, and a single-line primary action.
- No rider value, material tier, appearance weight, power, agitation, coin, or upgrade effect changed.
- Full verification still covers 52,920 targeted pair/position cases, 48,000 random transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.
- Watch item: continue observing reading rhythm for rule-dense riders at narrower desktop widths.

## v8.9 — 2026-09-03 — Rider value becomes a physical material

- Added four materials: Standard dark stock, Fine brushed copper, Rare gilt lacquer, and restrained Legendary iridescent obsidian.
- Fixed public thresholds: appearance weight ≤4 or base fare ≥30 is Legendary; weight ≤6 or fare ≥20 is Rare; weight ≤8 or fare ≥14 is Fine; everything else is Standard. Coach is Rare; Shifter and Bomb Carrier are Legendary.
- Mystery grades from public appearance weight only, never its sealed fare, so the card material cannot leak the reward.
- Desktop cards now size to complete rules. If all three exceed the rail height, only the candidate rail scrolls; card text is never clipped.
- Added a Coach-and-hidden-fare regression: Mystery base fare still receives 50% per adjacent Coach, without adding special-case copy to the card.
- No rider, power, agitation, coin, appearance, or upgrade value changed.
- Added an exact two-Coach Mystery regression: sealed base fare 31 resolves to 62 coins and is logged only on arrival.
- Full verification still covers 52,920 targeted pair/position cases, 48,000 random transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.
- Watch item: material means appearance rarity or base reward, not automatic strength.
- Watch item: observe whether the candidate rail needs a stronger end fade when long-rule combinations require internal scrolling.

## v8.8 — 2026-09-03 — Candidate cards keep only useful feedback

- Removed “Drag to a position / click to board” from available, unselected candidate cards so rider rules have more room.
- Kept contextual messages for selected riders, boarded riders, a full cabin, and candidates that can immediately create a link.
- No rider, power, agitation, coin, difficulty-wave, or upgrade values changed in this release.
- Checked default, selected, boarded, full-cabin, and link-ready states in both English and Chinese.
- Full verification still covers 52,920 targeted rider-pair and position cases, 48,000 random state transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.
- Production and GitHub Pages static builds must pass, and the candidate-card render path must no longer contain the removed English or Chinese default message.
- Watch item: short-rule cards now keep deliberate breathing room instead of filling it with a generic instruction.
- Watch item: keep observing whether first-time players can board smoothly from drag feedback and the selected state alone.

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
