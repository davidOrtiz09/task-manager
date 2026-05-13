import type { Page } from "@playwright/test";
import { TasksPanelPage } from "./TasksPanelPage";
import { EmailsPanelPage } from "./EmailsPanelPage";

export class HomePage {
  readonly tasks: TasksPanelPage;
  readonly emails: EmailsPanelPage;

  constructor(page: Page) {
    this.tasks = new TasksPanelPage(page);
    this.emails = new EmailsPanelPage(page);
  }
}
