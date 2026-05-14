import { defineConfig, devices } from "@playwright/test";

// When BASE_URL is set the tests run against an already-running server
// (e.g. the Docker app container). Otherwise Playwright starts its own
// dev server with the fast SMS cadence needed by the SMS test.
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";
const externalServer = !!process.env.BASE_URL;

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/unit/**"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: externalServer
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          // Fixed 3 s SMS cadence for tests; production uses the Fibonacci sequence.
          TEST_SMS_INTERVAL_MS: "3000",
        },
      },
});
