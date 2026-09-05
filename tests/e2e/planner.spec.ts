import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const owner = '0:' + 'a'.repeat(64);
const assets = [
  {
    id: 'STON',
    master:
      '0:3690254dc15b2297610cda60744a45f2b710aa4234b89adb630e99d79b01bd4f',
  },
  {
    id: 'NOT',
    master:
      '0:2f956143c461769579baef2e32cc2d7bc18283f40d20bb03e432cd603ac33ffc',
  },
];
const balance = () => ({
  network: 'ton-mainnet',
  readOnly: true,
  source: 'tonapi',
  address: owner,
  observedAtMs: Date.now(),
  nativeBalanceUnits: '600000000',
  complete: true,
  assets: assets.map((a) => ({
    master: a.master,
    symbol: a.id,
    name: a.id,
    decimals: 9,
    units: '1000000000',
    reviewedId: a.id,
    eligible: true,
    reason: null,
  })),
});
function quote(request: unknown, now = Date.now()) {
  return {
    network: 'ton-mainnet',
    readOnly: true,
    source: 'omniston',
    request,
    quoteId: 'fixture',
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
for (const width of [360, 1440])
  test(`multi-token plan has real-flow fixtures, aggregate budget and accessible ${width}px layout`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    let reads = 0;
    await page.route('**/api/balances', (route) => {
      reads++;
      return route.fulfill({ json: balance() });
    });
    await page.route('**/api/quote', (route) =>
      route.fulfill({ json: quote(route.request().postDataJSON()) }),
    );
    await page.goto('/app');
    await page.getByLabel('Public TON wallet address').fill(owner);
    await page.getByRole('button', { name: 'Read wallet balances' }).click();
    await page.getByLabel('Plan STON').check();
    await page.getByLabel('Plan NOT').check();
    await page.getByRole('button', { name: 'Review cleanup plan' }).click();
    await expect(page.getByText('0.57 TON', { exact: true })).toBeVisible();
    expect(reads).toBe(2);
    await expect(page.getByText('2 tokens fit your cost limits')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page
      .getByLabel('Public TON wallet address')
      .fill('0:' + 'b'.repeat(64));
    await expect(page.getByText('0.57 TON', { exact: true })).toHaveCount(0);
  });
test('expired quotes remove totals and a refresh rereads changed wallet amounts', async ({
  page,
}) => {
  let fixtureTime = Date.now();
  await page.clock.install({ time: fixtureTime });
  let count = 0;
  const requests: unknown[] = [];
  await page.route('**/api/balances', (route) => {
    count++;
    const b = { ...balance(), observedAtMs: fixtureTime };
    if (count > 2) b.assets[0]!.units = '2000000000';
    return route.fulfill({ json: b });
  });
  await page.route('**/api/quote', (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({
      json: quote(route.request().postDataJSON(), fixtureTime),
    });
  });
  await page.goto('/app');
  await page.getByLabel('Public TON wallet address').fill(owner);
  await page.getByRole('button', { name: 'Read wallet balances' }).click();
  await page.getByLabel('Plan STON').check();
  await page.getByRole('button', { name: 'Review cleanup plan' }).click();
  await expect(page.getByText('1 token fits your cost limits')).toBeVisible();
  await page.clock.fastForward(31000);
  fixtureTime += 31000;
  await expect(page.getByText('Your plan needs a refresh')).toBeVisible();
  await expect(page.getByText('0.31 TON', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Refresh balances & quotes' }).click();
  await expect(page.getByText('1 token fits your cost limits')).toBeVisible();
  expect(requests.at(-1)).toMatchObject({ inputUnits: '2000000000' });
});
test('changing output while quote is pending discards late data', async ({
  page,
}) => {
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/balances', (route) =>
    route.fulfill({ json: balance() }),
  );
  await page.route('**/api/quote', async (route) => {
    await held;
    await route
      .fulfill({ json: quote(route.request().postDataJSON()) })
      .catch(() => {});
  });
  await page.goto('/app');
  await page.getByLabel('Public TON wallet address').fill(owner);
  await page.getByRole('button', { name: 'Read wallet balances' }).click();
  await page.getByLabel('Plan STON').check();
  await page.getByRole('button', { name: 'Review cleanup plan' }).click();
  await expect(page.getByText('Checking STON → TON…')).toBeVisible();
  await page.getByLabel('Receive in').selectOption('USDT');
  release();
  await expect(
    page.getByRole('button', { name: 'Review cleanup plan' }),
  ).toBeEnabled();
  await expect(page.getByText('1 token fits your cost limits')).toHaveCount(0);
});
