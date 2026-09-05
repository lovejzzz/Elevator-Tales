# v8.31 compatibility archive

These 17 engine/presentation/UI dependencies are byte-identical to the frozen
`v8.31-overhaul-20260905/source.tar.gz` checkpoint. SHA-256 identities are recorded
in `source-manifest.json`; the original checkpoint is not modified.

The archived component is saved as text for historical source assertions, not
compiled into the game. Live code must import from the root `lib/` directory.

Some older scripts were previously pointed at whatever the live engine happened
to be. They are now explicitly bound here so that changing v8.32 does not rewrite
their interpretation. A v6/v8.29/v8.30 filename does **not** mean this is that
release's original engine, nor does passing one of these scripts validate v8.32.

- `npm run verify`: current engine, localization, forecasts and v8.32 rules.
- `npm run verify:v831-archival`: last-compatible v8.31 checks.
- `npm run simulate:v831-archival`: historical heuristic only.
- `npm run audit:passengers:v831-archival`: historical rider audit only.

Current multi-policy research uses the Player Lab described in the v8.32 design
record. Synthetic outcomes, browser observations and historical runs must be
reported separately. Never update frozen values just to make an old assertion
pass against new rules.
