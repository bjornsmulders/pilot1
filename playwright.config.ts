import { defineConfig, devices } from "@playwright/test";

/**
 * Vereist een draaiende app tegen een gekoppeld Supabase-project met seeddata
 * (npm run db:seed). Zie docs/pilot-setup.md. Kon in de oorspronkelijke
 * bouwomgeving niet worden uitgevoerd (geen Docker/Supabase-project
 * beschikbaar -- zie docs/decisions.md ADR-0006).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
