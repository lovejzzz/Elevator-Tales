# Elevator Tales Changelog

Every public update must add a new entry here and in `lib/changelog.ts`. Record the player-visible change, exact balance parameters, experiment size, conclusion, and remaining questions. The current version is **v8.27**.

## v8.27 — 2026-09-04 — Wistful Static enters floors 01–10

- Replaced the complete floors 01–10 track with the player-supplied Wistful Static. Theme, Shop, death, and every track from floor 11 onward remain unchanged.
- Preserved the supplied 48 kHz stereo lossless WAV master. The web version is a 128 kbps MP3 calibrated to −18.0 LUFS with a −5.65 dBTP true peak.
- Gave the replacement a new asset URL so returning browsers cannot keep serving the previous track from cache.
- Floors 1–10 still share one loop and switch at floor 11; the post-120 shuffle automatically uses Wistful Static too.
- Confirmed identical SHA-256 hashes for the supplied source and project master, then verified the 183.912-second web encode and all 15 music assets.
- Added a routing regression that pins floors 1 and 10 to Wistful Static and floor 11 to the next track.
- Watch item: perceived loudness and mood continuity between the replacement, the theme, and floors 11–20; tune transitions instead of shortening the track if needed.

## v8.26 — 2026-09-04 — Drag previews show only real links

- Fixed the drag state applying its preview style to the whole adjacency map. Empty edges no longer form a green dashed grid across all six positions.
- Only green or red relationships newly created or changed by the prospective placement receive the animated preview style.
- Existing unchanged relationships retain their normal settled style, making the result of the current move distinct from the cabin's prior links.
- Neighbor detection, stacking, resource resolution, and all balance values are unchanged; this release corrects visual feedback only.
- Added edge-level regressions for empty, new, changed, and unchanged green/red relationships, then reran the complete gameplay, localization, music, changelog, and production-build checks.
- Watch item: multi-link reseats, where several relationships may change at once, should still make new and existing links immediately distinguishable.

## v8.25 — 2026-09-04 — Cabin cards stop colliding

- Rebuilt cabin rider cards as five bounded rows: name, floors remaining, portrait, current state, and the three-value strip.
- Restricted the portrait to the card's remaining middle space so it cannot push status or values outside their rows.
- Reduced the bottom strip to icons plus compact values such as `14`, `2`, and `0`; full coin, power, and agitation meanings remain in tooltips and accessible labels.
- Removed the gold portrait circle from riders boarded on the current floor. The gold card border and subtle glow now communicate that state alone.
- Long names and two-line states stay inside the card instead of colliding with the detail button or metric strip.
- No rider values, resource resolution, offer weights, or difficulty curves changed.
- Added layout-source regressions and reran the complete gameplay, localization, music, changelog, and production-build checks.
- Watch item: the densest long-name, Bomb-timer, and High-Risk combination; shorten state copy before reducing portrait size again.

## v8.24 — 2026-09-04 — Temporary cover, no end in sight

- The player is now the temporary elevator operator sent to cover tonight's shift in a strange building with no final floor.
- Rewrote the opening around one survival premise: keep power above zero, keep agitation below its limit, and survive for as long as possible.
- Reduced the three-step briefing to “Board and place riders,” “Manage power and agitation,” and “Survive as long as you can.”
- Updated the phase labels and manual summary to use the same Temporary Shift / Endless Shift framing in English and Chinese.
- Opening Agitation help or the changelog now switches to `theme.mp3`; closing either restores the current floor track.
- Added a prominent Start Game button beside the current-formation forecast, keeping the action visible without scrolling.
- Fixed English leaks in the Shop manual copy, neighbor/arrival rules in rider details, Agitation help, and accessibility labels.
- Kept one primary start action and introduced no additional pre-game step.
- No rider values, resource resolution, offer weights, or difficulty curves changed.
- Expanded localization regression coverage from 1,281 to 1,595 samples by rendering full detail-card rules for all 21 riders. Browser-audited the intro, main screen, manual, Agitation help, rider details, archive, upgrades, and changelog; only the intentional Chinese language-switch label remains Chinese.
- Verified the narrative hierarchy, English and Chinese localization, and production build.
- Added music-scene regressions for the intro, Agitation help, changelog, floor restoration, Shop, and failure tracks.
- Watch item: whether the strange-building premise creates curiosity without implying a finite story ending; future narrative should emerge through riders and floor events rather than a longer opening.

## v8.23 — 2026-09-04 — Rider cards say only three things

- Rebuilt all 21 candidate cards around three sections only: Self, Green Neighbors, and Red Neighbors.
- The header now shows arrival fare, power per floor, and non-zero agitation only. `+0` agitation is hidden.
- Removed restated conditions such as “Prevented by…” and competing placement terms such as “Cooperates with…”.
- The universal green arrival reward appears once beside the Green Neighbors heading. Identical red-cost targets share one row.
- Money timing is explicit everywhere: “Each ascent immediately…” means the Balance changes after every floor; “Own arrival…” resolves only when that rider exits.
- A controlled rider now says “No agitation” instead of showing a context-free zero.
- Phones show one full candidate card at a time with named tabs instead of squeezing three cards into narrow columns.
- Power and Agitation now use current/cap notation such as `50/60` and `0/6`. Balance shows only floors remaining to the Shop, not shift-total income.
- No rider values, offer weights, resolution order, or stacking formulas changed.
- Generated and audited all 21 compact cards, with focused Officer, Thief, and Musician regressions. Red targets do not repeat and the compact data contains no competing cooperation/conflict/adjacency wording.
- Browser-tested English and Chinese at 1440×900 desktop and 390×844 phone sizes. Card bodies had no horizontal or vertical clipping, and the phone page had no horizontal overflow.
- Watch item: whether first-time players can distinguish per-floor money from arrival money without opening details; if not, shorten individual self abilities before adding another card section.

## v8.22 — 2026-09-04 — Every neighbor becomes part of the build

- Adjacency abilities now explicitly affect every adjacent rider and stack linearly, with no hidden single-target cap.
- Musician is now a rare short-term control centerpiece: appearance weight 7→4, fare 8→14, trip 4–8→2–5, power 1→2, and every adjacent rider cancels 2 agitation per floor.
- Nurse is now common lightweight control: fare 9→8, appearance weight 7→8, power 1, and every adjacent rider cancels 1 agitation per floor.
- Coach power changes 2→1 while fare 20, trip 3–6, and all linear neighbor bonuses remain. Thief trip changes 3–7→2–6 while its uncontrolled +4 coins/+1 agitation per floor remains.
- Each normal arrival reduces agitation by 1 that floor, capped at 2, rewarding multi-rider turnover without unlimited clearing.
- Officer copy now explicitly states that every adjacent Thief is controlled and every adjacent Bomb Carrier timer is locked.
- Fixed a browser runtime error where a music fade could undershoot zero by a tiny floating-point amount; fade volume is now clamped to 0–1.
- Ran 481,055 iterative games. Rejected one-coin charging, +100% Coach multipliers, 46 starting power, and a long high-power Musician.
- Final unseen-seed holdout: 50,950 games. Balanced play averaged floor 45.60 (median 46), reached floor 20 in 94.52% and floor 40 in 79.12%; failures were 11.64% power, 88.24% agitation, and 0.12% Bomb timer. Risk play failed to power 74.88% of the time.
- Frugal play's baseline lead shrank from roughly 10 floors to 5.05. All 21 riders passed normal/favor/ban checks; acceptance spans 18.0%–62.2%, with no dead-card, auto-pick, indispensability, or trap alert.
- Exhausted 194,481 center-plus-three-neighbor formations and 4,000 random forecast transitions with zero prediction misses.
- Watch items: whether center-position Musician fan-out feels exciting enough, whether its 2-power cost remains legible, and whether the remaining five-floor frugal advantage is healthy style identity.

## v8.21 — 2026-09-04 — A complete soundtrack for the midnight shift

- Integrated 15 player-made tracks: a theme, 12 ten-floor tracks covering floors 1–120, shop music, and failure music.
- Rider placement and ordinary ascents inside one ten-floor band do not restart the current track.
- The shop and failure screen use dedicated music; leaving them restores the correct floor-band track.
- After floor 120, completed tracks shuffle from all 12 earlier floor tracks without immediately repeating the last selection.
- Added a persistent music-note toggle. It controls background music independently from the existing interaction-effect speaker button.
- Kept lossless WAV masters locally under `source-audio`; deployment uses loudness-normalized 128 kbps MP3 files, reducing roughly 503 MB to about 48 MB.
- Automated coverage verifies all 15 assets, floor boundaries, scene changes, no same-band restart, independent mute, and endless shuffle behavior.
- Watch items: perceived loudness, loop seams, transition feel, and whether the 48 MB total needs selective bitrate reduction after real-network testing.

## v8.20 — 2026-09-04 — Red links become a real cost network

- Expanded static red relationships from 19 to 35: 12 agitation, 12 coin-loss, 8 flat-power, 2 doubled-power, and 1 doubled-power/doubled-fare pair.
- Red costs resolve every floor and independently from green cooperation. Multiple x2 links stack linearly from base: two links total x3, never exponential x4.
- Red links now show fire, power, or coin icons, and cards state each conflict’s exact cost. Dynamic Mystery/Shifter/Mimic relationships use the same visible types.
- Locked the power economy at 50 starting power, 60 capacity, +5 shop-entry power, and 2 coins per extra power.
- Courier recharges 2 on arrival and appearance weight changes 9→4. Mechanic costs 2, saves 2 per floor, and weight changes 7→3. Controlled Ghost saving changes 1→2.
- Uncontrolled Thief income changes 3→4 coins per floor while keeping +1 agitation; controlled income remains 1 per floor plus 5 on arrival.
- Officer/Bomb cooperation no longer depends on even floors: adjacency locks the Bomb timer completely, and separating them resumes its −1-per-floor countdown.
- Ran more than 285,000 complete games across candidate parameters, then repeated the final independent 35,200-game holdout after removing the last odd/even rider rule.
- The final locked holdout averaged floor 39.60 (median 44), with 83.44% reaching 20 and 58.52% reaching 40. Balanced failures were 32.72% power, 67.16% agitation, and 0.12% Bomb timer.
- Favoring Officer changed survival by +1.83 floors and banning it by +0.10; favoring Bomb changed 0.00 and banning it −0.07. All 21 normal/favor/ban comparisons passed with no dominance, indispensability, or trap alerts.
- Exhausted 194,481 center-plus-three-neighbor formations and 4,000 random forecast transitions. All multiplier, stacking, and next-floor forecast checks passed with zero misses.
- Watch items: human readability of multiplier icons, whether rare sustain cards feel exciting rather than mandatory, and whether Coach’s high-income/high-power route remains worth its cost.

## v8.19 — 2026-09-03 — Companions become a real stackable group route

- Every adjacent rider now gives a Tourist +1 coin per floor. Duplicate professions and other Tourists each count separately.
- Removed the two-companion rules cap and `x/2` display. Cabin geometry naturally limits one position to at most three adjacent companions.
- Any two adjacent Tourists now draw a green companion link. These visual companion links do not secretly grant the separate generic arrival cooperation reward.
- Ran 27,000 complete games under the new rule, all 194,481 center-plus-three-neighbor formations, and 216 targeted Tourist arrangements with zero forecast misses.
- Same-seed before/after tests moved balanced mean survival only 42.67→42.78 floors while mean income rose 683.86→699.35. The change adds payoff without creating a survival advantage.
- In a 17,000-game unseen-seed holdout, Tourist acceptance was 44.7% normally and 58.9% when favored. Favoring it changed survival by −0.46 floors; banning it changed +0.16. No dominance or indispensability alert fired.
- A full six-Tourist cabin tops out at 14 companion coins per floor across seven adjacency edges, matching six Lovers' per-floor edge scale without their arrival-fare multiplier.
- Watch item: if human players make full travel parties too reliable, tune trip length or base fare before weakening the simple per-rider stacking rule.

## v8.18 — 2026-09-03 — Bomb risk is now a readable countdown

- Replaced every player-facing “fuse” with “Bomb timer” and direct cause-and-effect wording.
- Bomb Carrier cards now state: timer starts at 3–6, drops by 1 each floor, zero before arrival ends the run, and zero on the arrival floor is safe.
- Officer cards now say an adjacent Bomb Carrier timer does not drop on even floors; Counsel cards explicitly say they cannot pause it.
- Cabin labels, rider details, failure messaging, retry advice, the archive, and Mimic exclusions all use the same term in Chinese and English.
- Verified the complete Bomb Carrier lifecycle and localization. No balance values changed: fare 26, power 1, trip 2–6, and starting timer 3–6 remain fixed.
- Watch item: the clearer label is longer, so very narrow cabin labels may eventually use the compact form “Bomb 4.”

## v8.17 — 2026-09-03 — Stacking rules now match every card

- Red adjacency conflicts now add 1 agitation only when the next floor is even. Odd floors no longer apply a hidden conflict penalty.
- Public rider values are unchanged. Green links remain linear and suppress only that rider's generic red-link conflict layer, never intrinsic or volatile agitation.
- Ran 55,604 complete games and 306,663 controlled stacking/trait cases, including all 194,481 center-rider plus three-neighbor formations. Forecast misses: zero.
- For each of all 21 riders, ran 600 normal, 600 favor, and 600 ban comparisons. The highest duplicate rate was Lover at 25.2%, yet favoring it changed survival by −0.67 floors. No favored stack gained more than +1.09 floors.
- Six Lovers arriving together pay 176 coins; each Cooperation Contract level adds exactly 28. Three Coaches scale Tourist fare 18→45, while Concierge tips remain unmultiplied at +3 per level.
- One Nurse/Officer can affect up to three adjacent valid targets, but the benefit remains linear and is bounded by position and cabin capacity. Mimic copied fields remained distinct and evenly distributed across 12,000 samples.
- Rejected Mechanic saving 1 after 9,800 games: balanced floor-40 reach fell from about 69% to 56.5%, aggressive median fell to floor 10, and sustain dependence remained.
- Watch items: Mechanic remains the sustain anchor without a duplicate exploit; blind Thief stacking costs −4.50 floors unless Officer/Counsel support is built with it.

## v8.16 — 2026-09-03 — Every rider competes across two resources

- Initial power changes from 48 to 42; capacity stays 60. The motor, recharge price, and mandatory-rider rules are unchanged.
- Tourist power changes from 2 to 1 per floor. Its 18 base fare, 4–7-floor trip, and diverse-neighbor income remain unchanged.
- Courier recharges 1 power on arrival, capped by capacity. The candidate card, cabin state, settlement feedback, and next-floor forecast all disclose it.
- Coach remains a 2-power rider, but its trip changes from 4–8 to 3–6 floors. All fare multipliers remain unchanged.
- Ran 221,126 complete simulated games and 86,016 controlled rider trajectories. Rejected variants included start power 36, Courier recharge 2, Coach power 1, and guaranteed low-power shop cards.
- Final unseen-seed holdout: 33,200 games, with 2,000 runs for each of four whole-run styles and 1,200 paired normal/favor/ban runs for every rider. Forecast misses: zero.
- Balanced play averaged floor 41.45 (median 44); 91.55% reached floor 20 and 66.75% reached floor 40. Failures were 26.95% power, 72.90% agitation, and 0.15% fuse.
- All 21 riders were selected in 17.7%–62.2% of normal offers. No rider became a universal reject or auto-pick. Tourist, Courier, and Coach favor deltas were +0.20, −0.38, and −0.68 floors.
- Mechanic remains the watch item: favoring it further adds only +0.27 floors, but banning it entirely costs −13.95 floors. Human play should determine whether it is a healthy sustain anchor or needs a third sustain route.

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
