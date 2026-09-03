# v6.3 browser and release verification

Date: 2026-09-03. Local dev URL: http://localhost:3000/. Chromium via agent-browser, isolated elevator-v63 session. Browser-only React state fixtures exercised the real UI and engine; no fixture hooks were added to production code.

## Gameplay checks

- At floor 11, installed contract level 1, stress 9, two lovers bound for floor 12: selected both candidate cards and placed them in adjacent slots using normal UI clicks. Departure preview showed stress −6. After actual departure the receipt showed spacious cabin −1, ordinary arrivals −2, and exactly one contract entry −3. Stress ended at 3, energy 20→18, coins 150→186, load 2→0.
- At floor 10, stress 15/15 and 200 coins, the contract displayed 60 coins and explicitly said purchase does not immediately soothe. It was not highlighted as a crisis rescue. Buying it left stress at 15 and coins at 140; receipt contained only the 60-coin deduction. Buying the calming system afterward allowed leaving the shop.
- Installed-upgrade inventory correctly listed level 1 contract, +5 cooperation coins, extra −3 agitation, once per floor, and no relief stacking by level.
- Candidate cards named the arriving rider and required neighbor, then showed extra coins, extra agitation reduction, and the cabin-wide once-per-floor limit. Lover, child and mimic combinations were checked.
- Browser reported no uncaught page errors. Audio regression tests passed (mute, distinct metric cues, scheduling/cancellation, unavailable-audio fallback); this does not substitute for subjective listening tests.

## Layout checks

| Viewport | Result |
| --- | --- |
| 390×844 | Cards, occupied cabin, all four metrics and departure button visible without page scrolling. |
| 360×640 | Document 360×640; all candidate cards client/scroll height 238/238; wallet bottom 531, departure top 569. |
| 390×600 | Document 390×600; cards 238/238; wallet bottom 525, departure top 529. |
| 320×568 | Document 320×568; cards 238/238; wallet bottom 492, departure top 497. Fixed side-rail overlap and retained an unstretched 31.5×31.5 occupied-rider portrait. |
| 1440×900 | Desktop gameplay, full cooperation text and receipt controls verified. Candidate panel retains its existing independent scrolling. |

Short-screen fixes are scoped to installed-contract layouts. Modal dialogs may scroll; the mobile gameplay screen does not. These are emulated viewports, not a physical iOS Safari test or arbitrary browser zoom guarantee.

## Program/build verification

- Full `npm run verify` passed, including 122,880 v6.2 crowding cases and 90,000 v6.3 randomized transition checks.
- TypeScript check passed.
- Lint of every edited/new implementation and test file passed.
- Full-repository lint still reports 19 existing issues in untouched generic UI components and use-mobile; no unrelated library files were changed to suppress them.
- Production build and diff whitespace check passed. Simulation counts, source hashes, strategy results and caveats are in README.md, analysis.json and reproduction.json.
