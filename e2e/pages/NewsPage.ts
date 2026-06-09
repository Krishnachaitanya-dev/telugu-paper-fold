import { type Page, type Locator } from '@playwright/test';

export class NewsPage {
  readonly page: Page;
  readonly newsFeed:   Locator;
  readonly searchBtn:  Locator;

  constructor(page: Page) {
    this.page      = page;
    this.newsFeed  = page.locator('[data-testid="news-feed"]');
    this.searchBtn = page.locator('[data-testid="search-btn"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async openSearch() {
    await this.searchBtn.click();
  }
}
