# Contributing to SweepDock

SweepDock is a read-only TON integration prototype with separately labelled offline simulations. Start with the [README](README.md) for current scope and the [security policy](SECURITY.md) for reporting sensitive findings.

## Development

Use Node 24.19.0 and pnpm 11.24.0:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

No wallet, API key or funds are needed for the offline routes or automated checks. Work on a branch, keep changes focused and explain the problem and verification in the pull request.

Before requesting review:

```sh
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:wallet
```

`pnpm check` also builds the server bundle and imports it from a temporary directory outside the monorepo. This catches runtime imports that a TypeScript-aware test runner can hide. Generated `dist` output is not committed.

## Integration boundaries

- Preserve exact integer amounts, network and asset identity checks, quote freshness and fail-closed provider handling.
- Keep signing and transaction construction disabled in this prototype. An unknown outcome must never trigger an automatic retry.
- Keep fixtures clearly labelled and use synthetic accounts. Never include seeds, keys, personal wallet histories, provider payloads or access tokens in issues, tests, screenshots or diagnostic reports.
- Local checks do not prove a deployed function, physical-wallet return flow or on-chain settlement works. Describe what was actually exercised.
- Provider calls are explicit read-only operations; `/demo` and `/safety` must remain offline.

Changes to custody, signing, persistence or trust boundaries need a documented design and security review before implementation. See the architecture and testing documents linked in the README.

SweepDock is available under the [MIT License](LICENSE). Contributions must be compatible with that license. Third-party dependencies retain their own licenses.
