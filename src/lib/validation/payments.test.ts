import { describe, expect, it } from "vitest";

import { manualPaymentSchema } from "./payments";

describe("manualPaymentSchema", () => {
  it("accepteert een geldig bedrag en type", () => {
    const result = manualPaymentSchema.safeParse({ type: "aanbetaling", amount: "250" });
    expect(result.success).toBe(true);
  });

  it("weigert een bedrag van 0", () => {
    const result = manualPaymentSchema.safeParse({ type: "aanbetaling", amount: "0" });
    expect(result.success).toBe(false);
  });

  it("weigert een negatief bedrag", () => {
    const result = manualPaymentSchema.safeParse({ type: "aanbetaling", amount: "-10" });
    expect(result.success).toBe(false);
  });

  it("weigert meer dan twee decimalen", () => {
    const result = manualPaymentSchema.safeParse({ type: "overig", amount: "10.999" });
    expect(result.success).toBe(false);
  });

  it("valt terug op 'aanbetaling' als er geen type is meegegeven", () => {
    const result = manualPaymentSchema.safeParse({ amount: "100" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("aanbetaling");
    }
  });
});
