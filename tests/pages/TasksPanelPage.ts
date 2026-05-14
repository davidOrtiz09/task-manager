import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class TasksPanelPage {
  private readonly addInput: Locator;
  private readonly addButton: Locator;
  private readonly pendingList: Locator;
  private readonly completedList: Locator;

  constructor(private readonly page: Page) {
    this.addInput = page.getByTestId("task-input");
    this.addButton = page.getByTestId("add-task-btn");
    this.pendingList = page.getByTestId("pending-list");
    this.completedList = page.getByTestId("completed-list");
  }

  async addTask(title: string): Promise<void> {
    await this.addInput.fill(title);
    await this.addButton.click();
    // Wait for the submission to complete so back-to-back addTask calls are safe.
    // The button reverts to "Add Task" only after setSubmitting(false) fires.
    await expect(this.addButton).toHaveText("Add Task");
  }

  pendingItem(title: string): Locator {
    return this.pendingList
      .getByTestId("pending-item")
      .filter({ hasText: title });
  }

  completedItem(title: string): Locator {
    return this.completedList
      .getByTestId("completed-item")
      .filter({ hasText: title });
  }

  async clickComplete(title: string): Promise<void> {
    await this.pendingItem(title).getByTestId("complete-btn").click();
  }
}
