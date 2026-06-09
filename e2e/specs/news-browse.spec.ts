import { test, expect } from '@playwright/test';
import { NewsPage } from '../pages/NewsPage';
import { SearchPage } from '../pages/SearchPage';

test.describe('News browsing', () => {
  test('home screen loads', async ({ page }) => {
    const newsPage = new NewsPage(page);
    await newsPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/');
  });

  test('home header is hidden and category chips remain available', async ({ page }) => {
    const newsPage = new NewsPage(page);
    await newsPage.goto();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('INSTA NEWS TELUGU')).toHaveCount(0);
    await expect(page.getByText('All').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Latest').first()).toBeVisible();
  });

  test('search screen renders and accepts input', async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.goto();
    await expect(searchPage.input).toBeVisible({ timeout: 10_000 });
    await searchPage.search('telugu');
    await expect(searchPage.input).toHaveValue('telugu');
  });

  test('dark mode does not show white flash', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor,
    );
    expect(bg).not.toBe('rgb(255, 255, 255)');
  });
});
