# Pre-application quality pass

Goal: make the read-only product secure to demonstrate, reproducible for reviewers, useful as a library, and consistent across source, release and evidence.

Constraints: no signing, funds, grant submission, invented participant results or external outreach without named recipients and approved text. One commit per PR; author and committer manchandanigautam@gmail.com. Existing UI remains intact. Complete independent work while owner/participant steps are pending.

1. [x] Public API: inspect existing WAF and plan; configure a project-scoped 60-second per-IP limit for POST /api/ reads after reviewing the exact rule and entitlements. Preserve local concurrency cap. Bound request body time/bytes, reject malformed media types, map edge 429 responses safely, deploy a script CSP without breaking wallet transport. Document source review, dependency audit, limitations, rule identity and verification.
2. [x] Reproducibility: run the actual wallet fixture in CI; make contract capture reproducible with pinned hashes/provenance and deterministic offline checks; validate from a fresh checkout with pinned dependencies. Do not redistribute upstream bytecode without verified permission.
3. [ ] Physical device: prepare a short recording sheet and exact hosted test link. Ask owner to connect/return/change/disconnect on their phone, with no signing. Record only their observed results; leave pending until received.
4. [x] Reuse: add a standalone consumer using the core through its built package API, with exact integer fixture balances, plan and report output. Verify outside the monorepo so source aliases cannot hide packaging defects. Keep npm publication separate.
5. [ ] Feedback: prepare consent-first five-user and one-developer task scripts and a result tracker. Ask owner for participants or introductions; draft concrete invitation text before requesting send approval. Record no synthetic feedback as real evidence.
6. [ ] Release: integrate approved UI and readiness PRs after required checks; publish one verified application release, update current docs and GitHub homepage, supply a concise demo walkthrough and timestamped release evidence. Keep pending manual gates prominently visible.

Validation: focused adversarial API tests, full pnpm check, browser and wallet suites, contract checks, fresh-install/consumer tests, and bounded hosted read-only smoke checks. Never stress a public provider to test edge limits; use invalid requests or a harmless local fixture.


Progress: public edge 429 verified at request 61 with zero provider calls; ws advisory fix audited clean; 229 unit, five preflight, 64 browser, one wallet-protocol and eight fresh-capture TVM tests passed. Source-only installation and external package consumption passed. Step 3 awaits the owner's device/wallet information and actual observations. Step 5 scripts, invitations and ledger are prepared but sessions have not occurred. Step 6 integration, CI, final hosted checks and release publication are tracked in the release record; no grant or outreach has been sent.
