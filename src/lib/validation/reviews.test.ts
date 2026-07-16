import { describe, expect, it } from "vitest";

import { publicReviewSchema } from "./reviews";

describe("publicReviewSchema", () => {
  it("accepteert een geldige review", () => {
    const result = publicReviewSchema.safeParse({
      authorName: "Sanne",
      rating: "5",
      body: "Geweldige week!",
      website: "",
    });
    expect(result.success).toBe(true);
  });

  it("weigert een waardering van 0", () => {
    const result = publicReviewSchema.safeParse({ authorName: "Sanne", rating: "0" });
    expect(result.success).toBe(false);
  });

  it("weigert een waardering boven de 5", () => {
    const result = publicReviewSchema.safeParse({ authorName: "Sanne", rating: "6" });
    expect(result.success).toBe(false);
  });

  it("staat een lege review-tekst toe (alleen de waardering is verplicht)", () => {
    const result = publicReviewSchema.safeParse({ authorName: "Sanne", rating: "4", body: "" });
    expect(result.success).toBe(true);
  });
});
