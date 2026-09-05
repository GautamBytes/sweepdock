import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface DocPage {
  slug: string;
  title: string;
  label: string;
  audience: string;
  summary: string;
  sections: { id: string; title: string; body: ReactNode }[];
}

export const docPages: DocPage[] = [
  {
    slug: '',
    label: 'Why SweepDock exists',
    title: 'A clearer decision before a swap.',
    audience: 'Start here',
    summary:
      'The purpose, the people we are building for, and the problem we want to make easier.',
    sections: [
      {
        id: 'intention',
        title: 'Our intention',
        body: (
          <>
            <p>
              We are building SweepDock to help TON wallet owners review
              supported tokens they no longer want, understand the cost of
              converting them, and follow the outcome of each swap. A useful
              cleanup should leave you with a decision you understand, including
              when keeping a balance makes more sense.
            </p>
            <p>
              We also want TON developers to reuse the same amount checks, cost
              rules and diagnostic events. The consumer app gives those tools a
              concrete workflow to support and test.
            </p>
          </>
        ),
      },
      {
        id: 'problem',
        title: 'The problem we are solving',
        body: (
          <>
            <p>
              A small token balance still asks you to make several decisions:
              whether the token is supported, what you could receive, how much
              TON the next operation needs, and whether the cost is reasonable.
              Repeating that review across unwanted balances takes effort.
            </p>
            <p>
              Unclear outcomes create a second problem. A wallet response does
              not, by itself, establish that the intended swap completed. If the
              result is uncertain, sending again can create another attempt
              before you understand the first one.
            </p>
            <p>
              These are the problems the prototype is designed to explore. We
              still need prospective users and developers to confirm how often
              they encounter them and whether SweepDock improves their current
              workflow.
            </p>
          </>
        ),
      },
      {
        id: 'audiences',
        title: 'Who it is for',
        body: (
          <>
            <h3>TON wallet owners</h3>
            <p>
              You have unwanted, supported token balances that may still be
              worth converting. SweepDock is aimed at economically meaningful
              leftovers; very small dust may cost more to convert than it
              returns.
            </p>
            <Link to="/docs/wallet-users">
              Start with the wallet user guide
            </Link>
            <h3>TON application developers</h3>
            <p>
              You are adding swaps to a website or exploring a future Telegram
              Mini App integration, and want predictable state handling and
              reproducible failure scenarios. The current kit is repository
              source, with no published npm release.
            </p>
            <Link to="/docs/developers">Start with the developer guide</Link>
          </>
        ),
      },
      {
        id: 'scope',
        title: 'One workflow, three tools',
        body: (
          <>
            <ul>
              <li>
                <strong>Wallet Cleanup</strong> lets you practise selecting
                balances and reviewing costs, with a separate route for live
                read-only previews.
              </li>
              <li>
                <strong>Swap Doctor</strong> explains events from your cleanup
                or safety-lab simulation and exports a local report.
              </li>
              <li>
                <strong>Developer Kit</strong> exposes the shared rules behind
                those screens for inspection and development.
              </li>
            </ul>
            <p>
              The current app cannot build, sign or send a real transaction.{' '}
              <Link to="/docs/status">
                Read what works today and what is still planned.
              </Link>
            </p>
          </>
        ),
      },
    ],
  },
  {
    slug: 'approach',
    label: 'Why this approach',
    title: 'Check the cost. Explain the outcome.',
    audience: 'Product reasoning',
    summary:
      'Why a focused cleanup workflow and a shared toolkit fit the problem, and where that reasoning still needs evidence.',
    sections: [
      {
        id: 'cost-first',
        title: 'Start with the economics',
        body: (
          <>
            <p>
              Converting a balance only helps when you understand what remains
              after costs. We show the expected output alongside the
              network-cost estimate and the TON needed upfront. An upfront gas
              budget can include value that returns; it is not automatically the
              amount consumed as fees.
            </p>
            <p>
              The current cost policy screens out an item when the comparable
              network cost exceeds 10% of its output value, when the estimated
              net value is non-positive, or when the next operation would leave
              less than the configured TON reserve. The initial reserve is 0.05
              TON, in addition to the upfront requirement. These are prototype
              policy choices, not universal thresholds for every wallet.
            </p>
            <aside className="docs-callout">
              <strong>A sample worth skipping</strong>
              <p>
                In the offline demo, REDO has an illustrative output value of
                0.02 USDT and a network-cost estimate of 0.08 USDT equivalent.
                Converting it would lose value before other considerations, so
                the demo skips it. These are fixed fixtures, not market prices.
              </p>
            </aside>
          </>
        ),
      },
      {
        id: 'controlled-steps',
        title: 'Review one item at a time',
        body: (
          <>
            <p>
              Each item can have a different price, token identity and outcome.
              Separate reviews make those differences visible and give the user
              a chance to stop. The demo permits up to five selected tokens,
              with a separate simulated approval for each supported item.
            </p>
            <p>
              The trade-off is more interaction than a one-click flow. A
              selection is a plan, not an atomic batch or a promise that one
              wallet signature covers all items. Live execution still needs to
              be built and verified.
            </p>
          </>
        ),
      },
      {
        id: 'evidence',
        title: 'Treat uncertainty as a real state',
        body: (
          <>
            <p>
              The lifecycle distinguishes a wallet response, a located
              transaction and a matching result. An unknown or partial outcome
              pauses the simulated queue. That makes uncertainty visible rather
              than presenting an unverified success or inviting another send.
            </p>
            <p>
              The safety lab exercises saving an intent before a simulated
              wallet response and preserving an unresolved state after refresh.
              It protects a synthetic sample within the same browser and site.
              It does not yet reconcile real transactions or protect activity on
              another device.
            </p>
          </>
        ),
      },
      {
        id: 'shared-core',
        title: 'Use established providers and share the rules',
        body: (
          <>
            <p>
              TonAPI supplies balance reads and Omniston supplies quote
              previews. SweepDock adds application-level review, cost assessment
              and diagnostic explanations around those interfaces. It does not
              create a new liquidity protocol.
            </p>
            <p>
              The app and toolkit share a TypeScript core. Integer base units
              avoid floating-point rounding in amount decisions; contract
              identity checks avoid trusting a token symbol alone. Developers
              can inspect and test the same rules the interface uses.
            </p>
          </>
        ),
      },
      {
        id: 'validation',
        title: 'What would establish that this works',
        body: (
          <>
            <p>
              The design is a reasoned approach, not proof of product-market
              fit. We need to measure whether intended users understand skipped
              balances and uncertain outcomes, whether a useful range of
              balances remains after fees, and whether developers find the
              shared tools useful.
            </p>
            <p>
              The original validation target is five wallet-user interviews and
              three developer interviews; those are research targets, not
              existing adoption. The next engineering evidence must cover
              supported execution environments, actual receipt verification,
              recovery and real-device wallet return.{' '}
              <Link to="/docs/status">
                See the current evidence and limitations.
              </Link>
            </p>
          </>
        ),
      },
    ],
  },
  {
    slug: 'wallet-users',
    label: 'Wallet user guide',
    title: 'Try the workflow without spending.',
    audience: 'For wallet owners',
    summary:
      'Learn the offline demo first, then explore real balances and quotes in read-only mode.',
    sections: [
      {
        id: 'demo',
        title: '1. Practise with sample balances',
        body: (
          <>
            <ol>
              <li>
                Open <Link to="/demo">Wallet Cleanup</Link>. Check that the
                screen says <strong>Simulation — no real funds</strong>. You do
                not need a wallet connection.
              </li>
              <li>
                STON is selected to start. Select other available tokens if you
                want to compare them. The demo limits a selection to five;
                unavailable tokens stay disabled.
              </li>
              <li>
                Choose <strong>Review selection</strong>. Read the output
                estimate, cost and reason for any skipped item.
              </li>
              <li>
                Choose <strong>Approve simulation</strong> for the next reviewed
                item. This changes sample state only. Review and approve
                subsequent items separately.
              </li>
              <li>
                Use <strong>Start new simulation</strong> when you want to
                practise again. Refreshing this demo also clears its in-memory
                progress.
              </li>
            </ol>
            <p>
              Try REDO to see an uneconomical balance get skipped. Demo values
              are illustrative, and the demo uses USDT as its output token.
            </p>
          </>
        ),
      },
      {
        id: 'doctor',
        title: '2. Understand an uncertain result',
        body: (
          <>
            <ol>
              <li>
                Before reviewing, set <strong>Demo outcome</strong> to{' '}
                <strong>Unconfirmed transaction</strong>,{' '}
                <strong>Partial result</strong> or{' '}
                <strong>Wallet rejection</strong>.
              </li>
              <li>
                Review your selection and approve the simulation. Read the pause
                message; the remaining queue will not continue automatically.
              </li>
              <li>
                Open <Link to="/doctor">Swap Doctor</Link> from the navigation.
                Inspect the event timeline and its explanations.
              </li>
              <li>
                Expand <strong>Preview report contents</strong>, then use{' '}
                <strong>Download report</strong> if you want a local JSON copy.
                No report is uploaded automatically.
              </li>
            </ol>
            <p>
              Doctor only shows events from the current simulation. It cannot
              look up an arbitrary transaction hash or diagnose another app. A
              scenario reset is a practice control, not a way to resolve or
              retry a real pending transaction.
            </p>
          </>
        ),
      },
      {
        id: 'quotes',
        title: '3. Read a live quote',
        body: (
          <>
            <ol>
              <li>
                Open <Link to="/app">Read live data</Link>. This screen is
                labelled <strong>Mainnet · read only</strong>.
              </li>
              <li>
                In <strong>Check a live quote</strong>, choose{' '}
                <strong>From</strong>, <strong>To</strong> and an{' '}
                <strong>Amount to preview</strong>. The supported inputs are
                STON, NOT and USDT; outputs are TON or USDT, with different
                input and output assets.
              </li>
              <li>
                Select <strong>Get live quote</strong>. You can do this without
                providing a wallet address.
              </li>
              <li>
                Read the output, minimum output, upfront TON requirement,
                estimated gas consumption and the cost assessment. Protocol fees
                may already be included in the receive amount; do not subtract
                them again.
              </li>
              <li>
                Refresh a stale quote. The app applies a local freshness limit
                of at most 30 seconds; this does not reserve a price or
                guarantee the provider will honour it.
              </li>
            </ol>
            <p>
              A quote is a preview, not an executable offer. A favourable cost
              check does not enable signing. If the USDT gas reference or other
              required data is missing, the app cannot clear the cost check.
            </p>
          </>
        ),
      },
      {
        id: 'balances',
        title: '4. Optionally read a wallet',
        body: (
          <>
            <p>
              Enter a public TON address and choose{' '}
              <strong>Read wallet balances</strong>, or use{' '}
              <strong>Connect wallet</strong> through the official TON Connect
              picker when a public HTTPS manifest is configured. Connecting
              selects a public account; use the balance-read button to send the
              address to the read-only API and TonAPI.
            </p>
            <p>
              Keep a complete, fresh balance snapshot if you want an
              affordability check. Without one, the app cannot establish whether
              the wallet has enough tokens and TON. Unreviewed assets can appear
              in the balance list but cannot be selected for quotes.
            </p>
            <p>
              Use <strong>Disconnect wallet</strong> to end the wallet session.
              The app clears old reads when the connected account changes or
              disconnects. Local previews without a manifest leave connection
              disabled; address lookup and quote previews can still work.
            </p>
            <Link to="/docs/safety">Read the safety and privacy guide</Link>
          </>
        ),
      },
      {
        id: 'cleanup-plan',
        title: '5. Build a cleanup plan from your wallet',
        body: (
          <>
            <p>
              After reading a wallet, use <strong>Plan your cleanup</strong>{' '}
              below the balance and quote panels. Select reviewed STON, NOT or
              USDT balances and choose TON or USDT as the output. The output
              token stays untouched.
            </p>
            <p>
              <strong>Review cleanup plan</strong> rereads your public address
              through TonAPI, then requests each selected token’s quote. It uses
              the newly read amounts. Compare per-token skip reasons, minimum
              output, estimated gas and the total upfront TON requirement,
              including a 0.05 TON reserve.
            </p>
            <p>
              Only tokens within their individual cost limits contribute to
              totals. A group can still require more TON than the wallet holds.
              Expected proceeds and gas refunds are not counted as available
              funds. Change the selection or output to discard the review; use{' '}
              <strong>Refresh balances &amp; quotes</strong> when it expires.
              This is a read-only plan and cannot execute swaps.
            </p>
          </>
        ),
      },
      {
        id: 'saved-cleanup',
        title: '6. Practise a saved cleanup and recovery',
        body: (
          <>
            <p>
              Open the <Link to="/safety/cleanup">saved cleanup lab</Link> and
              create a sample three-token session. Approve STON, simulate its
              wallet response, then simulate a matching success before approving
              NOT. Each remaining item needs its own approval.
            </p>
            <p>
              Refresh after approval to test recovery. The original attempt
              becomes uncertain and cannot be sent again or cleared. Simulate a
              late response if needed, then a matching receipt to resolve it.
              Rejection, partial output and a full refund pause the remaining
              queue. You may explicitly clear a resolved sample; this never
              authorizes retrying a real transaction.
            </p>
            <p>
              Use the session’s Swap Doctor link to inspect its persisted events
              or download an anonymous simulation report. The lab saves only
              synthetic data in this browser. Clearing site data removes it. No
              real wallet, transaction or chain receipt is involved.
            </p>
          </>
        ),
      },
    ],
  },
  {
    slug: 'developers',
    label: 'Developer guide',
    title: 'Inspect the rules behind the interface.',
    audience: 'For TON developers',
    summary:
      'Run the repository, explore the shared core, and reproduce failures before considering a live integration.',
    sections: [
      {
        id: 'run',
        title: 'Run the app locally',
        body: (
          <>
            <p>
              Use Node 24.19.0 and pnpm 11.24.0, as pinned in the repository.
              The default demo needs no API key, wallet, account or environment
              file.
            </p>
            <pre>
              <code>{`git clone https://github.com/GautamBytes/sweepdock.git
cd sweepdock
pnpm install --frozen-lockfile
pnpm dev`}</code>
            </pre>
            <p>
              Open the URL printed by Vite. The default is{' '}
              <code>http://127.0.0.1:5173</code>; add <code>/demo</code> for the
              offline flow, <code>/app</code> for requested mainnet reads, or{' '}
              <code>/safety</code> for recovery scenarios. Keep the development
              server local.
            </p>
            <p>
              <code>VITE_APP_MODE</code> may be unset or <code>mock</code>.
              Other values block the app; changing the value does not enable
              signing. TON Connect needs the app’s hosted manifest. Follow the{' '}
              <a
                href="https://github.com/GautamBytes/sweepdock/blob/main/docs/operations/vercel.md"
                target="_blank"
                rel="noreferrer"
              >
                deployment notes
              </a>{' '}
              for a hosted build.
            </p>
          </>
        ),
      },
      {
        id: 'packages',
        title: 'Understand the boundaries',
        body: (
          <>
            <ul>
              <li>
                <code>packages/core</code>: amount parsing/formatting, cost
                policy, lifecycle transitions and allowlisted report generation.
                The main entry point performs no network operations.
              </li>
              <li>
                <code>packages/omniston-adapter</code>: bounded quote
                subscriptions and quote validation. No build/sign/track wrapper
                is implemented.
              </li>
              <li>
                <code>apps/api</code>: read-only balance and quote endpoints.
                This is where optional provider credentials belong.
              </li>
              <li>
                <code>apps/web</code>: the React interface, explicit offline
                fixtures and the separate browser safety journal.
              </li>
            </ul>
            <p>
              Balance and quote providers implement shared interfaces. The
              cleanup planner receives an explicit provider and route policy; it
              does not import a swap SDK. TonAPI and Omniston remain the only
              configured live integrations. Replacing either still requires a
              reviewed adapter and its own tests.
            </p>
            <p>
              Configure provider IDs, reviewed routes and labels in{' '}
              <code>apps/shared/read-policy.ts</code>, and wire implementations
              and credentials in <code>apps/api/src/composition.ts</code>.
              Synthetic replacement-provider tests verify the boundary; they do
              not represent another live service. Signing stays disabled.
            </p>
            <p>
              The <code>@sweepdock/*</code> names are workspace packages. No npm
              package or stable external integration API has been published.
              Start by inspecting the repository’s own consumer rather than
              installing an assumed public package.
            </p>
          </>
        ),
      },
      {
        id: 'amounts',
        title: 'Use exact base units',
        body: (
          <>
            <p>
              This example uses the existing workspace entry point. Supply the
              reviewed asset’s decimals; do not infer them from its symbol.
            </p>
            <pre>
              <code>{`import { parseUnits, formatUnits } from '@sweepdock/core';

const units = parseUnits('1.25', 6); // 1250000n
const display = formatUnits(units, 6); // '1.25'`}</code>
            </pre>
            <p>
              Keep monetary decisions in integer base units. For{' '}
              <code>assessCost</code>, output and consumed-cost amounts must use
              comparable units, while balance, upfront budget and reserve use
              native TON units. An <code>executable: true</code> cost result
              only means that policy check passed; it is not permission to sign
              and does not establish settlement.
            </p>
          </>
        ),
      },
      {
        id: 'recovery',
        title: 'Reproduce an unresolved attempt',
        body: (
          <>
            <ol>
              <li>
                Open <Link to="/safety">the offline safety lab</Link>. Leave{' '}
                <strong>Matching testnet wallet</strong> selected. This is a
                synthetic identity, not a connected testnet wallet.
              </li>
              <li>
                Select <strong>Start simulated attempt</strong>. Refresh before
                completing the sample.
              </li>
              <li>
                Confirm the saved attempt becomes uncertain and another attempt
                stays blocked.
              </li>
              <li>
                Choose <strong>Inspect in Swap Doctor</strong> to inspect the
                preserved event sequence.
              </li>
              <li>
                For this fixture only, use{' '}
                <strong>Simulate matching receipt</strong> to complete the
                scenario, then <strong>Clear finished sample</strong>. These
                controls do not query a blockchain.
              </li>
            </ol>
            <p>
              You can also exercise wrong network, wallet changed after review,
              expired quote, rejection and storage failures. The journal is
              limited to one synthetic attempt on the same browser and origin.
            </p>
          </>
        ),
      },
      {
        id: 'verify',
        title: 'Run the checks and assess integration scope',
        body: (
          <>
            <pre>
              <code>{`pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:wallet`}</code>
            </pre>
            <p>
              The browser tests cover sequential approvals, paused states,
              report download, quote freshness, accessibility and browser
              recovery. The separate wallet suite uses the real SDK with a
              synthetic no-funds protocol fixture, not a physical wallet.
            </p>
            <p>
              On a branch that supports it,{' '}
              <code>E2E_PORT=5185 pnpm test:e2e</code> runs a fresh test server
              on a dedicated port. This avoids accidentally checking an older
              server already using the default port.
            </p>
            <p>
              Before a live consumer integration, the project still needs
              verified transaction construction, message correlation, receipt
              validation, persistent execution sessions, device QA and
              independent security review.{' '}
              <Link to="/docs/status">Check the implementation status</Link>{' '}
              before making integration commitments.
            </p>
          </>
        ),
      },
    ],
  },
  {
    slug: 'safety',
    label: 'Safety & privacy',
    title: 'Know what each mode can do.',
    audience: 'For everyone',
    summary:
      'Where data goes, what persists, and how to interpret the prototype’s safety boundaries.',
    sections: [
      {
        id: 'modes',
        title: 'Three distinct data environments',
        body: (
          <>
            <div className="docs-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Mode</th>
                    <th scope="col">Data and requests</th>
                    <th scope="col">After refresh</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Cleanup demo</th>
                    <td>
                      Sample balances and simulated events. No blockchain or
                      quote-provider requests.
                    </td>
                    <td>In-memory progress clears.</td>
                  </tr>
                  <tr>
                    <th scope="row">Live previews</th>
                    <td>
                      Requested balance reads go through the app API to TonAPI.
                      Quote requests go through the API to Omniston.
                    </td>
                    <td>
                      Balance and quote view state clears; wallet-session
                      handling belongs to TON Connect.
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Safety and saved cleanup labs</th>
                    <td>
                      One synthetic attempt stored locally in IndexedDB. No
                      wallet or provider calls.
                    </td>
                    <td>
                      The sample persists. An unfinished attempt becomes
                      uncertain.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              The docs and demo use locally hosted fonts and assets. The app
              adds no analytics. Hosting, wallet and data providers can still
              process request metadata under their own policies.
            </p>
          </>
        ),
      },
      {
        id: 'data',
        title: 'A public address still deserves care',
        body: (
          <>
            <p>
              Reading balances shares the requested address with the app backend
              and TonAPI. You can preview a quote without providing an address.
              Connecting through TON Connect shares a public account with the
              app; it is not a request to spend.
            </p>
            <p>
              SweepDock does not ask for seed phrases or private keys. No
              signing method is exposed by the application’s wallet adapter. Do
              not enter recovery phrases into this website or a diagnostic
              report.
            </p>
          </>
        ),
      },
      {
        id: 'reports',
        title: 'Reports are local and limited',
        body: (
          <>
            <p>
              Swap Doctor’s current download includes event stages, relative
              timings and anonymous item labels. It leaves out wallet addresses
              and transaction payloads. You choose whether to download or share
              the file; the app does not upload it automatically.
            </p>
            <p>
              These reports describe local simulations. They are not a
              blockchain receipt, proof that funds arrived, or a scanner for
              another application.
            </p>
          </>
        ),
      },
      {
        id: 'unknown',
        title: 'Unconfirmed means unresolved',
        body: (
          <>
            <p>
              A missing result does not prove failure. The demo pauses after
              unknown and partial outcomes instead of continuing the queue. The
              safety lab tests preserving that uncertainty across a reload.
            </p>
            <p>
              <strong>Recheck saved status</strong> only reads the local
              journal. Clearing browser site data removes that journal, and a
              record on one device cannot prevent actions on another. Neither a
              cleared sample nor a refreshed page establishes the outcome of an
              actual transaction.
            </p>
          </>
        ),
      },
      {
        id: 'limits',
        title: 'Current limits',
        body: (
          <>
            <p>
              Live transaction construction and signing are disabled. Real
              settlement verification and production recovery remain future
              work. The app has not completed an independent security audit or a
              controlled real-money pilot.
            </p>
            <p>
              Read the{' '}
              <Link to="/docs/status">current implementation status</Link> and
              the repository’s{' '}
              <a
                href="https://github.com/GautamBytes/sweepdock/blob/main/SECURITY.md"
                target="_blank"
                rel="noreferrer"
              >
                security policy
              </a>{' '}
              for reporting a vulnerability.
            </p>
          </>
        ),
      },
    ],
  },
  {
    slug: 'status',
    label: 'What works today',
    title: 'A working prototype, with a defined next step.',
    audience: 'For evaluators & contributors',
    summary:
      'Separate the features you can try from the execution and validation work still ahead. Reviewed 5 September 2026.',
    sections: [
      {
        id: 'available',
        title: 'Available in the current implementation',
        body: (
          <>
            <ul>
              <li>
                Offline cleanup selection, cost checks and separate simulated
                approvals.
              </li>
              <li>
                Simulation timelines and local JSON report downloads in Swap
                Doctor.
              </li>
              <li>
                Requested mainnet balance reads and Omniston quote previews,
                including a multi-token cleanup planner, fresh balance rechecks,
                per-token skip reasons and combined upfront TON/reserve checks.
              </li>
              <li>
                Read-only TON Connect account connection when the public
                manifest is configured.
              </li>
              <li>
                A persistent single-attempt lab and a three-token cleanup lab
                with sequential approval, receipt correlation, reload recovery
                and atomic cross-tab claims.
              </li>
              <li>Shared TypeScript source and tests under the MIT License.</li>
            </ul>
            <p>
              The website documentation describes the current code. A hosted
              deployment may lag a local branch; use the repository’s release
              notes to identify what has been deployed.
            </p>
          </>
        ),
      },
      {
        id: 'planned',
        title: 'Still to be built or established',
        body: (
          <>
            <ul>
              <li>
                Validated live transaction construction and explicit wallet
                signing.
              </li>
              <li>
                A real provider adapter for message-to-transaction correlation
                and independently verified recipient, token and received
                amounts. The current matcher processes normalized observations
                and is exercised with fixtures; it is not chain authentication.
              </li>
              <li>
                Production multi-item execution recovery. The saved three-token
                journal currently contains simulations only.
              </li>
              <li>
                A published, stable SDK with an independently tested consumer
                example.
              </li>
              <li>
                Telegram Mini App integration and physical-phone wallet-return
                QA.
              </li>
              <li>
                A supported no-money execution environment, independent security
                review and a controlled pilot. On 5 September 2026, the
                documented router’s version getter returned exit code 9 through
                both Toncenter and TonAPI; live execution remains disabled.
              </li>
            </ul>
            <p>
              No mainnet or testnet swap has been sent by SweepDock as evidence
              for this prototype. An offline testnet-labelled fixture does not
              establish that a supported testnet router or funded pool is
              available.
            </p>
          </>
        ),
      },
      {
        id: 'evidence',
        title: 'What the existing evidence establishes',
        body: (
          <>
            <p>
              Tests exercise the implemented amount rules, lifecycle guards,
              quote handling, browser flows and recovery scenarios. Release
              notes record successful hosted read-only balance and quote checks.
              Those checks establish behaviour in the tested cases; they do not
              prove universal safety, user demand or successful live settlement.
            </p>
            <p>
              The project still needs the planned wallet-user and developer
              interviews. No adoption, audit, partnership or grant-selection
              claim follows from this prototype.
            </p>
          </>
        ),
      },
      {
        id: 'next',
        title: 'How to evaluate or contribute',
        body: (
          <>
            <p>
              If you own a TON wallet, start with the{' '}
              <Link to="/docs/wallet-users">wallet user guide</Link> and see
              whether the cost and outcome explanations answer your questions.
              If you build TON applications, follow the{' '}
              <Link to="/docs/developers">developer guide</Link> and compare the
              failure scenarios with your integration needs.
            </p>
            <p>
              Contributors can inspect the{' '}
              <a
                href="https://github.com/GautamBytes/sweepdock"
                target="_blank"
                rel="noreferrer"
              >
                public repository
              </a>
              ,{' '}
              <a
                href="https://github.com/GautamBytes/sweepdock/blob/main/docs/operations/release-readiness.md"
                target="_blank"
                rel="noreferrer"
              >
                release checklist
              </a>{' '}
              and{' '}
              <a
                href="https://github.com/GautamBytes/sweepdock/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noreferrer"
              >
                contribution guide
              </a>
              . Execution, device and validation evidence should determine the
              next release scope.
            </p>
          </>
        ),
      },
    ],
  },
];
