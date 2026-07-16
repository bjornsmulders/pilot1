import { describe, expect, it } from "vitest";

import { retreatSchema } from "./retreats";

const validInput = {
  title: "Mallorca Voorjaarsretreat",
  description: "Een week rust en yoga.",
  location: "Sóller",
  country: "Spanje",
  startDate: "2026-05-10",
  endDate: "2026-05-17",
  capacity: "30",
  pricePerPerson: "2400",
  status: "concept",
  enrollmentVisibility: "besloten",
  bookingDeadline: "2026-04-10",
  internalNotes: "",
};

describe("retreatSchema", () => {
  it("accepteert geldige invoer", () => {
    const result = retreatSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("weigert een einddatum vóór de startdatum", () => {
    const result = retreatSchema.safeParse({
      ...validInput,
      startDate: "2026-05-17",
      endDate: "2026-05-10",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.endDate).toBeTruthy();
    }
  });

  it("weigert een negatieve capaciteit", () => {
    const result = retreatSchema.safeParse({ ...validInput, capacity: "-1" });
    expect(result.success).toBe(false);
  });

  it("weigert een negatieve prijs", () => {
    const result = retreatSchema.safeParse({ ...validInput, pricePerPerson: "-100" });
    expect(result.success).toBe(false);
  });

  it("accepteert capaciteit nul", () => {
    const result = retreatSchema.safeParse({ ...validInput, capacity: "0" });
    expect(result.success).toBe(true);
  });

  it("weigert een boekingsdeadline na de startdatum", () => {
    const result = retreatSchema.safeParse({
      ...validInput,
      bookingDeadline: "2026-05-15",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.bookingDeadline).toBeTruthy();
    }
  });

  it("weigert een lege titel", () => {
    const result = retreatSchema.safeParse({ ...validInput, title: "" });
    expect(result.success).toBe(false);
  });

  it("staat een lege boekingsdeadline toe", () => {
    const result = retreatSchema.safeParse({ ...validInput, bookingDeadline: "" });
    expect(result.success).toBe(true);
  });
});
