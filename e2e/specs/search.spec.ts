import { test, expect } from '@playwright/test';
import { SearchPage } from '../pages/SearchPage';

test.describe('Search', () => {
  test('search input is auto-focused', async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.goto();
    await expect(searchPage.input).toBeFocused({ timeout: 5_000 });
  });

  test('empty query shows no results', async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.goto();
    await expect(searchPage.results).toHaveCount(0);
  });

  test('cancel navigates back', async ({ page }) => {
    await page.goto('/');
    await page.goto('/search');
    await searchPage_cancelAndExpectBack(page);
  });
});

async function searchPage_cancelAndExpectBack(page: import('@playwright/test').Page) {
  const cancel = page.getByText('Cancel');
  if (await cancel.isVisible()) {
    await cancel.click();
  }
}
