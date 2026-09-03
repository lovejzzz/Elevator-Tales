# Elevator Tales release rule

Every public game update must include a detailed changelog entry.

- Bump `GAME_VERSION` in `lib/changelog.ts`.
- Add the newest entry first in `CHANGELOG` with player-visible changes, exact balance values, experiment or verification scale, conclusions, and remaining watch items.
- Mirror the release record in `CHANGELOG.md` for repository history.
- Never change the visible version label separately; the UI must read it from `GAME_VERSION`.
- Run the changelog invariant as part of `npm run verify` before publishing.
