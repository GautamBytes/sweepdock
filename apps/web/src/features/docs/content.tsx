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
    title: 'Decide what to do with leftover tokens.',
    audience: 'Start here',
    summary:
      'SweepDock helps you compare small token balances with the cost of swapping them on TON. Start with sample tokens or read live balances and quotes.',
    sections: [
      {
        id: 'intention',
        title: 'What we want to help you do',
        body: (
          <>
            <p>
              You may have tokens left over from a trade, a reward or an app you
              no longer use. We are building SweepDock to help you decide which
              supported balances are worth converting and which to keep. You
              should be able to see the costs before making that decision.
            </p>
            <p>
              Today, you can compare live quotes and plan a cleanup without
              spending. You can also practise swap outcomes with sample data.
              Sending real swaps and checking that the right tokens arrived are
              later stages of the project.
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
              A small balance is not always worth swapping. Network fees can
              take a large share of what you would receive. You also need TON
              available upfront, even if you want to receive a different token.
              Checking each balance, quote and fee takes time.
            </p>
            <p>
              An unclear swap result creates another problem. Your wallet may
              respond before you know whether the swap finished. Trying again
              could send a second transaction while the first is still pending.
              Our simulations show how to pause and check the original result.
            </p>
            <p>
              We still need user research to learn how often people face these
              problems and whether this workflow helps them. That research and
              the changes it leads to are planned work.
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
              Use SweepDock if you want to review leftover tokens before
              deciding what to do with them. TON is the blockchain network;
              tokens on it are also called jettons. This version supports live
              quotes for STON, NOT and USDT, with TON or USDT as the receive
              token.
            </p>
            <Link to="/docs/wallet-users">
              Start with the wallet user guide
            </Link>
            <h3>Developers building TON apps</h3>
            <p>
              Explore the shared TypeScript code for token amounts, cost checks
              and swap states. You can run a standalone consumer example and
              reproduce interrupted-swap scenarios. The code is available in the
              repository; a stable npm package is still planned.
            </p>
            <Link to="/docs/developers">Start with the developer guide</Link>
          </>
        ),
      },
      {
        id: 'scope',
        title: 'Choose where to start',
        body: (
          <>
            <ul>
              <li>
                <strong>Wallet Cleanup:</strong> select sample tokens and
                compare costs, or switch to live data to read a wallet and build
                a plan.
              </li>
              <li>
                <strong>Swap Doctor:</strong> see the steps from a simulation,
                understand a paused result and download its report.
              </li>
              <li>
                <strong>Developer Kit:</strong> explore the shared code and
                follow the setup guide.
              </li>
            </ul>
            <p>
              This website cannot build, sign or send a real transaction.{' '}
              <Link to="/docs/status">
                Read what works today and what is planned.
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
    title: 'Compare the cost before taking action.',
    audience: 'How we approach the problem',
    summary:
      'We bring balances, swap estimates and network costs into one review. The demo also shows why an unresolved result needs a pause.',
    sections: [
      {
        id: 'cost-first',
        title: 'Show what a swap would cost',
        body: (
          <>
            <p>
              A quote estimates how much of one token you could receive for
              another. SweepDock shows that amount after provider fees,
              alongside network fees. Network fees are also called gas, and you
              pay them in TON.
            </p>
            <p>
              The upfront network budget is the TON a swap would need at the
              start. Some of that budget may return to your wallet. The
              estimated network fee is the amount expected to be spent. We show
              both so you can distinguish the required balance from the likely
              cost.
            </p>
            <p>
              We skip a token if its estimated network cost is over 10% of the
              amount used for the cost check, or if nothing would remain after
              costs. Live checks use the minimum receive amount. We also require
              enough TON for the upfront budget plus a 0.05 TON reserve, which
              stays untouched. These are the prototype’s rules, not a guarantee
              that a swap is a good choice for you.
            </p>
            <aside className="docs-callout">
              <strong>An example worth skipping</strong>
              <p>
                In the demo, REDO would return 0.02 USDT while the estimated
                network fee is worth 0.08 USDT. The fee is larger than the
                return, so the demo skips it. These are made-up values, not
                current prices.
              </p>
            </aside>
          </>
        ),
      },
      {
        id: 'controlled-steps',
        title: 'Review each token on its own',
        body: (
          <>
            <p>
              Each token can have a different price, fee and result. The live
              planner checks each selected token, explains why it passes or gets
              skipped, and adds up the upfront TON needed for the included
              swaps. It does not count future swap returns or refunds as
              available TON.
            </p>
            <p>
              The demo asks for a separate approval for each sample swap. This
              takes more steps than one click, but lets you review each item and
              stop after an unexpected result. A cleanup plan does not mean all
              swaps happen together or share one wallet approval.
            </p>
          </>
        ),
      },
      {
        id: 'evidence',
        title: 'Pause when the result is unclear',
        body: (
          <>
            <p>
              A wallet response, a transaction found on the network and a
              confirmed receive amount are different steps. The demo pauses when
              the result is unknown or only partly matches what was expected.
              Swap Doctor explains which step needs attention.
            </p>
            <p>
              The saved labs let you refresh during an attempt and return to its
              unfinished state. They use sample data in this browser. They do
              not track real transactions or prevent actions on another device.
            </p>
          </>
        ),
      },
      {
        id: 'shared-core',
        title: 'Use existing swap services and reusable code',
        body: (
          <>
            <p>
              TonAPI supplies wallet balances. Omniston supplies quotes, which
              this version limits to STON.fi routes. SweepDock adds the cost
              comparison, cleanup plan and explanations around those services.
            </p>
            <p>
              The app and developer kit use the same TypeScript core. It uses
              integer amounts to avoid floating-point rounding and checks token
              contract addresses rather than trusting a name or symbol. Balance
              and quote providers have separate interfaces, so a new provider
              can be added with an adapter and tests.
            </p>
          </>
        ),
      },
      {
        id: 'validation',
        title: 'What we still need to learn',
        body: (
          <>
            <p>
              We need to see whether wallet owners understand the costs and skip
              reasons, whether enough leftover balances are worth converting,
              and whether developers can use the shared code in their apps. User
              research and usability improvements are planned; we are not
              presenting them as completed validation.
            </p>
            <p>
              The next execution work needs a working test environment, verified
              swap results and recovery after interruptions.{' '}
              <Link to="/docs/status">
                See the current evidence and limits.
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
    title: 'Try SweepDock without spending money.',
    audience: 'For wallet owners',
    summary:
      'Use sample tokens to learn the flow, or read live balances and quotes. You do not need to deposit money for either.',
    sections: [
      {
        id: 'demo',
        title: '1. Practise with sample balances',
        body: (
          <>
            <ol>
              <li>
                Open <Link to="/demo">Wallet Cleanup</Link>. The banner says{' '}
                <strong>Simulation · no real funds</strong>. No wallet is
                needed.
              </li>
              <li>
                Start with the selected STON token or select other available
                tokens. The selection limit is five. USDT stays as the receive
                token, and the unreviewed sample stays disabled.
              </li>
              <li>
                Choose <strong>Review selection</strong>. Check the sample
                receive amount, estimated cost and reason for any skipped token.
              </li>
              <li>
                Choose <strong>Approve simulation</strong> for the next item.
                This advances the demo; it does not open a wallet or send
                tokens.
              </li>
              <li>
                Choose <strong>Start new simulation</strong> to try again.
                Refreshing the demo also clears its progress.
              </li>
            </ol>
            <p>
              Try REDO to see a token skipped because its fee exceeds its value.
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
                Before reviewing, change <strong>Demo outcome</strong> to{' '}
                <strong>Unconfirmed transaction</strong>,{' '}
                <strong>Partial result</strong> or{' '}
                <strong>Wallet rejection</strong>.
              </li>
              <li>
                Review the selection and approve the simulation. Read the reason
                it pauses. The remaining swaps will not continue on their own.
              </li>
              <li>
                Open <Link to="/doctor">Swap Doctor</Link> and follow the
                timeline.
              </li>
              <li>
                Open <strong>Preview report contents</strong>, then choose{' '}
                <strong>Download report</strong> if you want to save the JSON
                file. SweepDock does not upload the report.
              </li>
            </ol>
            <p>
              Swap Doctor explains your simulation. It cannot look up real
              transactions from SweepDock or another app. Resetting a demo does
              not resolve a real pending transaction.
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
                Open <Link to="/app">Read live data</Link>. This page reads TON
                mainnet, the live network. It cannot send transactions.
              </li>
              <li>
                Find <strong>Check a live quote</strong>. Choose the token in{' '}
                <strong>From</strong>, the token in <strong>To</strong> and an{' '}
                <strong>Amount to preview</strong>. You can quote STON, NOT or
                USDT into TON or USDT. From and To must be different.
              </li>
              <li>
                Choose <strong>Get live quote</strong>. You do not need a wallet
                address or a balance in those tokens.
              </li>
              <li>
                Compare the estimated receive amount, minimum receive amount,
                upfront TON budget and estimated network fee. Provider fees are
                already included in the receive amounts; do not subtract them
                again.
              </li>
              <li>
                Request a new quote when the freshness countdown ends. Our limit
                is at most 30 seconds. Prices can change before then too.
              </li>
            </ol>
            <p>
              The minimum receive amount allows a 1% price change, called
              slippage. It is a quote assumption, not a promise of funds
              arriving. If a required fee estimate or its USDT value is missing,
              SweepDock leaves the cost check incomplete.
            </p>
          </>
        ),
      },
      {
        id: 'balances',
        title: '4. Read your wallet balances',
        body: (
          <>
            <p>
              Paste a public TON address into <strong>Read your wallet</strong>,
              then choose <strong>Read wallet balances</strong>. This sends the
              address through SweepDock to TonAPI. Never enter your recovery
              phrase or private key on the website.
            </p>
            <h3>Connect a wallet on your phone</h3>
            <ol>
              <li>
                Open the <Link to="/app">live data page</Link> in your browser.
                An empty mainnet wallet works. Do not fund it for this test.
              </li>
              <li>
                Tap <strong>Connect wallet</strong> and choose your wallet app.
                Check that its request identifies SweepDock and{' '}
                <code>sweepdock.vercel.app</code>. Approve connection only.
                Reject any transaction or payment request.
              </li>
              <li>
                Return to the browser. It should say{' '}
                <strong>Wallet connected · mainnet</strong>.
              </li>
              <li>
                Tap <strong>Read wallet balances</strong> if you want to share
                the address with TonAPI. An empty wallet should show 0 TON and
                no token balances.
              </li>
              <li>
                Tap <strong>Disconnect wallet</strong> to clear the connected
                address and old results. Refreshing also forgets the connection.
              </li>
            </ol>
            <p>
              A current, complete balance read lets SweepDock check whether you
              have enough tokens and TON. Tokens outside the supported list may
              appear, but you cannot select them for quotes. If wallet
              connection is unavailable in a local preview, you can still paste
              an address.
            </p>
            <Link to="/docs/safety">Read the safety and privacy guide</Link>
          </>
        ),
      },
      {
        id: 'cleanup-plan',
        title: '5. Build a cleanup plan',
        body: (
          <>
            <ol>
              <li>
                After reading balances, find <strong>Plan your cleanup</strong>.
                Select supported tokens and choose TON or USDT in{' '}
                <strong>Receive in</strong>. Existing balances of that receive
                token stay untouched.
              </li>
              <li>
                Choose <strong>Review cleanup plan</strong>. SweepDock rereads
                the wallet and gets a quote for each selected token using its
                current balance.
              </li>
              <li>
                Read each token’s result and compare the totals. The plan counts
                only tokens that pass their individual cost checks. It also
                checks the total upfront TON budget plus a 0.05 TON reserve.
              </li>
              <li>
                Use <strong>Refresh balances &amp; quotes</strong> when the plan
                needs fresh data. Changing the selection or receive token clears
                the previous review.
              </li>
            </ol>
            <p>
              Individual swaps can pass the cost check while the full plan needs
              more TON than the wallet holds. You can select fewer tokens and
              review again. This is a read-only plan; no deposit or swap is
              needed.
            </p>
          </>
        ),
      },
      {
        id: 'saved-cleanup',
        title: '6. Practise returning to a saved cleanup',
        body: (
          <>
            <p>
              Open the <Link to="/safety/cleanup">saved cleanup lab</Link> and
              choose <strong>Create sample cleanup</strong>. Approve the STON
              simulation, simulate a wallet response, then simulate a matching
              success. You can then approve NOT. Each token has its own steps.
            </p>
            <p>
              Refresh after a sample approval to test an interruption. The app
              keeps the original attempt and marks the result as unknown. Use
              the late-response and matching-result buttons to continue the
              scenario. A rejection, partial result or refund pauses the
              remaining swaps.
            </p>
            <p>
              The lab saves made-up data in this browser. Its Swap Doctor link
              shows the saved steps. Clearing site data removes the sample.
              These controls never connect to a real wallet or confirm a real
              swap.
            </p>
          </>
        ),
      },
    ],
  },
  {
    slug: 'developers',
    label: 'Developer guide',
    title: 'Run the code and test the rules.',
    audience: 'For TON developers',
    summary:
      'Start the app, try the core package outside the workspace and reproduce the tests. The current integrations read balances and quotes only.',
    sections: [
      {
        id: 'run',
        title: 'Run the app locally',
        body: (
          <>
            <p>
              Use the pinned Node 24.19.0 and pnpm 11.24.0 versions. The demo
              needs no API key, wallet or environment file.
            </p>
            <pre>
              <code>{`git clone https://github.com/GautamBytes/sweepdock.git
cd sweepdock
pnpm install --frozen-lockfile
pnpm dev`}</code>
            </pre>
            <p>
              Open the URL printed by Vite, usually{' '}
              <code>http://127.0.0.1:5173</code>. Use <code>/demo</code> for
              sample data, <code>/app</code> for live reads and{' '}
              <code>/safety</code> for saved recovery scenarios. Keep the
              development server local.
            </p>
            <p>
              Leave <code>VITE_APP_MODE</code> unset or set to <code>mock</code>
              . Other values block the app; they do not enable signing. Wallet
              connection needs a hosted TON Connect manifest, the file wallets
              use to identify the app. See the{' '}
              <a
                href="https://github.com/GautamBytes/sweepdock/blob/main/docs/operations/vercel.md"
                target="_blank"
                rel="noreferrer"
              >
                deployment guide
              </a>
              .
            </p>
          </>
        ),
      },
      {
        id: 'packages',
        title: 'Find the code you need',
        body: (
          <>
            <ul>
              <li>
                <code>packages/core</code>: integer token amounts, cost rules,
                swap-state transitions and reports containing selected event
                fields. The main entry point makes no network calls.
              </li>
              <li>
                <code>packages/omniston-adapter</code>: quote subscriptions with
                time and resource limits, plus quote validation. It does not
                build, sign or track transactions.
              </li>
              <li>
                <code>apps/api</code>: read-only balance and quote endpoints.
                Keep optional provider credentials here, on the server.
              </li>
              <li>
                <code>apps/web</code>: the React interface, sample scenarios and
                browser storage for the saved labs.
              </li>
            </ul>
            <p>
              The planner accepts balance and quote providers through shared
              interfaces. Configure provider IDs and allowed routes in{' '}
              <code>apps/shared/read-policy.ts</code>, then connect the
              implementations in <code>apps/api/src/composition.ts</code>.
              TonAPI and Omniston are the current live integrations. A
              replacement provider needs a reviewed adapter and its own tests.
            </p>
            <h3>Try the core outside the workspace</h3>
            <pre>
              <code>pnpm example:core</code>
            </pre>
            <p>
              This builds a local package, installs it in a temporary project,
              checks strict NodeNext types and runs a plain Node consumer. Read{' '}
              <code>examples/core-consumer/README.md</code> to adapt the
              example. The <code>@sweepdock/*</code> names are workspace
              packages; no stable npm package has been published.
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
              Store amounts as integers in the token’s smallest unit. Use the
              reviewed contract’s decimal count, not a guess based on its
              symbol. For a token with six decimals, 1.25 tokens is 1,250,000
              base units.
            </p>
            <pre>
              <code>{`import { parseUnits, formatUnits } from '@sweepdock/core';

const units = parseUnits('1.25', 6); // 1250000n
const display = formatUnits(units, 6); // '1.25'`}</code>
            </pre>
            <p>
              For <code>assessCost</code>, convert the receive amount and
              consumed network cost to comparable units. Keep the native
              balance, upfront budget and reserve in TON base units. An{' '}
              <code>executable: true</code> result means the cost policy passed.
              It does not authorize a signature or prove that a swap completed.
            </p>
          </>
        ),
      },
      {
        id: 'recovery',
        title: 'Reproduce an interrupted attempt',
        body: (
          <>
            <ol>
              <li>
                Open the <Link to="/safety">offline safety lab</Link> and leave{' '}
                <strong>Matching testnet wallet</strong> selected. This
                represents a made-up account; it does not connect a testnet
                wallet.
              </li>
              <li>
                Choose <strong>Start simulated attempt</strong>, then refresh
                before completing it.
              </li>
              <li>
                Check that the saved result becomes unknown and a second attempt
                stays blocked.
              </li>
              <li>
                Choose <strong>Inspect in Swap Doctor</strong> to read the saved
                steps.
              </li>
              <li>
                Use <strong>Simulate matching receipt</strong> to provide a
                sample result, then <strong>Clear finished sample</strong>.
                Neither button queries a blockchain.
              </li>
            </ol>
            <p>
              You can also test a wrong network, an account change, an old
              quote, rejection and unavailable storage. The lab saves one sample
              attempt per browser and site. The{' '}
              <Link to="/safety/cleanup">cleanup lab</Link> extends this to
              three sample tokens with separate approvals.
            </p>
          </>
        ),
      },
      {
        id: 'verify',
        title: 'Run the verification checks',
        body: (
          <>
            <pre>
              <code>{`pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:wallet
pnpm example:core
pnpm verify:contracts`}</code>
            </pre>
            <p>
              The browser tests cover approvals, paused results, report
              downloads, quote freshness, accessibility and saved recovery. The
              wallet suite uses the real TON Connect SDK with a simulated
              protocol peer. It does not replace a physical-phone test.
            </p>
            <p>
              <code>pnpm verify:contracts</code> downloads public contract
              state, checks it against pinned code and library hashes, then runs
              local TON virtual machine tests. Those tests make no public-chain
              transactions. Data changes between captures; a pinned code hash
              alone does not authenticate historical chain state.
            </p>
            <p>
              Use <code>E2E_PORT=5185 pnpm test:e2e</code> if you need a
              separate test-server port. Before building a live swap
              integration, read the{' '}
              <Link to="/docs/status">current implementation limits</Link>.
              Transaction construction, authenticated results and live recovery
              still need work.
            </p>
          </>
        ),
      },
    ],
  },
  {
    slug: 'safety',
    label: 'Safety and privacy',
    title: 'Know what each mode can do.',
    audience: 'For everyone',
    summary:
      'The demo uses sample data. Live reads use real public data. Neither mode can spend funds. The saved labs keep practice data in this browser.',
    sections: [
      {
        id: 'modes',
        title: 'Data and storage in each mode',
        body: (
          <>
            <div className="docs-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Mode</th>
                    <th scope="col">Data used</th>
                    <th scope="col">After refresh</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Cleanup demo</th>
                    <td>
                      Sample balances and events. No blockchain or
                      quote-provider requests.
                    </td>
                    <td>Progress clears.</td>
                  </tr>
                  <tr>
                    <th scope="row">Live data</th>
                    <td>
                      Balance requests go through our API to TonAPI. Quote
                      requests go through our API to Omniston. Wallet connection
                      uses TON Connect.
                    </td>
                    <td>
                      The app forgets the connection and clears balances, quotes
                      and the plan.
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Saved labs</th>
                    <td>
                      Made-up attempts stored in this browser using IndexedDB.
                      No wallet or provider calls.
                    </td>
                    <td>
                      The sample stays saved. An unfinished attempt becomes
                      unconfirmed.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              SweepDock adds no analytics. We host the site’s fonts and artwork
              with the app. Hosting, wallet and data providers may still process
              request metadata under their own policies.
            </p>
          </>
        ),
      },
      {
        id: 'data',
        title: 'What you share when you connect or read',
        body: (
          <>
            <p>
              Connecting a wallet shares its public account with SweepDock.
              Choosing Read wallet balances then sends the address through the
              app backend to TonAPI. You can request a quote without sharing a
              wallet address. You can also test connection with an empty wallet.
            </p>
            <p>
              SweepDock does not request recovery phrases or private keys. Its
              wallet adapter exposes no transaction or data-signing method.
              Approve connection only. If a wallet prompt asks you to send
              funds, pay a fee or sign a transaction, cancel it.
            </p>
          </>
        ),
      },
      {
        id: 'reports',
        title: 'Choose whether to share a report',
        body: (
          <>
            <p>
              Swap Doctor reports contain event steps, time between events and
              anonymous item labels. They exclude wallet addresses and
              transaction payloads. The app does not upload them. You choose
              whether to download a file or share it with someone.
            </p>
            <p>
              These files describe practice scenarios. They do not prove that
              funds arrived or diagnose transactions from another application.
            </p>
          </>
        ),
      },
      {
        id: 'unknown',
        title: 'An unknown result needs a pause',
        body: (
          <>
            <p>
              A missing result can mean a swap is still pending. The demo pauses
              after an unknown or partial result. The saved labs show how to
              preserve that uncertainty after refresh instead of starting
              another attempt.
            </p>
            <p>
              <strong>Recheck saved status</strong> reads the local sample only.
              Clearing browser data removes the saved record, and the record
              cannot block activity on another device. Clearing or restarting a
              sample tells you nothing about a real transaction’s outcome.
            </p>
          </>
        ),
      },
      {
        id: 'limits',
        title: 'Current safety limits',
        body: (
          <>
            <p>
              Live transaction building and signing are disabled. Checking real
              received funds and recovering live swaps remain future work. We
              have not completed an independent security audit or a real-money
              pilot.
            </p>
            <p>
              See <Link to="/docs/status">what works today</Link> and the{' '}
              <a
                href="https://github.com/GautamBytes/sweepdock/blob/main/SECURITY.md"
                target="_blank"
                rel="noreferrer"
              >
                security policy
              </a>{' '}
              for how to report a vulnerability.
            </p>
          </>
        ),
      },
    ],
  },
  {
    slug: 'status',
    label: 'What works today',
    title: 'What you can use, and what comes next.',
    audience: 'For reviewers and contributors',
    summary:
      'The prototype supports live reads, cleanup planning and practice scenarios. This page separates those features from future execution work. Updated 5 September 2026.',
    sections: [
      {
        id: 'available',
        title: 'Available now',
        body: (
          <>
            <ul>
              <li>
                A cleanup demo with sample balances, cost checks and separate
                approvals.
              </li>
              <li>
                Live TON wallet balances, Omniston quotes limited to STON.fi
                routes, and a multi-token cleanup planner.
              </li>
              <li>
                Per-token skip reasons, fresh balance checks and a combined
                upfront TON budget with a reserve.
              </li>
              <li>Read-only wallet connection through TON Connect.</li>
              <li>
                Saved practice attempts, refresh recovery and checks that stop
                two tabs from starting the same sample at once.
              </li>
              <li>
                Swap Doctor timelines and downloadable simulation reports.
              </li>
              <li>
                Shared TypeScript code under the MIT License and a standalone
                core consumer example.
              </li>
            </ul>
            <p>
              The{' '}
              <a
                href="https://github.com/GautamBytes/sweepdock/releases"
                target="_blank"
                rel="noreferrer"
              >
                release notes
              </a>{' '}
              identify the source revision and deployment used for each set of
              checks.
            </p>
          </>
        ),
      },
      {
        id: 'planned',
        title: 'Still to build and test',
        body: (
          <>
            <ul>
              <li>
                Build real swap transactions and request a separate wallet
                approval for each.
              </li>
              <li>
                Link wallet responses to chain transactions and verify the
                recipient, token and amount received. Current result-matching
                tests use supplied sample observations.
              </li>
              <li>
                Save and recover real multi-token execution across
                interruptions. Today’s saved sessions contain simulations only.
              </li>
              <li>
                Provide a supported public testnet execution path, complete an
                independent security review and run a controlled pilot.
              </li>
              <li>
                Publish a stable SDK and explore a Telegram Mini App
                integration.
              </li>
              <li>
                Test more phones and wallets, conduct user research and improve
                the flow based on observed problems.
              </li>
            </ul>
            <p>
              On 5 September 2026, the documented testnet router failed checks
              through both Toncenter and TonAPI with exit code 9. Local virtual
              machine tests use reviewed libraries loaded into the local test
              environment. They do not show a successful public-testnet swap.
              SweepDock has not sent a mainnet or testnet swap as evidence for
              this prototype.
            </p>
          </>
        ),
      },
      {
        id: 'evidence',
        title: 'What we have checked',
        body: (
          <>
            <p>
              Automated checks cover token amounts, cost rules, quote
              validation, browser flows, simulated wallet messages and saved
              recovery. A separate workflow captures public contract state,
              checks pinned code hashes and runs local virtual machine tests.
              Release evidence also records hosted balance and quote reads.
            </p>
            <p>
              On 5 September 2026, the owner reported passing read-only
              connection, return to the browser, empty-wallet balance reading,
              disconnect, reconnect, refresh reset and wallet-picker reopening
              with Tonkeeper in Android Chrome. Account switching, extended
              background behavior and other device combinations remain untested.
              No funds were needed.
            </p>
            <p>
              These checks cover the tested cases. They do not establish an
              independent audit, user demand or successful live swaps. User
              research is planned for a later phase.
            </p>
          </>
        ),
      },
      {
        id: 'next',
        title: 'Evaluate the prototype or contribute',
        body: (
          <>
            <p>
              Wallet owners can follow the{' '}
              <Link to="/docs/wallet-users">wallet user guide</Link> to compare
              costs without spending. Developers can follow the{' '}
              <Link to="/docs/developers">developer guide</Link> to run the code
              and check whether the shared tools fit their needs.
            </p>
            <p>
              Review the{' '}
              <a
                href="https://github.com/GautamBytes/sweepdock"
                target="_blank"
                rel="noreferrer"
              >
                source code
              </a>
              ,{' '}
              <a
                href="https://github.com/GautamBytes/sweepdock/blob/main/docs/operations/current-release.md"
                target="_blank"
                rel="noreferrer"
              >
                current release record
              </a>{' '}
              and{' '}
              <a
                href="https://github.com/GautamBytes/sweepdock/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noreferrer"
              >
                contribution guide
              </a>{' '}
              for setup and project status. Use these notes to reproduce a test
              or find an area where you can contribute.
            </p>
          </>
        ),
      },
    ],
  },
];
