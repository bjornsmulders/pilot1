import { describe, expect, it } from "vitest";

import { leadSchema, publicLeadSchema } from "./leads";

describe("leadSchema", () => {
  it("accepteert een minimale geldige lead", () => {
    const result = leadSchema.safeParse({ name: "Jan Jansen" });
    expect(result.success).toBe(true);
  });

  it("weigert een te korte naam", () => {
    const result = leadSchema.safeParse({ name: "J" });
    expect(result.success).toBe(false);
  });

  it("weigert een ongeldig e-mailadres", () => {
    const result = leadSchema.safeParse({ name: "Jan Jansen", email: "niet-een-email" });
    expect(result.success).toBe(false);
  });

  it("zet platformMatchingConsent standaard op false", () => {
    const result = leadSchema.safeParse({ name: "Jan Jansen" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platformMatchingConsent).toBe(false);
    }
  });
});

describe("publicLeadSchema", () => {
  const validInput = {
    name: "Marie de Vries",
    email: "marie@example.com",
    phone: "",
    desiredPeriod: "voorjaar 2026",
    message: "Ik ben erg geïnteresseerd!",
    whatsappConsent: true,
    marketingConsent: false,
    website: "",
  };

  it("accepteert geldige invoer", () => {
    const result = publicLeadSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("vereist een e-mailadres (in tegenstelling tot het interne leadSchema)", () => {
    const result = publicLeadSchema.safeParse({ ...validInput, email: "" });
    expect(result.success).toBe(false);
  });

  it("laat een ingevuld honeypot-veld door de schemavalidatie heen (afhandeling gebeurt in de server action, niet hier)", () => {
    const result = publicLeadSchema.safeParse({ ...validInput, website: "http://spam.example" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.website).toBe("http://spam.example");
    }
  });

  it("accepteert een leeg honeypot-veld", () => {
    const result = publicLeadSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.website).toBe("");
    }
  });
});
