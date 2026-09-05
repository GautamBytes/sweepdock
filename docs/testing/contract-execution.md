# Contract execution evidence

## What was resolved

The documented testnet router and its pool reference code libraries that are unavailable through both Toncenter and TonAPI testnet. The router itself is active; that does not make its external code available.

| Dependency | Exact library hash                                                 |
| ---------- | ------------------------------------------------------------------ |
| Router     | `5a34c333bcdcac70d41f9afca79aa6e782f1c80a5e4b2ef896ec5e20e9182c86` |
| Pool       | `631cf98bbb3ee540dacc48256975d8e2c3080c634f39005ccd8e1593cab0035f` |

[Timestamped public-read evidence](testnet-library-preflight-2026-09-05.json) records both providers' exit codes and missing-library responses, plus contract code/data hashes and last transactions. The pTON library resolves on testnet as a working control. Both missing library hashes resolve through mainnet library lookup, and every downloaded code cell is checked against its requested hash.

The local VM reproduces `failed to load library cell`, exit code 9. Supplying only the matching library code inside that VM restores router version `2.1 beta3.2`, unlocked router/pool state and matching pool identities. This is a controlled reproduction of the missing-code failure, not a claim about why the libraries disappeared. No admin change, expiry history or restoration date has been established.

## Run the checks

Node and pnpm versions follow the repository's existing setup.

```sh
pnpm test:preflight
pnpm check:testnet
pnpm capture:contracts
pnpm test:contracts
```

- `test:preflight` runs five deterministic offline dependency/hash tests and is included in `pnpm check` and CI.
- `check:testnet` performs public reads and writes `output/contracts/preflight.json`. Exit 2 means missing libraries or failed getters; exit 1 means the check could not finish; exit 0 means these dependency/getter checks passed, **not** that a swap route or signer is approved. It never falls back to mainnet.
- `capture:contracts` explicitly downloads public testnet account state and any missing, hash-matched library **code** from mainnet for the local emulator. Exit 0 confirms a complete local capture; the report separately preserves the failed public preflight and `publicExecutionEnabled: false`. It writes `output/contracts/snapshot.json` and never signs, broadcasts, provisions liquidity or deploys anything on a network.
- `test:contracts` runs seven real TVM integration tests using the saved snapshot and makes no network calls. Run capture once first. The snapshot remains in ignored local output, so this suite is separate from network-independent CI. A new upstream deployment or repaired library set can change the diagnosis and requires reviewing/updating the pinned reproduction expectations.

## What the seven contract tests establish

1. Captured public testnet dependencies reproduce the missing router/pool library error; exact matching code restores getters and pool identities locally.
2. Tampered library code is rejected before emulation.
3. Real Wallet V4 signatures execute a TON → test token → TON round trip through the official STON SDK and contract code. Assertions cover the entire successful transaction chain, exact external message hash, recipient/minter wallet derivation, query IDs, delivered units and balances.
4. An impossible minimum returns the full input token amount, with a matching refund transfer and no TON swap payout.
5. An expired router deadline refunds the input tokens.
6. An invalid signature is rejected without advancing the wallet sequence number.
7. After restoring executed chain state, replay of the exact signed external message is rejected and cannot produce a second swap.

The wallet uses a public dummy test key, an unusual wallet ID and a synthetic balance only inside `@ton/sandbox`. No user key or network funds are involved. The seven contract tests passed locally on 5 September 2026 using the recorded capture.

## Practical limits and next public-network step

These are actual contract executions in a local VM, not public transactions or TON Connect phone approvals. They do not establish public-chain finality, provider trace authentication, a production receipt verifier, or durable live browser recovery. The browser's saved cleanup journal remains simulation-only. Wallet V4 replay protection complements, but does not replace, an app's submission journal.

Account snapshots were sampled separately, not proven against one atomic historical block. The emulator uses its own chain configuration and synthetic wallet funding. Local fee amounts and balances are not production estimates. Locally restoring missing libraries is not a public-testnet workaround and must never unlock signing in the hosted app.

Public execution needs STON.fi/TON infrastructure maintainers to restore both libraries or identify a working supported router/pool. After that, rerun the preflight, verify current pool/token identities, liquidity, gas and trace evidence, then integrate the separately scoped testnet signer and live journal. Mainnet signing remains disabled.

References: [STON v2 swap SDK](https://docs.ston.fi/developer-section/dex/sdk/v2/swap), [TON on-chain library behavior and local testing](https://docs.ton.org/contracts/techniques/using-on-chain-libraries), [TON library environment](https://docs.ton.org/foundations/serialization/library), [official router getter source](https://github.com/ston-fi/dex-core-v2/blob/main/contracts/router/get.fc).
