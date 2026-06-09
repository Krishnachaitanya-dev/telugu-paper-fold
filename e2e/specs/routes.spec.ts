import { test, expect } from '@playwright/test';

const ROUTES = [
  '/',
  '/search',
  '/profile/about',
  '/profile/display',
  '/profile/language',
  '/profile/notifications',
  '/profile/saved',
  '/profile/history',
];

for (const route of ROUTES) {
  test(`route ${route} loads without crash`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(route, { waitUntil: 'networkidle', timeout: 30_000 });

    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
    await expect(page.locator('body')).not.toBeEmpty();
  });
}
