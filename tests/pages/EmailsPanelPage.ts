import type { Page, Locator } from "@playwright/test";

export class EmailsPanelPage {
  private readonly list: Locator;

  constructor(private readonly page: Page) {
    this.list = page.getByTestId("email-list");
  }

  emailItem(subjectText: string): Locator {
    return this.list
      .getByTestId("email-item")
      .filter({ hasText: subjectText });
  }

  completeLink(subjectText: string): Locator {
    return this.emailItem(subjectText).getByTestId("complete-email-link");
  }
}
