# Browser verification — 2026-09-03

Verified against the local app after the successful production build. Browser automation used a separate session. No debug hooks were added to application source. Conditional states were supplied through the local development component, then exercised through actual UI controls.

- Start a shift, click-board two lovers into adjacent seats, board a courier and depart: floor increases, energy decreases by 2, lovers pay 2 coins, remaining stops update.
- At floor 11, stress 7, no imminent arrivals: four commuters show “躁动 不变” and settle at 7; five show +1 and settle at 8; six show +2 and settle at 9.
- Four riders including one musician show −1 and settle at 6; including two musicians show −2 and settle at 5. The receipt shows “音乐家安抚 −2”, matching the displayed change.
- The pressure help names 3–4 as not crowded, 5 as +1, 6 as +2, and explicitly says character events and fatigue still apply. It explains that multiple musicians/nurses stack.
- Energy-only shop crisis highlights no upgrade card. Dual crisis highlights only the calm system, not the cooperation contract or reinforcement.
- Starting with 250 coins, charge 22 units for 44, buy contract for 45, reinforcement for 45 and calm for 35: displayed balance 81, energy 22/24, stress 9/18 and weight limit 13. Inventory shows all three purchases with their cumulative effects. Returning from inventory and leaving the shop works.
- Mobile viewport 360×640: document 360×640, cards content/client height 202/202, depart bottom 613. At 390×600: document 390×600, cards 202/202, depart bottom 573. At 390×844: document 390×844, cards 242/242, depart bottom 814. No page scrolling or card overflow in these checked states.
- Desktop 1440×900: four-person status explicitly reads “4 人：不拥挤”; footer is v6.2. Existing artwork and overall layout preserved.
- No application console errors or framework error overlay observed. These are responsive Chromium checks, not physical-device Safari validation. Audio scheduling/mute/fallback behavior was checked by the automated audio tests, not by claiming a human listening test.
