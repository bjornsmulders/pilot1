import { test, expect } from "@playwright/test";

/**
 * Vereist een gekoppeld Supabase-project (zie docs/pilot-setup.md). Draai
 * lokaal met: npm run dev (in een andere terminal) + npm run test:e2e.
 */

test.describe("Authenticatie", () => {
  test("niet-ingelogde toegang tot het dashboard wordt geblokkeerd", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/inloggen/);
  });

  test("registreren met een nieuw e-mailadres toont de bevestigingsmelding", async ({ page }) => {
    const uniqueEmail = `pilot-e2e-${Date.now()}@example.com`;

    await page.goto("/registreren");
    await page.getByLabel("Volledige naam").fill("E2E Testgebruiker");
    await page.getByLabel("E-mailadres").fill(uniqueEmail);
    await page.getByLabel("Wachtwoord", { exact: true }).fill("Testwachtwoord123");
    await page.getByLabel("Herhaal wachtwoord").fill("Testwachtwoord123");
    await page.getByRole("button", { name: "Account aanmaken" }).click();

    await expect(page.getByText("Check je e-mail")).toBeVisible();
  });

  test("inloggen met onjuiste gegevens toont een foutmelding", async ({ page }) => {
    await page.goto("/inloggen");
    await page.getByLabel("E-mailadres").fill("onbestaand@example.com");
    await page.getByLabel("Wachtwoord").fill("verkeerdwachtwoord");
    await page.getByRole("button", { name: "Inloggen" }).click();

    await expect(page.getByText(/onjuist/i)).toBeVisible();
  });

  test("inloggen met seedgebruiker leidt naar het dashboard", async ({ page }) => {
    await page.goto("/inloggen");
    await page.getByLabel("E-mailadres").fill("elena@stillekracht.nl");
    await page.getByLabel("Wachtwoord").fill("JourneyOS-Pilot-2026!");
    await page.getByRole("button", { name: "Inloggen" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Stille Kracht Retreats")).toBeVisible();
  });
});
