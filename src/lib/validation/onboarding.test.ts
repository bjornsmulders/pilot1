import { describe, expect, it } from "vitest";

import { onboardingSchema } from "./onboarding";

describe("onboardingSchema", () => {
  it("accepteert volledig lege invoer (alles optioneel)", () => {
    const result = onboardingSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepteert geldige reisgegevens", () => {
    const result = onboardingSchema.safeParse({
      transportType: "vliegtuig",
      departureLocation: "Amsterdam",
      airport: "Schiphol",
      flightNumber: "KL123",
      carpoolOffered: true,
    });
    expect(result.success).toBe(true);
  });

  it("weigert een ongeldig vervoerstype", () => {
    const result = onboardingSchema.safeParse({ transportType: "raket" });
    expect(result.success).toBe(false);
  });

  it("zet carpoolOffered/carpoolRequested standaard op false", () => {
    const result = onboardingSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.carpoolOffered).toBe(false);
      expect(result.data.carpoolRequested).toBe(false);
    }
  });
});
