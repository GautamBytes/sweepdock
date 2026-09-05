# Physical wallet connection check

Status: **pending owner participation**. The automated TON Connect fixture is not a physical-device result.

Use the final release's `/app` link, with a wallet/account you choose. This test requests connection only. Do not approve a transaction or share a seed phrase. Reading balances sends the public address to TonAPI; skip that step if you do not consent. No screenshot needs to contain the address or balances.

Record: release commit, test date, phone model, OS version, browser/version, wallet/version. Mark each result Pass, Fail, or Not tested and describe unexpected behavior.

1. Tap **Connect wallet**. Check the wallet identifies SweepDock and the intended site, and requests only a public account connection.
2. Approve connection and return to the same browser tab. Verify **Wallet connected · mainnet** and your selected account.
3. Tap **Read wallet balances** if you consent. Confirm results appear or a clear provider error is shown.
4. Switch accounts in the wallet if it supports this. Old balances and quotes must clear. If the wallet does not emit account changes, disconnect and reconnect; record that limitation.
5. Switch away from the browser and return. Refresh the page: the in-memory connection should be forgotten, and reconnect should work.
6. Tap **Disconnect wallet**. Confirm the public-address input, old balances and quotes clear.
7. Cancel the wallet picker once, then open it again. Confirm the page remains usable.

Report back using: device/OS, browser, wallet, steps 1–7 results, and any error text. Private raw observations stay outside the public repository unless you explicitly agree to publish a redacted summary.
