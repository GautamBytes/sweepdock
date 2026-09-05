import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('a multi-item cleanup survives refresh, reconciles the original attempt, and resumes sequentially', async ({
  page,
}) => {
  await page.goto('/safety/cleanup');
  await page.getByRole('button', { name: 'Create sample cleanup' }).click();
  await page.getByRole('button', { name: 'Approve STON simulation' }).click();
  await expect(
    page.getByRole('button', { name: 'Simulate wallet response' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('status')).toContainText('Uncertain');
  await expect(
    page.getByRole('button', { name: /Approve .* simulation/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Clear finished or unstarted sample' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Simulate late wallet response' })
    .click();
  await page.getByRole('button', { name: 'Simulate matching success' }).click();
  await page.getByRole('button', { name: 'Approve NOT simulation' }).click();
  await page.getByRole('button', { name: 'Simulate wallet response' }).click();
  await expect(page.getByRole('status')).toContainText('outcome unconfirmed');
  await page.getByRole('button', { name: 'Simulate matching success' }).click();
  await page.getByRole('button', { name: 'Approve USDT simulation' }).click();
  await page.getByRole('button', { name: 'Simulate wallet response' }).click();
  await page.getByRole('button', { name: 'Simulate matching success' }).click();
  await expect(page.getByRole('status')).toContainText('All three');
  await page
    .getByRole('link', { name: 'Inspect this session in Swap Doctor' })
    .click();
  await page.reload();
  await expect(page.getByText('receipt_verified', { exact: true })).toHaveCount(
    3,
  );
  const href = await page
    .getByRole('link', { name: 'Download report' })
    .getAttribute('href');
  const report = JSON.parse(
    decodeURIComponent(href!.split(',').slice(1).join(',')),
  );
  expect(report.environment).toBe('simulation');
  expect(JSON.stringify(report)).not.toMatch(
    /0:|messageHash|queryId|wallet|router/,
  );
  expect(
    report.events.filter(
      (e: { stage: string }) => e.stage === 'signature_requested',
    ),
  ).toHaveLength(3);
});
for (const outcome of [
  'Simulate partial result',
  'Simulate full refund',
  'Simulate wallet rejection',
]) {
  test(`${outcome} pauses the remaining tokens after reload`, async ({
    page,
  }) => {
    await page.goto('/safety/cleanup');
    await page.getByRole('button', { name: 'Create sample cleanup' }).click();
    await page.getByRole('button', { name: 'Approve STON simulation' }).click();
    if (outcome !== 'Simulate wallet rejection')
      await page
        .getByRole('button', { name: 'Simulate wallet response' })
        .click();
    await page.getByRole('button', { name: outcome }).click();
    // The terminal UI is published only after the IndexedDB transaction commits.
    // Reload before that acknowledgement legitimately recovers as uncertain.
    await expect(page.getByRole('status')).toContainText('queue is paused');
    await page.reload();
    await expect(page.getByRole('status')).toContainText('queue is paused');
    await expect(
      page.getByRole('button', { name: /Approve .* simulation/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Clear finished or unstarted sample' }),
    ).toBeEnabled();
  });
}
test('two tabs cannot claim the same token or overwrite an uncertain result', async ({
  page,
  context,
}) => {
  await page.goto('/safety/cleanup');
  await page.getByRole('button', { name: 'Create sample cleanup' }).click();
  const other = await context.newPage();
  await other.goto('/safety/cleanup');
  await expect(
    other.getByRole('button', { name: 'Approve STON simulation' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Approve STON simulation' }).click();
  await expect(
    page.getByRole('button', { name: 'Simulate wallet response' }),
  ).toBeVisible();
  await other.getByRole('button', { name: 'Approve STON simulation' }).click();
  await expect(other.getByRole('alert')).toContainText('Another tab');
  await other.reload();
  await expect(other.getByRole('status')).toContainText('Uncertain');
  await page.getByRole('button', { name: 'Simulate wallet rejection' }).click();
  await expect(page.getByRole('alert')).toContainText('Another tab');
  await page.getByRole('button', { name: 'Load latest saved status' }).click();
  await expect(page.getByRole('status')).toContainText('Uncertain');
});
test('expired remaining reviews cannot be approved until explicitly refreshed', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/safety/cleanup');
  await page.getByRole('button', { name: 'Create sample cleanup' }).click();
  await expect(
    page.getByRole('button', { name: 'Approve STON simulation' }),
  ).toBeEnabled();
  await page.clock.fastForward(47000);
  await expect(
    page.getByRole('button', { name: 'Approve STON simulation' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Refresh remaining reviews' }).click();
  await expect(
    page.getByRole('button', { name: 'Approve STON simulation' }),
  ).toBeEnabled();
});
test('storage failure prevents claims instead of silently falling back to memory', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'sessions')
        throw new DOMException('full', 'QuotaExceededError');
      return original.apply(this, args);
    };
  });
  await page.goto('/safety/cleanup');
  await page.getByRole('button', { name: 'Create sample cleanup' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'could not be read or written safely',
  );
  await expect(
    page.getByRole('button', { name: /Approve .* simulation/ }),
  ).toHaveCount(0);
});
for (const width of [360, 1440])
  test(`saved recovery and Doctor are accessible at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/safety/cleanup');
    await page.getByRole('button', { name: 'Create sample cleanup' }).click();
    await page.getByRole('button', { name: 'Approve STON simulation' }).click();
    for (const url of ['/safety/cleanup', '/safety/cleanup/doctor']) {
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('alert')).toHaveCount(0);
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
