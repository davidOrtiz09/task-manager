import type { Page, Locator } from "@playwright/test";

export class SmsPanelPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  itemContaining(text: string): Locator {
    // Scoped to the page rather than sms-list so the locator works both before
    // the first SMS arrives (sms-list not yet in DOM) and with accumulated
    // messages from earlier tests in the same run.
    return this.page.getByTestId("sms-item").filter({ hasText: text });
  }
}
