# Current release

Release record: [v0.1.0-readiness.1](https://github.com/GautamBytes/sweepdock/releases/tag/v0.1.0-readiness.1). Its publication status, immutable tag and verification notes identify the exact source and deployment. This page records capabilities and manual gates; a branch or preview alone is not production evidence.

## Implemented

- Polished landing/navigation and guides explaining the problem, users and limitations.
- Real read-only balance/quote integration and multi-token cleanup planning with reviewed assets, explicit provider policy, gas economics and a TON reserve.
- Separate saved recovery simulations and anonymous diagnostic reports.
- Project-scoped API firewall, bounded request uploads, deployment script CSP, and patched WebSocket dependency.
- Per-PR unit/browser/wallet-protocol checks and an independent packed-core consumer. A separate public-state workflow captures reviewed contracts, checks pinned code/library hashes and executes eight local TVM tests.

## Verification commands

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test:e2e
pnpm test:wallet
pnpm example:core
pnpm verify:contracts
```

The last command uses public read services before offline execution. All other runtime scenarios use fixtures; dependency installation needs the package registry. No network funds or user credentials are required.

The release notes should link successful checks, exact commit/deployment, the security self-review, a snapshot hash summary and bounded hosted smoke results. Old date-stamped files elsewhere describe their own historical revisions.

## Gates still open

| Gate                                                             | Actual status                                                                                                                                |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Physical phone connect/return/disconnect                         | Basic Android Chrome/Tonkeeper check passed by owner report; broader testing pending. [Results and checklist](../testing/physical-device.md) |
| Five wallet users and one external developer                     | Deferred to a later phase; [study and ledger](../validation/participant-study.md)                                                            |
| Independent security review                                      | Not conducted; current report is a self-review                                                                                               |
| Public-chain signing, authenticated settlement and live recovery | Not implemented; hosted signing remains disabled                                                                                             |
| Grant application                                                | Paused at the owner's request; not submitted                                                                                                 |

A [three-minute walkthrough script](../validation/demo-walkthrough.md) is ready. A script is not a recorded video or participant evidence. Development milestones should distinguish this completed prototype work from future execution/receipt/recovery work.
