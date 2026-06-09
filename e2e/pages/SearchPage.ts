import { type Page, type Locator } from '@playwright/test';

export class SearchPage {
  readonly page: Page;
  readonly input:   Locator;
  readonly results: Locator;
  readonly cancel:  Locator;

  constructor(page: Page) {
    this.page    = page;
    this.input   = page.locator('[data-testid="search-input"]');
    this.results = page.locator('[data-testid="search-result-item"]');
    this.cancel  = page.getByText('Cancel');
  }

  async goto() {
    await this.page.goto('/search', { waitUntil: 'domcontentloaded' });
  }

  async search(query: string) {
    await this.input.fill(query);
    await this.page.waitForTimeout(400);
  }
}
