import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const owner = '0:' + 'a'.repeat(64);
const master =
  '0:3690254dc15b2297610cda60744a45f2b710aa4234b89adb630e99d79b01bd4f';
function balances(complete = true) {
  return {
    network: 'ton-mainnet',
    source: 'tonapi',
    readOnly: true,
    address: owner,
    observedAtMs: Date.now(),
    nativeBalanceUnits: '1000000000',
    complete,
    assets: [
      {
        master,
        symbol: 'STON',
        name: 'STON',
        decimals: 9,
        units: '1000000000',
        reviewedId: 'STON',
        eligible: true,
        reason: null,
      },
      {
        master: '0:' + 'b'.repeat(64),
        symbol: 'STON',
        name: 'Impersonator token',
        decimals: 9,
        units: '100',
        reviewedId: null,
        eligible: false,
        reason: 'UNREVIEWED',
      },
    ],
  };
}
function quote() {
  const now = Date.now();
  return {
    network: 'ton-mainnet',
    source: 'omniston',
    readOnly: true,
    request: { input: 'STON', output: 'TON', inputUnits: '1000000000' },
    quoteId: 'fixture-quote',
    expectedOutputUnits: '1000000000',
    minimumOutputUnits: '990000000',
    protocolFeeUnits: '0',
    gasBudgetUnits: '260000000',
    gasConsumedUnits: '37500000',
    quotedAtMs: now,
    observedAtMs: now,
    previewStaleAtMs: now + 30000,
    providerExpiry: null,
    routes: ['StonFiV2'],
  };
}

test('real-mode UI loads validated balances and previews without signing', async ({
  page,
}) => {
  await page.route('**/api/balances', (route) =>
    route.fulfill({ json: balances() }),
  );
  await page.route('**/api/quote', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      input: 'STON',
      output: 'TON',
      inputUnits: '1000000000',
    });
    await route.fulfill({ json: quote() });
  });
  await page.goto('/app');
  await page.getByLabel('Public TON wallet address').fill(owner);
  await page.getByRole('button', { name: 'Read wallet balances' }).click();
  await expect(page.getByText('Impersonator token')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Use balance' }).nth(1),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Use balance' }).first().click();
  await page.getByRole('button', { name: 'Get live quote' }).click();
  await expect(
    page.getByText(
      'Within the estimated cost limit for this wallet. Signing is still disabled.',
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /approve|connect wallet|swap now/i }),
  ).toHaveCount(0);
  await page.getByLabel('Amount to preview').fill('2');
  await expect(
    page.getByRole('region', { name: 'Live quote result' }),
  ).toHaveCount(0);
});

test('incomplete reads disable balance selection and errors do not become demo data', async ({
  page,
}) => {
  await page.route('**/api/balances', (route) =>
    route.fulfill({ json: balances(false) }),
  );
  await page.goto('/app');
  await page.getByLabel('Public TON wallet address').fill(owner);
  await page.getByRole('button', { name: 'Read wallet balances' }).click();
  await expect(
    page.getByRole('button', { name: 'Use balance' }).first(),
  ).toBeDisabled();
  await page.route('**/api/quote', (route) =>
    route.fulfill({ status: 422, json: { error: 'NO_QUOTE' } }),
  );
  await page.getByRole('button', { name: 'Get live quote' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'No quote is available for this pair and amount right now.',
  );
  await expect(page.getByText('Sample wallet', { exact: true })).toHaveCount(0);
});

test('stale quote countdown requires refresh and switching to demo isolates data', async ({
  page,
}) => {
  await page.clock.install();
  await page.route('**/api/quote', (route) =>
    route.fulfill({
      json: { ...quote(), previewStaleAtMs: Date.now() + 1000 },
    }),
  );
  await page.goto('/app');
  await page.getByRole('button', { name: 'Get live quote' }).click();
  await expect(
    page.getByRole('region', { name: 'Live quote result' }),
  ).toBeVisible();
  await page.clock.fastForward(2000);
  await expect(
    page.getByText('Preview is stale. Request a fresh quote.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Practice with sample data' }).click();
  await expect(page.getByText('Simulation — no real funds')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Live quote result' }),
  ).toHaveCount(0);
});

for (const width of [360, 768, 1440]) {
  test(`live form and quote result fit ${width}px and pass automated accessibility`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/api/quote', (route) =>
      route.fulfill({ json: quote() }),
    );
    await page.goto('/app');
    await page.getByRole('button', { name: 'Get live quote' }).click();
    await expect(
      page.getByRole('region', { name: 'Live quote result' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
