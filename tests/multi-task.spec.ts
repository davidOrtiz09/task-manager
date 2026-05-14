import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test.describe("Multi-task behavior", () => {
  test("two pending tasks each get an independent immediate email with a Complete button", async ({
    page,
  }) => {
    const home = new HomePage(page);
    const ts = Date.now();
    const titleA = `Task Alpha ${ts}`;
    const titleB = `Task Beta ${ts}`;

    await page.goto("/");
    await home.tasks.addTask(titleA);
    await home.tasks.addTask(titleB);

    // Both tasks appear in the pending list simultaneously
    await expect(home.tasks.pendingItem(titleA)).toBeVisible({ timeout: 6000 });
    await expect(home.tasks.pendingItem(titleB)).toBeVisible({ timeout: 6000 });

    // Each task gets its own immediate email and Complete button
    await expect(
      home.emails.completeLink(`New task added: ${titleA}`)
    ).toBeVisible({ timeout: 8000 });
    await expect(
      home.emails.completeLink(`New task added: ${titleB}`)
    ).toBeVisible({ timeout: 8000 });
  });

  test("completing one task via its email button does not affect the other task", async ({
    page,
  }) => {
    const home = new HomePage(page);
    const ts = Date.now();
    const titleA = `Task Alpha ${ts}`;
    const titleB = `Task Beta ${ts}`;

    await page.goto("/");
    await home.tasks.addTask(titleA);
    await home.tasks.addTask(titleB);

    // Wait for both Complete buttons to be visible
    await expect(
      home.emails.completeLink(`New task added: ${titleA}`)
    ).toBeVisible({ timeout: 8000 });
    await expect(
      home.emails.completeLink(`New task added: ${titleB}`)
    ).toBeVisible({ timeout: 8000 });

    // Complete Task A via its email button only
    await home.emails.completeLink(`New task added: ${titleA}`).click();

    // Task A moves to completed, Task B remains pending
    await expect(home.tasks.completedItem(titleA)).toBeVisible({ timeout: 6000 });
    await expect(home.tasks.pendingItem(titleA)).not.toBeVisible();
    await expect(home.tasks.pendingItem(titleB)).toBeVisible();

    // Task A's Complete button disappears (next poll strips it), Task B's stays
    await expect(
      home.emails.completeLink(`New task added: ${titleA}`)
    ).not.toBeVisible({ timeout: 4000 });
    await expect(
      home.emails.completeLink(`New task added: ${titleB}`)
    ).toBeVisible();
  });
});
