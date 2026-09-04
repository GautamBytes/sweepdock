import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [360, 1440]) {
  for (const route of ['/developers', '/doctor', '/docs']) {
    test(`${route} workspace fits ${width}px and passes accessibility`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      const audit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(audit.violations).toEqual([]);
      expect(errors).toEqual([]);
      if (route === '/developers') {
        await page
          .getByRole('link', { name: 'Read the developer guide' })
          .click();
        await expect(page).toHaveURL(/\/docs\/developers$/);
        await page.goBack();
        await page
          .getByRole('link', { name: 'Open offline safety lab' })
          .click();
        await expect(page).toHaveURL(/\/safety$/);
      } else if (route === '/doctor') {
        await page.getByRole('link', { name: 'Try wallet cleanup' }).click();
        await expect(page).toHaveURL(/\/demo$/);
      } else {
        await page.getByRole('link', { name: /For wallet owners/ }).click();
        await expect(page).toHaveURL(/\/docs\/wallet-users$/);
      }
    });
  }
}

test('one workspace section remains active across its nested and live routes', async ({
  page,
}) => {
  for (const [route, section] of [
    ['/demo', '/demo'],
    ['/app', '/demo'],
    ['/doctor', '/doctor'],
    ['/safety/doctor', '/doctor'],
    ['/developers', '/developers'],
    ['/docs/status', '/docs'],
  ] as const) {
    await page.goto(route);
    const active = page
      .getByRole('navigation', { name: 'Main navigation' })
      .locator('[aria-current="page"]');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveAttribute('href', section);
  }
});
