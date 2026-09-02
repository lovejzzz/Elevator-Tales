# Mobile cockpit — v5.1

The phone portrait layout (up to 700 CSS pixels wide) is now a fixed-height game surface, not a vertically stacked desktop layout.

- Three candidate passengers above the cabin, all visible at once.
- Six cabin positions below; energy, agitation, weight and wallet on the right.
- Bottom action strip remains visible. No automatic scrolling on selection or departure.
- Candidate cards retain remaining stops, weight, patience, arrival reward and fuse warning. Tap the question button for complete rules. Existing riders can be selected and inspected with the bottom人物 button.
- Portrait windows retain square proportions using the slot's available size.
- Phone upgrade shop shows three compact individually priced rows and its leave action.
- Long optional manuals/receipts can scroll inside dialogs; the underlying game remains fixed. Desktop retains its original three-column composition and inline rules.
- No gameplay, pricing, resource or progression changes.

## Verification

Browser viewport checks at 320×568, 360×640, 390×844 and 430×932, with empty and full cabins: no offscreen core controls, no candidate/metric overflow, document size equals the viewport, and scroll position stays zero.

At 320×568, played from floor 1 through floor 10 using only visible controls; inspected candidate rules, bought the battery (81 → 46 coins, 12 → 20 energy), verified disabled unavailable purchases, and returned to play without scrolling. The ordinary shop measured 539 pixels of both client and scroll height, with its leave button entirely visible; the purchase receipt did not introduce overflow.

At 390×844, inspected an onboard police officer through the bottom人物 button; all six portrait windows measured equal width/height. At 1280×800, verified the original 196/640/360 three-column desktop layout and hidden mobile-only elements.

TypeScript check, mechanics/audio regression suite and production build pass. Browser error log was empty. The component retains its two pre-existing storage-initialization/persistence EffectSetState lint findings.

These checks use Chromium viewport emulation, not physical iOS/Android devices. Optional long information dialogs and extreme accessibility text sizes may still require internal scrolling.
