# Provider boundaries

SweepDock owns the cleanup policy, exact amounts, gas/reserve checks, lifecycle and diagnostics. It currently uses TonAPI for balances and Omniston for quotes. Those are the only live adapters configured. A provider replacement needs implementation and review, but does not require rewriting the core planner or API orchestration.

## Ownership

| Layer                                    | Responsibility                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/core/read-models`              | Normalized, bounded read-only TON data; provider IDs are data, not SDK types                                                                     |
| `packages/core/providers`                | `BalanceProvider`, `QuoteProvider`, `ReadProviders`, explicit `ReadPolicy`, source/request/route/freshness validation                            |
| `packages/core/planner`                  | Integer economics, reviewed token identities, selected output, 10% cost ceiling, aggregate gas and 0.05 TON reserve; requires an explicit policy |
| `packages/omniston-adapter`              | STON SDK transport and raw response validation, including STON V1/V2 route continuity, gas, asset identity and slippage                          |
| `apps/api/src/tonapi`                    | Bounded TonAPI reads, pagination and reviewed-token normalization                                                                                |
| `apps/api/src/composition`               | Concrete adapters, optional credentials and the default deployment wiring                                                                        |
| `apps/shared/read-policy`                | Deployed source IDs, approved protocol allowlist and visible provider names                                                                      |
| `apps/api/src/index` and `quote-preview` | Provider-independent request handling and reference-quote valuation                                                                              |

## Replace a provider

1. Implement the corresponding port. Return normalized read-only TON-mainnet data, bounded integer strings and truthful provenance. Keep transport decoding, provider payloads, endpoint selection, credentials, raw route verification and timeouts inside the adapter.
2. Validate the actual provider route semantics: token/minter identities, continuity, included fees, protected output, slippage and gas accounting. A source string is not authentication. Unknown protocol behavior must remain rejected until reviewed.
3. Change the explicit deployment policy and display names in `apps/shared/read-policy.ts`, then wire the implementation in `apps/api/src/composition.ts`. The API constructor rejects mismatched IDs. The API and browser use the same policy; deploy them together.
4. Run adapter-specific tests and the existing API/planner tests. Prove malformed data, stale replies, cancellation, incorrect assets/amounts, spoofed provenance and unapproved routes are rejected. Recheck real read-only behavior for the new service before release.

No request can select a provider, endpoint or route allowlist. There is no automatic fallback to another provider or network. Credentials never enter the shared policy or browser.

## Reference quote provenance

USDT gas valuation now uses `source: 'reverse-quote'` plus a `provider` ID. The primary and reverse quote must come from the configured quote provider. The API validates both independently and binds the reference amount to the primary expected output; it discards any adapter-supplied valuation and computes its own. Missing or mismatched references leave valuation unavailable. The core also rejects a valuation attributed to another provider.

This updates the prototype's previous `omniston-reverse-quote` response shape. Browser/API code and fixtures migrate together; old tabs should reload after deployment. There is no published stable SDK or persisted live-quote format to migrate.

## Evidence and limits

`apps/api/test/provider-independence.test.ts` substitutes `alternate-balances`, `alternate-quotes` and `ReviewedPool` into the real API and planner. These are explicitly synthetic test doubles, not available services. Tests also reject mismatched deployment wiring, source spoofing, unapproved routes, wrong amounts/owners, stale quotes and mixed gas valuation, while keeping signing/build/tracking endpoints unavailable. Browser tests cover provenance rejection.

The independence established here is for balance/quote reads and cleanup decisions on TON. It does not create another live integration, remove blockchain/network dependencies, or implement a provider-neutral execution/receipt adapter. Existing lifecycle and saved recovery demonstrations remain simulation-only. Seven separate local TVM tests exercise real STON contracts; public-testnet execution remains subject to the documented missing libraries.

## Grant positioning

STON.fi/Omniston remains the first integration and the proposed grant's integration focus. Core portability reduces the risk that the product must stop developing when one service is unavailable. Future funding should cover new execution/receipt/recovery and reusable-consumer work, not the planner, dependency boundaries or local contract tests already completed. Grant application narratives and personal contact details are maintained privately, outside this repository.
