# Frozen v6.1 audit input

Exact copies from source revision `bc4a95c687f5362a0da21a321874317b82701438`, before the v6.2 crowding change. These files are test-only; the application imports `lib/`, not this directory.

`scripts/audit-parameters.ts` and `scripts/audit-crowding-v62.ts` at the repository root use this snapshot so that the old 4-person baseline remains reproducible after the live engine changes. Reports retain generated source hashes, seeds and per-game outcomes. The report revision denotes the checkout at experiment generation, not the live deployment.
