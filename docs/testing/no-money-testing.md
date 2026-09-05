# Testing without real money

## What can run now

### Application simulation

Open `http://127.0.0.1:5173/demo` after `pnpm dev`.

1. Keep STON selected, then select NOT and REDO.
2. Review selection. REDO should be skipped because its simulated cost is too high.
3. Approve each remaining simulation separately.
4. Open Swap Doctor to inspect the timeline and download its redacted report.
5. Reset and choose the unknown, partial or rejected outcome. The queue must pause instead of automatically retrying.

These are simulated amounts and events. No wallet, coins, faucet or network is needed. This tests the current application lifecycle and reports, not contract execution or real settlement. Saved simulation recovery is available in `/safety/cleanup`; real transaction construction remains unimplemented.

### Official wallet SDK with a fake wallet

Run `pnpm test:wallet`. It starts a separate loopback server on port 5174 with a **test-only** manifest configuration. Playwright supplies a synthetic injected wallet and a synthetic wallet registry. It runs the actual installed TON Connect SDK and picker, connects the fixture account, reads fixture balances and disconnects. The fixture throws if any signing RPC is requested. HTTPS requests are intercepted; this does not access a real wallet or real funds.

The `sweepdock.test` URL in this test is deliberately not a published manifest. Do not copy it into a user's environment file. No fixture is included in the production application code.

Run `pnpm check` and `pnpm test:e2e` for amount, valuation, identity, cancellation, lifecycle, error, responsive and accessibility checks. A passing simulated test is not evidence of a real swap.

### Real market reads, no spending

`/app` obtains real quotes and optionally reads a public mainnet address. It cannot build, sign or send transactions. A USDT gas estimate appears only if a supported reference quote is also available and fresh. A provider failure or unsupported route leaves cost unavailable.

## TON testnet: the equivalent of test Bitcoin

TON has a separate testnet with faucet coins used for development. The official guide points to `@testgiver_ton_bot` and Acton's faucet. Use a separate testnet wallet created inside a trusted wallet application; never paste its seed phrase into SweepDock or a chat. Faucet availability and limits can change.

Source: [TON's test-coin guide](https://docs.ton.org/onboarding/wallet-apps/get-coins).

TON Connect identifies mainnet as `-239` and testnet as `-3`. The current SweepDock live screen accepts mainnet public account connections only; a testnet account cannot be used against mainnet balances/quotes. A future testnet build must have a separate origin, provider configuration and token registry. Do not toggle a connected mainnet session into testnet with a query parameter.

Source: [TON Connect network guidance](https://docs.ton.org/applications/ton-connect/faq).

## Why a faucet alone does not test the full swap

STON.fi documents testnet DEX v2 swaps as a manual setup: its regular REST API serves mainnet, and testnet liquidity is scarce. Testers must source/mint test jettons, use known testnet contracts, and create/fund the needed pools. Test TON alone is insufficient. This path tests the DEX contracts but is not automatically the same as the production Omniston aggregation path.

Source: [STON.fi testnet swap guidance](https://docs.ston.fi/developer-section/dex/sdk/v2/swap).

Omniston separately documents `wss://omni-ws-sandbox.ston.fi`. The SDK guide does not establish that this service is a public TON-testnet faucet environment with free copies of mainnet assets. Its exact supported networks, tokens and resolver liquidity still need confirmation. SweepDock does not enable this endpoint for signing or call it equivalent to Bitcoin testnet.

Source: [Omniston SDK environments](https://docs.ston.fi/developer-section/omniston/sdk/nodejs).

## Remaining no-money on-chain work

Before claiming full testnet coverage: verify the environment and contract identities; set up a dedicated testnet wallet and test assets/pools; implement reviewed transaction building and network-bound signing; correlate real testnet settlement; then exercise success, rejection, expiry, refunds and uncertain outcomes. The application must still keep mainnet signing disabled. No testnet wallets, faucet requests, new contracts, pools or chain transactions were created by this implementation batch.

A TON local contract sandbox is another testing layer, not a substitute for a wallet/bridge/aggregator test. It would require appropriate contract fixtures; that harness is not currently implemented.
