# Offline safety and recovery lab

This batch is local on `feat/testnet-swap-flow` at
`/Users/gautammanch/Developer/sweepdock`. It has not been deployed.

## Try it

Run `pnpm dev`, then open `http://127.0.0.1:5173/safety`, also linked from
Developer Kit. No wallet or coins are needed.

1. Choose mainnet, changed wallet or expired quote. Starting is blocked with
   a plain explanation and a stable reason code.
2. Choose the matching testnet sample and start. The marker is committed before
   the page offers any simulated response controls.
3. Refresh while waiting. The attempt becomes unknown, stays saved and cannot
   be restarted. Recheck only reads saved state; it never broadcasts or claims
   an on-chain result.
4. Open Swap Doctor. The stored event timeline explains waiting, response,
   rejection and unknown states. Its downloadable report contains stages,
   relative times and anonymous item labels, not the review's address, amount
   or quote ID.
5. Use the explicitly labelled fixture receipt control to simulate resolution,
   or simulate rejection before refreshing. Only a finished sample can be
   deliberately cleared in the UI. This removes that sample from this browser;
   there is no backup or server copy.

The original `/demo` remains an in-memory cleanup simulation. The lab is a
separate single-attempt workflow, not a multi-token cleanup queue.

## Implementation boundaries

- `checkTestnetReview` validates raw address shape, matching account, chain `-3`,
  distinct input/output, exact positive integer units and a 15-second expiry
  margin. It is called again at the persistent claim boundary. Passing these
  checks is not authorization to sign and does not validate a DEX payload.
- The journal uses only `sweepdock-safety-lab-v1` / `attempts` / `current`.
  The key holds one bounded, schema-validated, simulation-only event record.
- A single IndexedDB read/write transaction validates the existing record and
  claims or updates it. Promise resolution waits for transaction completion;
  schema errors, write failures and blocked storage never fall back to memory.
  The strict durability option is requested. This is not a guarantee against
  device failure or browser data eviction.
- Serial transactions prevent simultaneous claims from overwriting each other.
  An attempt ID plus event count prevents stale tabs from overwriting later
  events or another attempt. Refresh/new-tab recovery conservatively marks
  in-flight records unknown. Other tabs learn the latest state on recheck;
  there is no automatic cross-tab status broadcast.
- Saved events are replayed through the existing lifecycle. A returned wallet
  response is only submitted; it is not completed. Unknown states cannot
  request another signature. Persisted event data is not trusted as financial
  evidence: every record and report here is explicitly simulated.

IndexedDB transaction behaviour follows the
[MDN transaction reference](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction).

## What this does not prove

No real wallet request, payload construction, receipt lookup, on-chain swap or
testnet deployment is added. The existing wallet adapter still exposes no
signer. The lab uses synthetic account/token identifiers; they are not testnet
contracts to send funds to. Its fixture receipt control must never be wired to
a live execution flow.

Protection applies only to this browser/origin's sample journal, not another
device or application. Clearing site data loses recovery. One latest sample
is kept; production history retention and live-session recovery remain future
work. Mobile layout tests do not prove mobile-wallet approval. The documented
STON.fi router issue and phone connection check remain separate prerequisites;
see [preflight evidence](../operations/testnet-preflight.md).

## Verification commands

```sh
pnpm check
pnpm test:e2e
pnpm test:wallet
```

Unit tests cover malformed amounts/accounts, wrong networks, changed accounts,
expiry boundaries, clock rollback, lifecycle transitions, corrupt journal
records and report redaction. Chromium tests use real IndexedDB for reload,
two-tab contention, stale-tab updates and committed rejection recovery; they
inject unavailable storage and failed writes to verify safe blocking. The
separate wallet test uses the real TON Connect SDK with a synthetic wallet.

Manual code review found and corrected an expired-claim error being reported
as storage failure, and wording that implied the old in-memory demo was saved.
Both have regression tests. No independent reviewer was available.
