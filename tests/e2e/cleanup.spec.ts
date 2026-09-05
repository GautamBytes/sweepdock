import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('serves a declared local favicon', async ({ page, request }) => {
  await page.goto('/demo');
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute('href', '/favicon.svg');
  const response = await request.get('/favicon.svg');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
});

test('cleanup requires a separate approval for each item and produces a local report', async ({
  page,
}) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (!new URL(request.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/))
      externalRequests.push(request.url());
  });
  await page.goto('/demo');
  await expect(page.getByText('Simulation · no real funds')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Select NOT', exact: true }).check();
  await page
    .getByRole('checkbox', { name: 'Select REDO', exact: true })
    .check();
  await page.getByRole('button', { name: 'Review selection' }).click();
  await expect(
    page.getByText('REDO skipped: estimated cost is too high.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Approve simulation' }).click();
  await expect(page.locator('.state-completed')).toHaveCount(1);
  await expect(page.locator('.state-review_ready')).toHaveCount(1);
  await page.getByRole('button', { name: 'Approve simulation' }).click();
  await expect(page.locator('.state-completed')).toHaveCount(2);
  await expect(
    page.getByRole('button', { name: 'Approve simulation' }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Swap Doctor', exact: true }).click();
  await expect(
    page.getByText('Expected result matched', { exact: true }),
  ).toHaveCount(2);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download report' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('sweepdock-simulation-report.json');
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

for (const outcome of ['unknown', 'partial', 'rejected']) {
  test(`${outcome} pauses the rest of the queue`, async ({ page }) => {
    await page.goto('/demo');
    await page
      .getByRole('checkbox', { name: 'Select NOT', exact: true })
      .check();
    await page.getByLabel('Demo outcome').selectOption(outcome);
    await page.getByRole('button', { name: 'Review selection' }).click();
    await page.getByRole('button', { name: 'Approve simulation' }).click();
    await expect(page.locator(`.state-${outcome}`)).toHaveCount(1);
    await expect(page.locator('.state-review_ready')).toHaveCount(1);
    await expect(
      page.getByRole('button', { name: 'Approve simulation' }),
    ).toHaveCount(0);
    await expect(page.getByRole('button', { name: /retry/i })).toHaveCount(0);
  });
}

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`cleanup is accessible and fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/demo');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
    await expect(
      page.getByRole('button', { name: 'Review selection' }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
