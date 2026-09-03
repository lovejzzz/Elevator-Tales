# Frozen v6.2 baseline

`lib/` is the published game at `50a0da204bcb2ba359ac349e70318ab3d146ff07`. `scripts/tournament.ts` is the exact retained 72-policy tournament from that version's independent validation. Only test tooling imports this directory; the running application does not.

The v6.3 contract experiments compare against this snapshot, using fresh seeds and the same extended shopping policies on both sides. The experiment archives every generated library and runner by content hash.
