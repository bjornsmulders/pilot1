import { test, expect, type Browser } from "@playwright/test";

/**
 * Bewijst dat organisatie A geen enkele rij van organisatie B/C kan lezen,
 * zelfs met een directe URL -- de RLS-policy op retreats
 * (supabase/migrations/20260716081524_rls_policies.sql) blokkeert de query
 * op databaseniveau, wat resulteert in een 404 in plaats van data-lekkage.
 * Gebruikt de geseede "Tenantisolatie Testorganisatie" (owner@tenant-test.dev)
 * en "Stille Kracht Retreats" (elena@stillekracht.nl). Zie supabase/seed/run.ts.
 */

async function loginInNewContext(
  browser: Browser,
  email: string,
  password: string
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/inloggen");
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill(password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  return { context, page };
}

test("organisatie A kan een retreat van een andere organisatie niet openen via directe URL", async ({
  browser,
}) => {
  const tenantTest = await loginInNewContext(
    browser,
    "owner@tenant-test.dev",
    "JourneyOS-Pilot-2026!"
  );
  await tenantTest.page.goto("/retreats");
  const retreatLink = tenantTest.page.getByRole("link", { name: /Testretreat/i });
  await expect(retreatLink).toBeVisible();
  const href = await retreatLink.getAttribute("href");
  expect(href).toBeTruthy();
  await tenantTest.context.close();

  const stilleKracht = await loginInNewContext(
    browser,
    "elena@stillekracht.nl",
    "JourneyOS-Pilot-2026!"
  );
  await stilleKracht.page.goto(href!);

  // RLS blokkeert de select-query -> getRetreat() geeft null -> notFound().
  await expect(stilleKracht.page.getByText(/pagina.*niet gevonden|404/i)).toBeVisible();
  await expect(stilleKracht.page.getByText("Testretreat")).toHaveCount(0);

  await stilleKracht.context.close();
});

test("organisatie A ziet organisatie B/C nergens in het eigen retreatoverzicht", async ({
  browser,
}) => {
  const stilleKracht = await loginInNewContext(
    browser,
    "elena@stillekracht.nl",
    "JourneyOS-Pilot-2026!"
  );
  await stilleKracht.page.goto("/retreats");

  await expect(stilleKracht.page.getByText(/testretreat/i)).toHaveCount(0);
  await expect(stilleKracht.page.getByText(/weekendretreat veluwe/i)).toHaveCount(0);

  await stilleKracht.context.close();
});
