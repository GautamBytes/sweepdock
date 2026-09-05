# Security policy

SweepDock is an early prototype, not an audited financial product. The current app supports simulations and mainnet read-only balances/quotes. It does not construct or sign transactions. Only the current `main` branch is maintained; there are no supported production SDK releases.

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/GautamBytes/sweepdock/security/advisories/new), enabled and verified on 2026-09-05. Reports are shared privately with repository maintainers. Do not disclose sensitive findings in public issues.

Do not post secrets, personal wallet data, actionable exploit payloads or sensitive logs in public issues. Provide a minimal synthetic reproduction, affected commit or deployment, expected and observed behavior, and likely impact. No response-time commitment or bug bounty is offered.

## Testing boundaries

Use local fixtures for signing, unknown outcomes, recovery and report handling. Do not probe other users' accounts, send transactions, stress public providers or test denial-of-service against the hosted app. Report problems with provider or wallet services to their respective maintainers.

The safety labs contain isolated single-attempt and three-token simulated journals. It is not evidence of production transaction recovery. Automated checks and protocol fixtures do not constitute an external security audit.

The [read-only release self-review](docs/security/readiness-review.md) records API hardening, dependency findings, deployed firewall verification and limits. It is not an independent audit.
