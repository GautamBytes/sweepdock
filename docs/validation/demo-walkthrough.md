# Three-minute reviewer walkthrough

Use the release and verification links in `docs/operations/current-release.md`. State the exact tested revision when recording. Keep personal accounts and wallet data out of the recording.

- **0:00–0:25 — Purpose:** Open `/`. Explain that SweepDock compares small TON token balances against fees and the reserve before a user decides whether a swap is worthwhile.
- **0:25–1:00 — Decisions:** Open `/demo`. Show sample token decisions and the fee/reserve explanation. Say that these balances and prices are fixtures.
- **1:00–1:35 — Recovery:** Open `/safety/cleanup`, simulate an uncertain outcome, refresh, and inspect the saved Doctor timeline. Explain that the journal is a simulation and does not prove live settlement.
- **1:35–2:00 — Real integration:** Show `/app` and a read-only quote for a supported pair. Explain that data is live but signing is disabled. If the provider is unavailable, show its error honestly; do not substitute fixtures and call them live.
- **2:00–2:35 — Engineering:** Show passing CI, `pnpm example:core`, and the separate public-state contract workflow. Explain the exact-hash code checks and local VM boundary.
- **2:35–3:00 — Remaining work:** Point to the current status: physical-device and participant results as recorded, then future public execution, authenticated receipts and live recovery milestones.

This is a recording script, not evidence that a video or interview has already been made.
