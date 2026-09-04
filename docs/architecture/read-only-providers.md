# Read-only balances and quote preview — 2026-09-04

This batch implements the next two user-approved targets. It is not a signing release or completion of every Task 4/6 requirement in the original roadmap.

## Local paths and execution

Repository: `/Users/gautammanch/Developer/sweepdock`, branch `feat/read-only-quotes`, based on foundation commit `40018f8`. All source, dependencies and artifacts remain on the internal SSD outside iCloud.

`pnpm dev` runs the React app and a local Hono API on 127.0.0.1. Vite's `runner` config loader resolves TypeScript workspace dependencies correctly; the default bundled config loader incorrectly externalized a source-package import during the initial local restart. Static frontend builds do not contain an API runtime. No public deployment has been made.

## Reviewed identities

The initial read-only registry is checked against Tonkeeper's asset list and the official Omniston examples. USDT's six decimals were independently retrieved from TonAPI's canonical jetton metadata endpoint. Registry approval is by normalized master address and decimals, not by symbol or provider whitelist tag.

| Token | Decimals | Mainnet master                                                       |
| ----- | -------: | -------------------------------------------------------------------- |
| STON  |        9 | `0:3690254dc15b2297610cda60744a45f2b710aa4234b89adb630e99d79b01bd4f` |
| NOT   |        9 | `0:2f956143c461769579baef2e32cc2d7bc18283f40d20bb03e432cd603ac33ffc` |
| USDT  |        6 | `0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe` |

Native TON is output/reserve only. A raw address does not encode network, so raw input is interpreted explicitly as mainnet. Test-only friendly addresses, malformed/checksum-invalid addresses, DNS names and unsupported workchains are rejected. Unknown assets, metadata mismatches, nonzero locks, custom payload/scaled UI/extensions and scam-tagged accounts are not selectable. Reviewed identity does not constitute a token-contract security audit.

Sources:

- https://raw.githubusercontent.com/tonkeeper/ton-assets/main/jettons.json
- https://docs.ston.fi/developer-section/omniston/sdk/nodejs.md
- https://tonapi.io/v2/jettons/0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe

## Balance boundary

Client: `POST /api/balances`, strict JSON `{ address }`. The address stays out of request URLs and application logs, but must be shared with TonAPI. The UI discloses that before the user clicks. No addresses or history are stored in a database.

Server upstreams, fixed host only:

- `GET https://tonapi.io/v2/accounts/{canonicalAddress}`
- `GET https://tonapi.io/v2/accounts/{canonicalAddress}/jettons?limit=100&offset=N`

The official OpenAPI specifies native balance as int64 JSON number and jetton balances as strings. Node 24's JSON reviver source context preserves native digits before rounding; returned monetary units are strings. Strict schemas reject invalid/exponent/negative quantities. The worker compares the returned account identity to the requested account.

A maximum of three 100-row pages is read. A full final page or duplicate identities marks the response incomplete; incomplete reads cannot clear affordability or enable balance selection. Short pages terminate pagination. Each response body is bounded to 2 MB; provider reads share a 12-second timeout. Redirects are rejected. There is no automatic retry or hidden fallback to sample balances.

Only approved response fields are projected to the browser. Provider images/URLs and raw payloads are excluded. The local API applies no-store, no-referrer and nosniff headers, same-origin checks, a 2 KB request limit, at most two in-flight operations and 30 reads/minute. The rate budget is process-global for this single-user local server and does not trust forwarded IP headers. It is not a distributed public-deployment rate limiter.

Source: https://raw.githubusercontent.com/tonkeeper/opentonapi/master/api/openapi.json

## Quote boundary

Client: `POST /api/quote`, strict JSON `{ input, output, inputUnits }`. Supported inputs STON/NOT/USDT; output TON/USDT; same input/output rejected. No wallet address is required or sent for price discovery.

Official package: `@ston-fi/omniston-sdk` **0.8.9**, protocol v1beta8, `wss://omni-ws.ston.fi`. The adapter uses `WebSocketTransport` without automatic reconnect, no logger and no secret. Every operation has a 15-second deadline and disposes the subscription/socket after the first accepted quote, cancellation, no-quote event, stream closure or error.

RFQ requests fix integer input units, zero integrator fee, swap-only settlement, one route, no risky routes and 10,000 PIPS (1%) maximum slippage. Native TON uses the SDK's native asset variant, never an invented jetton address. Normalization checks outer and route asset identities/continuity, input amount, supported TON-only route protocol, bounded route structure, minimum-output protection, source timestamp and gas budget consistency. Only STON.fi V1/V2 read-only routes with reviewed intermediates are accepted. This does not validate an executable transaction payload; no payload is built.

Provider field meanings, verified against the installed declarations and official QuotePresenter:

- `outputUnits`: output after provider fees. Do not deduct `protocolFeeUnits` a second time.
- `minOutputAmount`: minimum for trader-supplied slippage, not the recommended-slippage alternative.
- `gasBudget`: upfront source-native units; not the amount all expected to be consumed.
- `estimatedGasConsumption`: estimated spent source-native units; TON uses nine decimals.
- Missing gas values remain unknown, not zero. Gasless execution is not enabled.
- `quoteTimestamp` is a timestamp, **not expiry**. The provider contract has no guaranteed quote-expiry field. Our local freshness window is at most 30 seconds and `providerExpiry` is explicitly null.

Changing the pair/amount, loading another wallet or leaving the live screen cancels pending work or clears quote state. Old responses cannot replace a newer selection. No read-only quote can trigger wallet approval.

Source: https://github.com/ston-fi/omniston-sdk/blob/main/examples/react-app/components/QuotePresenter.tsx

## Cost policy and limitations

For TON output, compare estimated consumed TON gas with net output in the same units, using integer arithmetic and the existing 10% policy. Separately require the selected input balance and enough native TON for upfront budget plus 0.05 TON reserve. Balance snapshots older than 60 seconds or incomplete snapshots do not clear the wallet check.

For USDT output, the quote and gas breakdown work but no TON-to-USDT gas valuation is implemented. The cost status remains unavailable and the preview is not cleared for cleanup. This is intentionally conservative; do not infer the quoted swap is cheap merely because its raw output is positive. All policy messages are estimates, not guaranteed execution economics.

## Real read evidence

These observations were obtained from actual mainnet read endpoints during implementation, with no wallet connection, signature, transaction build or spend:

- One STON to USDT returned net output `433907` base units (0.433907 USDT), minimum `429568`, gas budget `260000000` nanoTON and estimated gas `37500000`, via StonFiV2.
- One STON to TON returned net output `318910071` nanoTON, minimum `315720971`, gas budget `185000000` and estimated gas `35000000`, via StonFiV1. The browser rendered the quote and correctly flagged estimated gas above 10% of output.
- The published canonical-USDT admin account was used as a public read-only smoke-test address, not represented as the user's wallet. The local API returned a complete five-asset result, preserved native amounts as a string and recognized canonical USDT. No private wallet history was saved as a fixture.

These are point-in-time quote observations, not trades, standing prices, proof of liquidity at other sizes, or a complete economics study. Deterministic tests use separately labeled synthetic fixtures based on observed schema shapes.

## Remaining gates

- Reliable USDT cost valuation; more realistic-size economic samples and user validation.
- Production API packaging, provider quota/reliability study, deployment privacy controls and independent review.
- Quote refresh immediately before signing, actual payload validation, TON Connect, settlement evidence, local persistence and duplicate-send protection.
- Telegram device flow, controlled mainnet pilot and grant-ready evidence.

No API purchases, bot setup, publishing or grant submission occurred. Neither this work nor automated tests constitute an independent security audit.
