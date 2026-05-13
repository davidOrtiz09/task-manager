import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test.describe("Task lifecycle", () => {
  test("adding a task shows it in the pending list and triggers an immediate email", async ({
    page,
  }) => {
    const home = new HomePage(page);
    const title = `Buy groceries ${Date.now()}`;

    await page.goto("/");

    await home.tasks.addTask(title);

    // Task should appear immediately in pending list (optimistic update + poll)
    await expect(home.tasks.pendingItem(title)).toBeVisible({ timeout: 6000 });

    // Immediate email should arrive within one polling cycle (~4s)
    await expect(
      home.emails.emailItem(`New task added: ${title}`)
    ).toBeVisible({ timeout: 8000 });
  });

  test("completing a task via button moves it to the completed list", async ({
    page,
  }) => {
    const home = new HomePage(page);
    const title = `Write report ${Date.now()}`;

    await page.goto("/");
    await home.tasks.addTask(title);
    await expect(home.tasks.pendingItem(title)).toBeVisible({ timeout: 6000 });

    await home.tasks.clickComplete(title);

    // Should appear in completed list
    await expect(home.tasks.completedItem(title)).toBeVisible({ timeout: 6000 });
    // Should no longer be in pending list
    await expect(home.tasks.pendingItem(title)).not.toBeVisible();
  });

  test("completing a task via the email action link shows a confirmation page", async ({
    page,
  }) => {
    const home = new HomePage(page);
    const title = `Schedule meeting ${Date.now()}`;

    await page.goto("/");
    await home.tasks.addTask(title);

    // Wait for the immediate email with the action link
    const link = home.emails.completeLink(`New task added: ${title}`);
    await expect(link).toBeVisible({ timeout: 8000 });

    // Click the link — navigates to the confirmation page
    await link.click();

    await expect(page).toHaveTitle("Task completed");
    await expect(page.locator("h1")).toContainText("Task completed");

    // Go back to the app and verify the task moved to completed
    await page.getByRole("link", { name: "Back to Task Manager" }).click();
    await expect(home.tasks.completedItem(title)).toBeVisible({ timeout: 6000 });
    await expect(home.tasks.pendingItem(title)).not.toBeVisible();
  });
});
