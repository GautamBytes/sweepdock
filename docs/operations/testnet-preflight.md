# Testnet swap preflight

Checked: 2026-09-04, approximately 22:10–22:15 IST.

Branch: `feat/testnet-swap-flow`, based on deployed commit `a2e582b`.
Workspace: `/Users/gautammanch/Developer/sweepdock` (internal SSD).

## Result

The deployed read-only application opens the official TON Connect picker. The
picker displays a mobile-wallet QR area and available wallets. A real phone
connection, address return and disconnect are still awaiting the user's test.
Opening the picker alone does not prove that a wallet fetched the manifest.

The existing baseline passes: 21 test files, 146 tests. The first attempt was
blocked by filesystem permissions on Vite's temporary cache; the authorized
rerun passed without source changes.

Full testnet execution is blocked at the contract/route feasibility gate. No
testnet implementation, signer, transaction, wallet creation, faucet request,
pool deployment, token mint or change to the hosted application was made.

## Read-only contract evidence

The current [official STON.fi swap guide](https://docs.ston.fi/developer-section/dex/sdk/v2/swap)
lists this testnet CPI v2.1 router:

`kQALh-JBBIKK7gr0o4AVf9JZnEsFndqO0qTCyT-D-yBsWk0v`

| Check                                                                | Result                                                                       |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Toncenter `getAddressInformation`                                    | Active account; 68,063,363,283 nanoTON; last transaction LT `92206675000008` |
| Toncenter `get_router_version`                                       | TVM exit code 9; no usable version tuple                                     |
| TonAPI `get_router_version`                                          | `success: false`, exit code 9                                                |
| Toncenter `get_pool_address`                                         | Exit code 9; no pool address returned                                        |
| Control: pTON `get_wallet_address` with the same slice serialization | Exit code 0; valid address cell returned                                     |

The pTON minter in the official example is
`kQACS30DNoUQ7NfApPvzh7eBmSZ9L4ygJ-lkNWtba8TQT-Px`.
Its derived router-owned token wallet is
`kQBbJjnahBMGbMUJwhAXLn8BiigcGXMJhSC0l7DBhdYABhG7`.

The pool lookup used this pTON wallet and the previously derived TesREED
router-owned wallet `kQDZwYOajSRXMeg2YQKEXvcZT0lnnWkDDib0xCBZfbJWLKHJ`.
The latter derivation was not repeated in this batch. The independent, no-input
version calls also fail, so the conclusion does not depend on that cached value.

Toncenter version result was at masterchain block `82633538`.
An active account or positive balance does not establish that its current code
supports the documented router methods. These results do not establish the
underlying cause or prove that every STON.fi testnet router is unavailable.

### Reproduce without a wallet or key

```sh
curl --fail --max-time 20 -s \
  https://testnet.toncenter.com/api/v2/runGetMethod \
  -H 'Content-Type: application/json' \
  --data '{"address":"kQALh-JBBIKK7gr0o4AVf9JZnEsFndqO0qTCyT-D-yBsWk0v","method":"get_router_version","stack":[]}'

curl --fail --max-time 20 -s \
  https://testnet.tonapi.io/v2/blockchain/accounts/kQALh-JBBIKK7gr0o4AVf9JZnEsFndqO0qTCyT-D-yBsWk0v/methods/get_router_version
```

These are public blockchain reads, not transaction submission calls. Results
may change after this check; do not turn this snapshot into a permanent status.

## Alternatives checked

The official guide says its REST swap API serves mainnet only and testnet
requires manually provisioned token liquidity. The documentation still points
to the failing router. A focused search of official documentation and STON.fi's
GitHub did not establish a replacement supported router and funded test pool.

The [Omniston SDK guide](https://docs.ston.fi/developer-section/omniston/sdk/nodejs)
lists a sandbox WebSocket endpoint, but that page does not confirm a public
TON-testnet environment with faucet assets. It is not a verified no-money
fallback. Using mainnet instead is not authorized.

## Resume requirements

1. Confirm phone connection/disconnection on the existing read-only app.
2. Obtain a currently supported testnet router and pTON/token identities from
   STON.fi, or explicit documentation of its supported no-money sandbox setup.
3. Verify getters, pool identities, unlocked state, reserves, quote computation
   and attributable receipt evidence with read-only checks.
4. Then implement the approved separate-origin testnet flow: network `-3`,
   reviewed transactions, user wallet approval, correlated results, Swap Doctor
   diagnostics and safe reload recovery. Mainnet signing stays disabled.
5. Ask separately before deploying new contracts, issuing tokens, provisioning
   liquidity or sending any test transaction. User retains wallet keys.

## Unsent support message

Hi STON.fi team, we're building SweepDock, a wallet cleanup app with swap
diagnostics. We want to test the full flow without real money. The v2 swap docs
list router `kQALh-JBBIKK7gr0o4AVf9JZnEsFndqO0qTCyT-D-yBsWk0v`, but
`get_router_version` returns exit code 9 through both Toncenter testnet and
TonAPI testnet. `get_pool_address` also fails. Could you share the current
supported testnet router, pTON/token addresses and a funded test pool, or tell
us how to access a supported no-money Omniston sandbox?

This message is a draft only. It has not been sent or posted.
