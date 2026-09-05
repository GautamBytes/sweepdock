# Read-only release security review — 2026-09-05

Scope: API ingress, provider reads, browser rendering/storage, deployment headers, dependency advisories and test evidence. This is an implementation self-review, **not an independent security audit**. The hosted product cannot construct or sign transactions.

## Findings and fixes

| ID  | Severity                                                     | Evidence                                                                                                                                         | Resolution                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | High dependency advisory; app exploitability not established | Omniston's transitive `ws@8.20.0`; GHSA-96hv-2xvq-fx4p (memory exhaustion) and GHSA-58qx-3vcg-4xpx (memory disclosure under specific API misuse) | Pin `ws@8.21.0` in `pnpm-workspace.yaml`. Full dependency audit reports zero known advisories on this date. The server talks to a fixed provider; this finding does not claim a demonstrated public exploit.                                               |
| S2  | Medium availability                                          | `apps/api/src/index.ts:30` keeps request and concurrency counters in memory; these do not span server instances                                  | Published one project-scoped Vercel WAF rule: POST paths starting `/api/`, 60 requests per 60 seconds per IP, fixed window, HTTP 429. Existing 30/minute and two-in-flight local limits remain secondary guards.                                           |
| S3  | Medium availability                                          | Before the fix, `apps/api/src/index.ts` awaited a byte-bounded stream without an upload deadline                                                 | `apps/api/src/request-body.ts:4` now enforces 2 KB and 5 seconds, cancels stalled/disconnected streams, releases concurrency slots and returns a redacted 408/400/413 result. Adversarial tests reproduce the old failure and check release of both slots. |
| S4  | Low UX / defense in depth                                    | Edge throttling can return non-application JSON or HTML; no script CSP was present in `vercel.json`                                              | Browser code uses HTTP 429/408 before parsing the body. Deployment adds self-hosted scripts only, blocked objects/base rewriting/framing, same-origin form actions, and disabled camera/microphone/geolocation permissions.                                |

## Verified boundaries

- Browser inputs cannot choose upstream endpoints, protocols, provider IDs or networks. TonAPI uses a fixed HTTPS host and rejects redirects; quote transport remains in the Omniston adapter.
- Amounts are integer strings; source/owner/request identity, reviewed routes, quote freshness, gas valuation and reserve checks reject mismatches. A provider label is not authentication.
- Application errors do not echo provider exceptions, API keys or account data. Application source contains no runtime logging of wallet data or raw provider payloads.
- Account and quote data remain in memory. TON Connect analytics are disabled. IndexedDB stores isolated simulation state; reports project a bounded, allowlisted event view. Hosting and upstream providers can still observe network metadata; no anonymous-network claim is made.
- No application raw HTML injection, dynamic code execution or request-selected outbound URL was found in the reviewed source. React renders provider text as text. The wallet SDK is third-party code and is not covered by an independent audit here.
- The WAF check used an unsupported route, never an upstream provider. Requests 1–60 returned 404; request 61 returned 429 with Vercel mitigation metadata. See `firewall-verification-2026-09-05.json`.

## Limits and operation

Vercel counts this rule per region, not as an exact project-wide budget. Shared IPs share a bucket, and distributed sources can exceed one bucket. The existing Hobby plan was retained; no upgrade or new paid service was purchased. DDoS mitigations remain active. To change/remove the rule, review a project-only draft in the Vercel Firewall dashboard, then publish it. Do not disable system mitigations or publish unrelated drafts.

The script CSP deliberately does not restrict `connect-src` or image sources: TON Connect uses a changing wallet directory and bridge endpoints. App-level endpoint checks remain necessary. This avoids breaking wallet transport while blocking foreign/inline script execution. Verify the final hosted picker and complete physical-device QA before claiming wallet-return support.

Significant remaining evidence gaps: physical-device results, external participant/developer observations, authenticated public-chain receipts, live recovery and independent security review. Passing tests or a zero-advisory scan cannot establish universal safety.

References: [Vercel WAF limits](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [Vercel firewall regional counters](https://github.com/vercel/vercel-plugin/blob/main/skills/vercel-firewall/SKILL.md), [memory exhaustion advisory](https://github.com/advisories/GHSA-96hv-2xvq-fx4p), [memory disclosure advisory](https://github.com/advisories/GHSA-58qx-3vcg-4xpx).
