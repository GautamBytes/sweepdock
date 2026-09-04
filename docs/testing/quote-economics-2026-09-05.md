# Read-only cleanup economics sample — 2026-09-05

Nine sequential mainnet quote requests ran through the locally bundled read-only API at 02:19–02:21 Asia/Kolkata (2026-09-04 20:49–20:51 UTC). No wallet, key, balance lookup, transaction or signing request was used. The hosted API was still broken during this sample.

[Exact projected results](quote-economics-2026-09-05.json) preserve amounts as integer strings and include request-start timestamps. The output asset was TON for every request. These are expired market previews, not execution evidence or current prices.

| Input     | Result                                          | Cost observation                                                                                                    |
| --------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 0.1 STON  | Provider response rejected by validation        | No usable quote                                                                                                     |
| 1 STON    | Accepted STON.fi V1                             | 0.315264586 TON expected output; 0.035 TON estimated consumed gas; approximately 11.1%, above the 10% policy        |
| 10 STON   | Accepted STON.fi V1                             | 3.152056954 TON expected output; 0.035 TON estimated consumed gas; approximately 1.11%, within the cost-ratio limit |
| 10 NOT    | Provider response rejected by validation        | No usable quote                                                                                                     |
| 100 NOT   | Provider response rejected by validation        | No usable quote                                                                                                     |
| 1,000 NOT | Provider response rejected by validation        | No usable quote                                                                                                     |
| 0.1 USDT  | Provider response rejected by validation        | No usable quote                                                                                                     |
| 1 USDT    | Provider response rejected by validation        | No usable quote                                                                                                     |
| 10 USDT   | Provider unavailable within the bounded request | No usable quote                                                                                                     |

Both accepted STON quotes required an upfront gas budget of 0.185 TON, separate from the 0.035 TON estimated consumed gas. The app also requires a 0.05 TON reserve. No wallet balance was supplied here, so passing the cost ratio does not prove affordability or authorize execution.

## Follow-up diagnosis

A subsequent direct SDK read for 100 NOT returned a `TonCo` route. The current adapter intentionally accepts only `StonFiV1` and `StonFiV2`, so that response was rejected. This explains that follow-up response, not every earlier failure. Do not interpret validation rejection as proof that there is no liquidity.

A subsequent 1 USDT read returned an accepted `StonFiV2` route: expected output 719987270 nanotons, minimum 712787398 nanotons, estimated consumed gas 12000000 nanotons, and upfront gas budget 260000000 nanotons. The later success does not erase the earlier failure. Availability and selected routes vary.

## Implication

This sample supports showing fees and explaining unsupported routes. It does not establish reliable cleanup across the three reviewed assets, broad user demand or successful swaps. Keep the integration boundaries unchanged, repeat a bounded sample from the repaired public app, and use interviews to decide whether cleanup or the developer diagnostics should lead the product story.
