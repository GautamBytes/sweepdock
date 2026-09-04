# Night Ledger design QA

**final result: passed**

Selected target: second displayed ImageGen concept, Night Ledger (2026-09-05). Implementation: existing SweepDock React/Vite app, landing at `/`, all three tools retained. This report covers the UI redesign, not grant approval or live transaction readiness.

## Evidence and comparison setup

All image paths below are local evidence under `output/playwright/night-ledger/` (ignored build/QA artifacts).

- Source visual truth: `selected-reference.png`, 1010 × 1558 pixels.
- Normalized source: `reference-normalized.png`, 995 × 1535 pixels.
- Final implementation: `sweepdock-desktop-final.png`, 995 × 1535 pixels, from the in-app browser at a 1010 × 1558 CSS viewport with reported devicePixelRatio 1. The browser screenshot output is slightly scaled; source was resized proportionally to match it before the final paired comparison.
- State: `/`, dark theme, initial static sample preview, scroll position zero. Source and implementation were emitted together in the same comparison input.
- Mobile: `sweepdock-mobile-top.png` and `sweepdock-mobile-preview.png`, from a 390 × 844 CSS viewport (375 × 812 captured pixels). No mobile source was supplied; these check responsive usability, not exact mobile fidelity.
- Workspace: `sweepdock-cleanup-desktop.png`, `sweepdock-cleanup-mobile.png`, `sweepdock-doctor-desktop.png`, `sweepdock-developers-desktop.png`. Doctor shows an unknown outcome, reached by exercising the demo.
- Full-page browser stitching produced a malformed duplicated capture; it was discarded. Viewport captures were used for comparison. The implemented document extends a little beyond the source's frame; its footer remains accessible by scrolling.
- A separate focused desktop crop was unnecessary: the paired 995px-wide captures expose the headline, preview rows and tool sections clearly. The additional mobile detail capture was inspected for timeline text, status markers and card boundaries.

## Findings and fixes

No actionable P0/P1/P2 findings remain.

### Iteration 1

Evidence: `sweepdock-desktop-iteration-1.png`, compared with the selected reference in the same visual input.

- P2, `.ledger-preview`: repeated image edges created horizontal stripes. Set background-size to cover and disabled repetition. The post-fix image has a continuous silver texture.
- P2, `.landing-hero`: excessive header, line and section spacing placed the preview about 69px too low. Reduced header/hero padding, headline line height and CTA margins. The final preview begins at essentially the reference's vertical position.
- P2, `.landing-tools`: narrow columns created an extra text line and excessive lower-page height. Removed the inter-column gaps and side padding, shortened the toolkit description, and tightened section spacing. Final descriptions occupy two lines and tool dividers align closely with the reference.

### Iteration 2 and final comparison

Evidence: `sweepdock-desktop-final.png` paired with `reference-normalized.png`. Silver edges, hero placement and tool wrapping were rechecked after fixes. Mobile sample panels stack cleanly; the headline, CTA pair, status label, ledger columns and timeline remain readable without horizontal overflow.

## Required fidelity surfaces

- **Typography:** locally hosted Instrument Sans and Newsreader italic preserve the large plain/italic headline contrast. Display and body hierarchy, wrapping and fallbacks were inspected. Exact generated letterforms and browser antialiasing differ slightly (P3); no text is truncated. Workspace forms use the same sans family.
- **Spacing/layout:** centered two-line hero, paired CTAs, wide shelf/timeline composition, three tool entrances and restrained footer follow the reference. On mobile the navigation wraps intentionally and the preview/tool columns stack. Small vertical offsets at the bottom of the desktop frame are acceptable P3 polish, with all content reachable.
- **Colors/tokens:** deep plum canvas, pearl primary actions, lavender accents, coral status dot and amber unknown state are applied through shared tokens. Preview panel overlays are darker than the image to support readable text. Automated contrast/accessibility checks pass at all tested widths.
- **Images/icons:** the satin and receipt background is an ImageGen asset compressed to a 301KB JPEG. No screenshot is substituted for functional UI. Library outline icons preserve the visual family; sample tokens use neutral coin icons rather than implying verified token logos. Receipt slips intentionally omit fictitious data. No visible compression artifacts, broken images or transparency halos were found.
- **Copy/content:** retains the selected headline and demo/live-preview actions. Landing balances reuse actual offline fixtures and remain labelled sample data. The unknown state asks for matching evidence, not another signature. Toolkit remains in development; no publication, audit, traction or grant claims were added.

## Functional and safety evidence

- `pnpm check`: typecheck, 180 unit tests, production build, standalone API artifact checks and lint pass.
- `E2E_PORT=5185 pnpm test:e2e`: 36 tests pass, including landing at 360, 390, 768, 1010 and 1440px; automated WCAG checks; no external landing requests; and preservation of a paused simulation through home navigation.
- Existing cleanup, live quote and persistent safety-lab tests remain passing.
- In-app browser: demo review → unconfirmed simulation → Swap Doctor shows `status_unknown`; Developer Kit navigation and development status verified. Landing, mobile preview and workspace states were visually inspected.
- Initial icon-import error was corrected from a removed brand icon to the supported globe icon. No new browser errors followed the correction; the final landing browser tests explicitly assert no page errors.
- Earlier default-port browser run reused an old server and failed only the new landing tests. Added optional `E2E_PORT`; supplying it requires a fresh server, preventing that false verification.
- Font licenses and asset provenance are included under `apps/web/public/`. Fonts and images load locally. Signing remains disabled by the existing backend and frontend guardrails.

## Residual gaps / follow-up polish

- P3: minor generated-font, decorative receipt and lower-page spacing differences from the image remain. These do not change the selected direction or block use.
- Physical-phone TON Connect QA is still outstanding from the earlier engineering work. This UI pass does not establish wallet integration readiness on a real device.

## Implementation checklist

- [x] Landing route and three tool entrances work.
- [x] Shared workspace theme applied without changing transaction logic.
- [x] Generated asset and licensed local fonts included.
- [x] Desktop and mobile visual checks completed.
- [x] Accessibility, navigation and existing safety regressions checked.
- [x] Preview kept running for user review.

final result: passed

## Website documentation extension (2026-09-05)

The user requested on-site product reasoning and audience-specific instructions. Added six guides using the approved Night Ledger typography, color tokens and existing workspace navigation. The landing page now has a Docs link and a dedicated introduction to the guides. No new visual direction or decorative asset was needed.

Content was checked against the original product specification, current README, cleanup/live controls, safety-lab controls and core amount/policy functions. Planned execution, SDK publication, Telegram integration, user research and independent review are distinguished from working features. The project intention is expressed in product voice without an invented founder story or adoption claims.

In-app browser captures: `output/playwright/docs/sweepdock-docs-desktop.png` at a 1440 × 1000 CSS viewport; `sweepdock-docs-mobile.png` and `sweepdock-docs-mobile-instructions.png` at 390 × 844. Checked guide hierarchy, active navigation, mobile wrapping, section jumps and step-by-step instructions. No clipping or unreadable content found.

Validation: 180 unit tests; typecheck/build/API artifact/lint; 44 browser tests including eight new docs checks. The documentation navigation loads without external requests or page errors. Direct section URLs survive refresh, and unknown guide routes offer a return to the docs.

final result: passed

## Clearer navigation and hero — 2026-09-05

The landing page now states the product's purpose: “See which tokens are worth swapping.” The supporting paragraph explains TON balances, fees and the keep-or-swap decision. A visible note explains that the demo needs no wallet and makes no real transactions.

The header groups How it works, Tools, Docs and For developers in a compact navigation bar, with a separate Try the demo action. The first two links target explanatory sections; GitHub moves to the footer. Three ordered steps introduce balances, fee comparison and the decision. The three existing tools remain available, with clearer descriptions.

Validation: `pnpm check` passed with 181 tests, typecheck, build, standalone API checks and lint/format. All 44 browser tests passed, including accessibility and overflow checks at 360, 390, 768, 1010 and 1440px, both new section links, refresh at an anchor, Docs navigation and retention of paused simulation state. Desktop 1440px and mobile 390px visual review confirmed readable copy and navigation. A final paragraph-balancing adjustment avoids a one-word last line on desktop; targeted landing checks cover that final CSS.
