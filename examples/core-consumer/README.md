# Standalone core consumer

This offline example imports SweepDock's packaged API to compare two synthetic token balances, reject an expensive token, preserve the TON reserve, pause an uncertain simulated outcome, and export a report without internal item identifiers. No wallet, provider, credentials or signing are used.

From the SweepDock repository, with its pinned Node/pnpm versions:

```sh
pnpm install --frozen-lockfile
pnpm example:core
```

This builds a private local tarball, installs it into a temporary directory outside the monorepo with install scripts disabled, checks strict NodeNext TypeScript usage, and runs the example in plain Node. Installation needs the npm registry; example execution is offline. The temporary consumer is removed afterward.

To inspect or adapt the consumer yourself, run `pnpm pack:core`, copy `index.mjs` from this directory into a new directory outside SweepDock, run `npm init -y`, then `npm install --ignore-scripts /absolute/path/to/sweepdock/output/core-package/sweepdock-core-0.1.0.tgz` and `node index.mjs`.

The STON fixture fits the cost policy; the NOT fixture costs too much. These are illustrative values, not current token prices. `requiredTonUnits` is `310000000`: the included token's upfront gas budget plus the reserve. The lifecycle ends at `unknown`, with no automatic retry. A normalized provider response still requires a reviewed adapter and explicit policy; this example does not authenticate blockchain receipts.

The tarball includes compiled ESM and declarations for the main API plus `/assets`, `/read-models` and `/providers`. The source workspace exports remain optimized for Vite. This is an experimental packaging/consumer proof, not a published or stable SDK release. `private: true` prevents accidental npm publication.
