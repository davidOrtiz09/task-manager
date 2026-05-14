import type { Page, Locator } from "@playwright/test";

export class SmsPanelPage {
  private readonly list: Locator;

  constructor(page: Page) {
    this.list = page.getByTestId("sms-list");
  }

  firstItem(): Locator {
    return this.list.getByTestId("sms-item").first();
  }
}
