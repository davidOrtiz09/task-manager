import type { Page } from "@playwright/test";
import { TasksPanelPage } from "./TasksPanelPage";
import { EmailsPanelPage } from "./EmailsPanelPage";
import { SmsPanelPage } from "./SmsPanelPage";

export class HomePage {
  readonly tasks: TasksPanelPage;
  readonly emails: EmailsPanelPage;
  readonly sms: SmsPanelPage;

  constructor(page: Page) {
    this.tasks = new TasksPanelPage(page);
    this.emails = new EmailsPanelPage(page);
    this.sms = new SmsPanelPage(page);
  }
}
