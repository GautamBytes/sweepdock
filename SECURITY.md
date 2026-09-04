# Security policy

SweepDock is an early prototype, not an audited financial product. The current app supports simulations and mainnet read-only balances/quotes. It does not construct or sign transactions. Only the current `main` branch is maintained; there are no supported production SDK releases.

## Reporting a vulnerability

GitHub private vulnerability reporting is disabled as of 2026-09-05. A dedicated private reporting channel must be established before a public beta. Until then, use a public issue only to request a private contact method; do not include vulnerability details. Once a private channel is agreed, share the reproduction there.

Do not post secrets, personal wallet data, actionable exploit payloads or sensitive logs in public issues. Provide a minimal synthetic reproduction, affected commit or deployment, expected and observed behavior, and likely impact. No response-time commitment or bug bounty is offered.

## Testing boundaries

Use local fixtures for signing, unknown outcomes, recovery and report handling. Do not probe other users' accounts, send transactions, stress public providers or test denial-of-service against the hosted app. Report problems with provider or wallet services to their respective maintainers.

The safety lab journal contains one simulated attempt. It is not evidence of production transaction recovery. Automated checks and protocol fixtures do not constitute an external security audit.
