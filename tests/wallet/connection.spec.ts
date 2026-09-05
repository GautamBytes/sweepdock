import { test, expect } from '@playwright/test';

// This is an injected protocol fixture, not a real wallet or on-chain test.
test('official TON Connect picker connects a no-funds fixture, reads balances and disconnects without signing', async ({
  page,
}) => {
  const external: string[] = [];
  await page.route(/^https:\/\//, (route) => {
    const url = new URL(route.request().url());
    if (
      url.hostname === 'config.ton.org' &&
      url.pathname === '/wallets-v2.json'
    )
      return route.fulfill({
        json: [
          {
            name: 'Fixture wallet · no funds',
            app_name: 'sweepdock-fixture',
            about_url: 'https://sweepdock.test',
            image: 'https://sweepdock.test/icon.png',
            platforms: ['chrome'],
            bridge: [{ type: 'js', key: 'sweepdockFixture' }],
            features: [{ name: 'SendTransaction', maxMessages: 4 }],
          },
        ],
      });
    if (route.request().resourceType() === 'image')
      return route.fulfill({
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=',
          'base64',
        ),
      });
    external.push(url.href);
    return route.abort();
  });
  await page.addInitScript(() => {
    const calls: string[] = [];
    const device = {
      platform: 'browser',
      appName: 'sweepdock-fixture',
      appVersion: '1.0.0',
      maxProtocolVersion: 2,
      features: [{ name: 'SendTransaction', maxMessages: 4 }],
    };
    const fixture = {
      isWalletBrowser: false,
      deviceInfo: device,
      walletInfo: {
        name: 'Fixture wallet · no funds',
        app_name: 'sweepdock-fixture',
        about_url: 'https://sweepdock.test',
        image:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=',
        platforms: ['chrome'],
        features: device.features,
      },
      connect: async (
        _version: number,
        request: { items: { name: string }[] },
      ) => {
        calls.push('connect');
        if (request.items.some((item) => item.name !== 'ton_addr'))
          throw new Error('Unexpected signature request');
        return {
          event: 'connect',
          id: 1,
          payload: {
            device,
            items: [
              {
                name: 'ton_addr',
                address: '0:' + 'a'.repeat(64),
                network: '-239',
                walletStateInit: '',
              },
            ],
          },
        };
      },
      restoreConnection: async () => ({
        event: 'connect_error',
        id: 1,
        payload: { code: 0, message: 'No fixture restoration' },
      }),
      listen: () => () => {},
      disconnect: async () => {
        calls.push('disconnect');
      },
      send: async () => {
        calls.push('FORBIDDEN_SEND');
        throw new Error('Signing forbidden in this fixture');
      },
    };
    Object.assign(window, {
      sweepdockFixture: { tonconnect: fixture },
      sweepdockFixtureCalls: calls,
    });
  });
  await page.route('**/api/balances', (route) =>
    route.fulfill({
      json: {
        network: 'ton-mainnet',
        source: 'tonapi',
        readOnly: true,
        address: '0:' + 'a'.repeat(64),
        observedAtMs: Date.now(),
        nativeBalanceUnits: '1000000000',
        complete: true,
        assets: [],
      },
    }),
  );
  await page.goto('/app');
  await expect(
    page.getByRole('button', { name: 'Connect wallet', exact: true }),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Connect wallet', exact: true })
    .click();
  await page.getByText('Fixture wallet · no funds', { exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Wallet connected · mainnet' }),
  ).toBeVisible();
  await expect(page.getByLabel('Public TON wallet address')).toHaveValue(
    '0:' + 'a'.repeat(64),
  );
  await page.getByRole('button', { name: 'Read wallet balances' }).click();
  await expect(page.getByText('TON balance', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Disconnect wallet' }).click();
  await expect(page.getByLabel('Public TON wallet address')).toHaveValue('');
  await expect(page.getByText('TON balance', { exact: true })).toHaveCount(0);
  expect(
    await page.evaluate(() => Reflect.get(window, 'sweepdockFixtureCalls')),
  ).toEqual(['connect', 'disconnect']);
  expect(external).toEqual([]);
});
