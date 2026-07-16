import { describe, expect, it } from "vitest";

import { scheduleItemSchema } from "./schedule";

describe("scheduleItemSchema", () => {
  it("accepteert een geldig programmaonderdeel zonder tijden", () => {
    const result = scheduleItemSchema.safeParse({ title: "Ochtendyoga" });
    expect(result.success).toBe(true);
  });

  it("weigert een eindtijd vóór de starttijd", () => {
    const result = scheduleItemSchema.safeParse({
      title: "Wandeling",
      startsAt: "2026-08-10T14:00",
      endsAt: "2026-08-10T13:00",
    });
    expect(result.success).toBe(false);
  });

  it("accepteert een eindtijd na de starttijd", () => {
    const result = scheduleItemSchema.safeParse({
      title: "Wandeling",
      startsAt: "2026-08-10T13:00",
      endsAt: "2026-08-10T14:00",
    });
    expect(result.success).toBe(true);
  });
});
