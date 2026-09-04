import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [360, 390, 768, 1010, 1440]) {
  test(`landing is accessible, self-contained and fits ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    const external: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (!['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname))
        external.push(request.url());
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole('heading', {
        name: 'See which tokens are worth swapping.',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('No wallet needed for the demo. No real transactions.', {
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await nav.getByRole('link', { name: 'How it works' }).click();
    await expect(
      page.getByRole('heading', { name: 'Check the cost before you swap.' }),
    ).toBeInViewport();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Check the cost before you swap.' }),
    ).toBeInViewport();
    await nav.getByRole('link', { name: 'Tools', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Start with what you need.' }),
    ).toBeInViewport();
  });
}

test('landing links open all tools and returning home preserves a paused simulation', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('main')
    .getByRole('link', { name: 'Try the demo', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'A little less clutter.' }),
  ).toBeVisible();
  await page.getByLabel('Demo outcome').selectOption('unknown');
  await page.getByRole('button', { name: 'Review selection' }).click();
  await page.getByRole('button', { name: 'Approve simulation' }).click();
  await page.getByRole('link', { name: 'SweepDock home' }).click();
  await page.getByRole('link', { name: /^Swap Doctor/ }).click();
  await expect(page.getByText('status_unknown', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'SweepDock home' }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'For developers' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Useful beyond this screen.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'SweepDock home' }).click();
  await page
    .getByRole('main')
    .getByRole('link', { name: 'Try the demo', exact: true })
    .click();
  await expect(
    page.getByText('Status not confirmed. Do not send again.'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Approve simulation' }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'SweepDock home' }).click();
  await page.getByRole('link', { name: 'Compare live quotes' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByText('Mainnet · read only', { exact: true }),
  ).toBeVisible();
});
