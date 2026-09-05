import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('checks quote validity again at the persistent claim boundary', async ({
  page,
}) => {
  await page.goto('/safety');
  await expect(
    page.getByRole('button', { name: 'Start simulated attempt' }),
  ).toBeEnabled();
  const result = await page.evaluate(async () => {
    const modulePath = '/src/features/safety/journal.ts';
    const journal = await import(modulePath);
    const now = Date.now();
    const wallet = '0:' + 'a'.repeat(64);
    try {
      await journal.claimSafetyAttempt(
        {
          id: 'expired-at-claim',
          wallet,
          chain: '-3',
          quoteId: 'sample-quote',
          issuedAt: now - 60_000,
          expiresAt: now - 1,
          inputMaster: '0:' + 'b'.repeat(64),
          outputMaster: '0:' + 'c'.repeat(64),
          units: '1',
        },
        { address: wallet, chain: '-3' },
      );
      return 'unexpected claim';
    } catch (error) {
      return error instanceof Error ? error.message : 'unknown';
    }
  });
  expect(result).toBe('QUOTE_EXPIRED');
  await page.reload();
  await expect(
    page.getByText('No saved attempt.', { exact: true }),
  ).toBeVisible();
});

test('unfinished attempt survives refresh and stays blocked in Doctor', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname !== '127.0.0.1' || url.pathname.startsWith('/api/'))
      external.push(request.url());
  });
  await page.goto('/safety');
  await page.getByRole('button', { name: 'Start simulated attempt' }).click();
  await expect(
    page.getByText('Waiting for a simulated wallet response.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('Status not confirmed. Do not send again.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Start simulated attempt' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Recheck saved status' }).click();
  await expect(
    page.getByText('Status not confirmed. Do not send again.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Inspect in Swap Doctor' }).click();
  await expect(
    page.getByText('Safety lab · simulated events', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Result unconfirmed', { exact: true }),
  ).toBeVisible();
  await page.getByText('Preview report contents', { exact: true }).click();
  const report = await page.locator('pre').innerText();
  expect(report).toContain('simulation');
  expect(report).not.toContain('0:' + 'a'.repeat(64));
  expect(report).not.toContain('sample-quote');
  expect(external).toEqual([]);
});

for (const [scenario, reason] of [
  ['mainnet', 'NETWORK_MISMATCH'],
  ['changed-wallet', 'WALLET_CHANGED'],
  ['expired', 'QUOTE_EXPIRED'],
]) {
  test(`blocks ${scenario} before creating an attempt`, async ({ page }) => {
    await page.goto('/safety');
    await expect(
      page.getByRole('button', { name: 'Start simulated attempt' }),
    ).toBeEnabled();
    await page.getByLabel('Safety check scenario').selectOption(scenario!);
    await page.getByRole('button', { name: 'Start simulated attempt' }).click();
    await expect(page.getByRole('alert')).toContainText(reason!);
    await expect(
      page.getByText('No saved attempt.', { exact: true }),
    ).toBeVisible();
  });
}

test('serializes two-tab claims and preserves one attempt', async ({
  page,
  context,
}) => {
  await page.goto('/safety');
  const other = await context.newPage();
  await other.goto('/safety');
  await expect(
    page.getByRole('button', { name: 'Start simulated attempt' }),
  ).toBeEnabled();
  await expect(
    other.getByRole('button', { name: 'Start simulated attempt' }),
  ).toBeEnabled();
  await Promise.all(
    [page, other].map((p) =>
      p.getByRole('button', { name: 'Start simulated attempt' }).click(),
    ),
  );
  await expect
    .poll(
      async () =>
        (await page.getByRole('alert').count()) +
        (await other.getByRole('alert').count()),
    )
    .toBe(1);
  const record = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('sweepdock-safety-lab-v1', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return await new Promise<{ events: { kind: string }[] }>(
      (resolve, reject) => {
        const tx = db.transaction('attempts', 'readonly');
        const request = tx.objectStore('attempts').get('current');
        tx.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      },
    );
  });
  expect(
    record.events.filter((e) => e.kind === 'signature_requested'),
  ).toHaveLength(1);
  await page.reload();
  await other.reload();
  for (const p of [page, other])
    await expect(
      p.getByRole('button', { name: 'Start simulated attempt' }),
    ).toBeDisabled();
});

test('a simulated wallet response remains pending and a fixture receipt is explicit', async ({
  page,
}) => {
  await page.goto('/safety');
  await page.getByRole('button', { name: 'Start simulated attempt' }).click();
  await page.getByRole('button', { name: 'Simulate wallet response' }).click();
  await expect(
    page.getByText(
      'The simulated wallet responded. The swap result is not confirmed.',
      {
        exact: true,
      },
    ),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Simulate transaction found' })
    .click();
  await expect(
    page.getByText('Waiting for a sample result that matches this attempt.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Simulate matching receipt' }).click();
  await expect(
    page.getByText(
      'The sample result matched this attempt. No real swap took place.',
      {
        exact: true,
      },
    ),
  ).toBeVisible();
});

test('explicit rejection survives reload and requires deliberate clearing', async ({
  page,
}) => {
  await page.goto('/safety');
  await page.getByRole('button', { name: 'Start simulated attempt' }).click();
  await page.getByRole('button', { name: 'Simulate wallet rejection' }).click();
  await expect(
    page.getByText('The simulated wallet rejected this request.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('The simulated wallet rejected this request.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear finished sample' }).click();
  await expect(
    page.getByRole('button', { name: 'Start simulated attempt' }),
  ).toBeEnabled();
});

test('a stale tab cannot replace an unknown result with a rejection', async ({
  page,
  context,
}) => {
  await page.goto('/safety');
  await page.getByRole('button', { name: 'Start simulated attempt' }).click();
  await expect(
    page.getByText('Waiting for a simulated wallet response.', { exact: true }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto('/safety');
  await expect(
    other.getByText('Status not confirmed. Do not send again.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Simulate wallet rejection' }).click();
  await expect(page.getByRole('alert')).toContainText('SESSION_CHANGED');
  await page.getByRole('button', { name: 'Recheck saved status' }).click();
  await expect(
    page.getByText('Status not confirmed. Do not send again.', { exact: true }),
  ).toBeVisible();
});

test('a failed marker write cannot produce a simulated wallet request', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      IDBObjectStore.prototype.put = original;
      if (this.name === 'attempts')
        throw new DOMException('Storage full', 'QuotaExceededError');
      return original.apply(this, args);
    };
  });
  await page.goto('/safety');
  await page.getByRole('button', { name: 'Start simulated attempt' }).click();
  await expect(page.getByRole('alert')).toContainText('STORAGE_UNAVAILABLE');
  await expect(
    page.getByRole('button', { name: 'Simulate wallet response' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Start simulated attempt' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Recheck saved status' }).click();
  await expect(
    page.getByText('No saved attempt.', { exact: true }),
  ).toBeVisible();
});

test('storage failure blocks attempts instead of using memory', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new Error('blocked');
      },
    }),
  );
  await page.goto('/safety');
  await expect(page.getByRole('alert')).toContainText('STORAGE_UNAVAILABLE');
  await expect(
    page.getByRole('button', { name: 'Start simulated attempt' }),
  ).toBeDisabled();
});

test('corrupt saved data is not silently discarded', async ({ page }) => {
  await page.goto('/safety');
  await expect(
    page.getByRole('button', { name: 'Start simulated attempt' }),
  ).toBeEnabled();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open('sweepdock-safety-lab-v1', 1);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('attempts', 'readwrite');
      tx.objectStore('attempts').put(
        { schemaVersion: 99, environment: 'mainnet' },
        'current',
      );
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    });
  });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('STORAGE_UNAVAILABLE');
  await expect(
    page.getByRole('button', { name: 'Start simulated attempt' }),
  ).toBeDisabled();
});

test('safety lab and recovered Doctor fit a small screen and remain accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/safety');
  await page.getByRole('button', { name: 'Start simulated attempt' }).click();
  await page.getByRole('button', { name: 'Simulate timeout' }).click();
  for (const url of ['/safety', '/safety/doctor']) {
    await page.goto(url);
    await expect(
      page.getByText('Safety lab · simulated events', { exact: true }),
    ).toBeVisible();
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
  }
});
