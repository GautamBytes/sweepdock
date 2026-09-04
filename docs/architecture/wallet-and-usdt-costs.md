# Read-only wallet connection and USDT gas valuation

Implementation batch: 2026-09-04. Based on `8395fee`; branch `feat/wallet-cost-checks`. Source and dependencies stay on the internal SSD.

## USDT valuation contract

The server obtains the selected STON/NOT→USDT quote. It then requests a read-only USDT→TON reference using the primary quote's exact expected USDT output as input. Both pass the same address, amount, slippage and STON.fi V1/V2 route validator. No reference swap is built or executed. A DeDust or other unsupported route cannot supply a valuation.

The SDK stream now skips rejected offers while waiting for its first acceptable offer, inside the existing 15-second stream deadline. It does not reconnect or request another stream automatically. This matters because an unsupported resolver route can arrive before a supported route. If none passes, no quote is accepted. The two sequential reads share an overall 20-second cancellation deadline.

The browser calculates:

```text
estimated gas in micro-USDT = ceil(
  consumed gas in nanoTON × reference input in micro-USDT
  / reference minimum output in nanoTON
)
```

Using minimum output, which is already net of reference protocol fees, gives a conservative quote-derived valuation. The primary USDT cost threshold uses minimum USDT output, not its larger expected output. The reference trade's own network gas is not added: that trade never happens. Primary protocol fees are not subtracted twice. Native upfront gas budget plus 0.05 TON reserve is checked independently against a fresh, complete wallet snapshot with sufficient selected input.

The valuation is optional and contains source, reference quote ID, exact input/minimum units and freshness times. It must bind to the primary quote's output amount. Both snapshots must remain fresh; missing, mismatched, zero, stale or future-dated reference data never becomes zero cost. Local freshness is at most 30 seconds, not a provider expiry guarantee. The reference does not assume USDT equals one US dollar and is not an oracle or guaranteed replacement price. All signing remains disabled.

TonAPI's rates endpoint is explicitly display-only, so it is not used to authorize this cleanup policy: [TonAPI rates guidance](https://docs.tonapi.io/tonapi/rest-api/rates).

## Wallet adapter

Pinned official React/UI SDK: `@tonconnect/ui-react` 3.0.2; resolved SDK 4.0.2. The app lazily imports the SDK only after the user clicks Connect wallet on `/app`. It opens the official picker through `TonConnectUI`; the app-facing adapter exposes connection, subscription, pause/resume and disconnect only—no signing method.

- Analytics are explicitly `off` in both SDK and UI configuration; the SDK defaults to telemetry otherwise.
- Protocol session storage is memory-only and is not shared with the demo. Refreshing loses the session. UI preferences may be retained by the SDK; no server history is created.
- No automatic connection restoration. The first approved picker opening happens after the React mount/cleanup probe.
- Set the connection network to mainnet (`-239`) and independently validate every returned account's raw address and chain. Testnet or malformed accounts cannot populate mainnet wallet reads.
- Account, chain, error or disconnect changes remount the live read state, aborting prior requests and clearing balances/quotes. Reading a connected balance still requires a separate explicit click and TonAPI disclosure.
- Leaving the live page or hiding it pauses the bridge and closes the picker. A visible active wallet page can resume the existing bridge. A fresh demo page does not import or initialize the SDK.
- This connection is public-account discovery, not authenticated user login or cryptographic proof of account ownership. No `ton_proof` is requested.

Vite prebundles the dependency on startup to prevent a development-page reload on the first dynamic import. Browser code is still split into a lazy SDK chunk; prebundling does not initialize a wallet session.

## Hosting prerequisite—not yet performed

TON Connect requires this app's own publicly accessible HTTPS manifest. No public SweepDock origin is approved or hosted yet, so the default local preview keeps Connect wallet disabled while address lookup and quote reads remain usable.

After the user approves an origin:

1. Host `tonconnect-manifest.json` with the actual app URL, name `SweepDock`, and a public HTTPS PNG/ICO icon URL. Use a square PNG, ideally 180×180. Do not use the existing SVG favicon as the wallet icon.
2. Make the manifest/icon accessible without login and with wallet-compatible CORS. Do not borrow another application's manifest or expose Vite to the internet.
3. Set `VITE_TONCONNECT_MANIFEST_URL` to the hosted manifest URL in the root `.env.local`, then restart the local app. This value is public configuration, not a secret. Root environment loading is configured explicitly.
4. Test phone/desktop wallet connection and disconnect with the user. Connecting is separate from approval to spend; signing remains absent in this build.

Sources: [TON Connect wallet flow](https://docs.ton.org/applications/ton-connect/how-to/connect), [manifest specification](https://github.com/ton-blockchain/ton-connect/blob/main/spec/manifest.md).

See [no-money testing](../testing/no-money-testing.md) for simulation, protocol fixtures and the distinction between TON testnet and Omniston sandbox. No real wallet approval or end-to-end on-chain swap is claimed by this batch.
