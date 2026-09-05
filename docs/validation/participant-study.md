# Wallet-user and developer validation

Status: **not conducted**. Target: five TON wallet users and one external developer. These targets are a small formative study, not adoption metrics or a statistical sample. Owner participation in device QA does not count as independent user validation.

## Consent and handling

Participation is voluntary. Explain that the app is a read-only prototype with separate simulations. No funds or signing are needed. Ask permission before recording; written notes are sufficient. Use anonymous participant IDs. Do not collect keys, wallet addresses, balances, contact information or account histories in the public repository. Get separate permission before publishing quotations or identifying a participant. Private raw notes stay with the owner.

## Wallet-user session — approximately 10 minutes

Before showing the product, ask about the last time they had small token balances and what they did. Record the answer without suggesting that cleanup is useful.

1. Show the homepage. Ask them to explain the product in their own words and identify what it can do today.
2. Open `/demo`. Ask which sample token they would keep, and why. Observe whether they can distinguish swap cost, output and the TON reserve.
3. Choose an unknown simulated outcome. Ask what they would do next. Observe whether they understand that retrying is unsafe while the outcome is uncertain.
4. Ask them to find an explanation in Docs without coaching. Record confusing words and dead ends.
5. Ask whether this solves a problem they actually have, how they solve it today, and what would stop them using it. Optional real-address reads require their separate consent.

For each task record: completed unaided / completed with help / failed / skipped; the observed stumbling point; severity; and whether it led to a change. Do not convert hypothetical interest into active users or savings.

## External developer session — approximately 20 minutes

Use a fresh clone and pinned tooling. Ask the developer to run `pnpm example:core`, explain the source/protocol trust boundary, locate the contract verification command, and identify one integration obstacle. Ask them to review fee/reserve semantics and the separation between normalized receipts and authenticated chain evidence. Record their findings and link fixes to commits. This is developer feedback, not an independent security audit unless a qualified reviewer separately agrees to that scope.

## Results ledger

| Participant | Role               | Consent | Session       | Findings      | Fix / retest   |
| ----------- | ------------------ | ------- | ------------- | ------------- | -------------- |
| U1          | TON wallet user    | Pending | Not conducted | None recorded | Not applicable |
| U2          | TON wallet user    | Pending | Not conducted | None recorded | Not applicable |
| U3          | TON wallet user    | Pending | Not conducted | None recorded | Not applicable |
| U4          | TON wallet user    | Pending | Not conducted | None recorded | Not applicable |
| U5          | TON wallet user    | Pending | Not conducted | None recorded | Not applicable |
| D1          | External developer | Pending | Not conducted | None recorded | Not applicable |

Significant usability failures should be fixed and retested before claiming the flow is validated. A session count alone is not success evidence.
