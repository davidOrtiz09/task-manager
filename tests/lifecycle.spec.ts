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

  test("SMS fires on schedule after a task is added", async ({ page }) => {
    const home = new HomePage(page);
    const title = `SMS test ${Date.now()}`;

    await page.goto("/");
    await home.tasks.addTask(title);
    await expect(home.tasks.pendingItem(title)).toBeVisible({ timeout: 6000 });

    // TEST_SMS_INTERVAL_MS=3000 so an SMS fires within 3 s; allow 12 s for
    // jitter. Filter to the specific item so accumulated messages from earlier
    // tests in the same run don't cause a false pass or race condition.
    await expect(home.sms.itemContaining(title)).toBeVisible({ timeout: 12000 });
  });

  test("completing a task via the email action button moves it to the completed list", async ({
    page,
  }) => {
    const home = new HomePage(page);
    const title = `Schedule meeting ${Date.now()}`;

    await page.goto("/");
    await home.tasks.addTask(title);

    // Wait for the immediate email with the action button
    const btn = home.emails.completeLink(`New task added: ${title}`);
    await expect(btn).toBeVisible({ timeout: 8000 });

    // Click — stays on the same page; polling moves the task within ~2 s
    await btn.click();

    await expect(home.tasks.completedItem(title)).toBeVisible({ timeout: 6000 });
    await expect(home.tasks.pendingItem(title)).not.toBeVisible();
  });
});
