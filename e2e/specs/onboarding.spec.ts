import { test, expect } from '@playwright/test';

test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('new user sees onboarding on fresh launch', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });
});
