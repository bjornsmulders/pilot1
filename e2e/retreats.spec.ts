import { test, expect } from "@playwright/test";

async function loginAsOwner(page: import("@playwright/test").Page) {
  await page.goto("/inloggen");
  await page.getByLabel("E-mailadres").fill("elena@stillekracht.nl");
  await page.getByLabel("Wachtwoord").fill("JourneyOS-Pilot-2026!");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Retreatbeheer", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test("een retreat aanmaken en terugzien in het overzicht", async ({ page }) => {
    const title = `E2E Testretreat ${Date.now()}`;

    await page.goto("/retreats/nieuw");
    await page.getByLabel("Titel").fill(title);
    await page.getByLabel("Startdatum").fill("2026-09-01");
    await page.getByLabel("Einddatum").fill("2026-09-05");
    await page.getByLabel("Capaciteit").fill("12");
    await page.getByLabel("Prijs per persoon (EUR)").fill("999");
    await page.getByRole("button", { name: "Retreat aanmaken" }).click();

    await expect(page).toHaveURL(/\/retreats\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await page.goto("/retreats");
    await expect(page.getByText(title)).toBeVisible();
  });

  test("een ongeldige einddatum wordt geweigerd", async ({ page }) => {
    await page.goto("/retreats/nieuw");
    await page.getByLabel("Titel").fill("Ongeldig retreat");
    await page.getByLabel("Startdatum").fill("2026-09-10");
    await page.getByLabel("Einddatum").fill("2026-09-01");
    await page.getByLabel("Capaciteit").fill("10");
    await page.getByLabel("Prijs per persoon (EUR)").fill("500");
    await page.getByRole("button", { name: "Retreat aanmaken" }).click();

    await expect(page.getByText(/einddatum kan niet vóór de startdatum liggen/i)).toBeVisible();
    await expect(page).toHaveURL(/\/retreats\/nieuw/);
  });

  test("een negatieve capaciteit wordt geweigerd door de browser/validatie", async ({ page }) => {
    await page.goto("/retreats/nieuw");
    await page.getByLabel("Titel").fill("Negatieve capaciteit");
    await page.getByLabel("Startdatum").fill("2026-09-01");
    await page.getByLabel("Einddatum").fill("2026-09-05");
    await page.getByLabel("Capaciteit").fill("-5");
    await page.getByLabel("Prijs per persoon (EUR)").fill("500");
    await page.getByRole("button", { name: "Retreat aanmaken" }).click();

    // Het <input type="number" min="0"> voorkomt dit al client-side; als het
    // toch bij de server-actie komt, weigert het Zod-schema het (zie
    // src/lib/validation/retreats.test.ts). We controleren dat er in geen
    // geval een retreat met een negatieve capaciteit wordt aangemaakt.
    await expect(page).not.toHaveURL(/\/retreats\/[0-9a-f-]+$/);
  });
});
