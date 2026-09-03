# v6.4 browser verification

2026-09-03, local http://localhost:3000/, isolated agent-browser session elevator-v64. The actual React application and game engine were exercised. Test fixtures were injected into browser state only; no debug hook or fixture is present in production source.

- Initial page and intro loaded, then normal Start Shift click showed three passenger cards, energy20/cap24 and the first high-pressure forecast (17–19).
- Actual one-move rescue: at floor16, stress12, two separated lovers, one due at17 and contract installed, departure preview was +3 (fatal). Clicked the lover in slot3, then empty slot2. Preview became unchanged. Clicked departure and opened the actual receipt: stress12→12, spacious −1, scheduled pressure +5, arrival −1, contract −3. Energy20→18; coins100→119. No automatic crisis rescue was added.
- Actual shop purchase: floor10, energy2, coins100. UI offered target22 for60 coins and individual electricity for3. Clicking target charge produced energy+20, coins−60 and wallet40. The60-coin contract disabled immediately;35-coin calm remained available. Then left the shop normally.
- 390×844: full game screen retained no page scrolling; schedule visible above cabin.
- 320×568: document exactly320×568, three cards client/scroll height238/238. Wallet bottom492, departure top497. Schedule was contained inside cabin; occupied rider remained visible and unstretched.
- 390×600: document exactly390×600, wallet bottom525, departure top529. High-pressure countdown visible.
- 1440×900: full desktop game and new schedule checked. Increased desktop schedule text to12px with dark backing; final schedule right edge694.68, inspect-control left edge815.81 (no overlap).
- Browser reported no uncaught errors. These were Chromium emulated sizes, not a physical iOS Safari test or arbitrary-zoom guarantee.

Full regression suite, targeted lint for changed files, TypeScript, simulation-source hash parity and production build passed. Repository-wide generic UI lint issues documented by v6.3 remain outside this change; targeted lint is not a claim that the entire repository is lint-clean.
