import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('docs are discoverable, guides navigate, and unknown guides offer recovery', async ({
  page,
}) => {
  const external: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (!['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname))
      external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Docs', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'A clearer decision before a swap.' }),
  ).toBeVisible();
  for (const [label, heading] of [
    ['Why this approach', 'Check the cost. Explain the outcome.'],
    ['Wallet user guide', 'Try the workflow without spending.'],
    ['Developer guide', 'Inspect the rules behind the interface.'],
    ['Safety & privacy', 'Know what each mode can do.'],
    ['What works today', 'A working prototype, with a defined next step.'],
  ] as const) {
    await page
      .getByRole('navigation', { name: 'Documentation', exact: true })
      .getByRole('link', { name: label, exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
  }
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  await page.goto('/docs/missing-guide');
  await expect(
    page.getByRole('heading', { name: 'That guide is not here.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Open SweepDock docs' }).click();
  await expect(page).toHaveURL(/\/docs$/);
});

for (const width of [360, 1440]) {
  for (const guide of ['wallet-users', 'developers', 'safety']) {
    test(`docs ${guide} fit ${width}px and pass accessibility`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/docs/${guide}`);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(result.violations).toEqual([]);
      await expect(
        page
          .getByRole('navigation', { name: 'Main navigation' })
          .getByRole('link', { name: 'Docs', exact: true }),
      ).toBeVisible();
    });
  }
}

test('guide section links work directly, after refresh, and on navigation', async ({
  page,
}) => {
  await page.goto('/docs/wallet-users#quotes');
  await expect(
    page.getByRole('heading', { name: '3. Read a live quote' }),
  ).toBeInViewport();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: '3. Read a live quote' }),
  ).toBeInViewport();
  await page
    .getByRole('navigation', { name: 'Documentation', exact: true })
    .getByRole('link', { name: 'Developer guide' })
    .click();
  await page
    .getByRole('navigation', { name: 'On this page' })
    .getByRole('link', { name: 'Use exact base units' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Use exact base units' }),
  ).toBeInViewport();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Wallet Cleanup', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'A little less clutter.' }),
  ).toBeInViewport();
});
