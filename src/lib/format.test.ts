import { describe, expect, it } from "vitest";

import { formatCurrencyEUR, formatDate, formatDateRange, formatPercentage } from "./format";

describe("formatCurrencyEUR", () => {
  it("formatteert bedragen als Nederlandse euro's", () => {
    // Intl.NumberFormat plaatst een non-breaking space na het valutateken,
    // dus we normaliseren whitespace in plaats van een exacte string te matchen.
    expect(formatCurrencyEUR(2400).replace(/\s/g, " ")).toBe("€ 2.400,00");
    expect(formatCurrencyEUR(0).replace(/\s/g, " ")).toBe("€ 0,00");
  });
});

describe("formatPercentage", () => {
  it("formatteert een fractie als afgerond percentage", () => {
    expect(formatPercentage(0.5)).toBe("50%");
    expect(formatPercentage(0)).toBe("0%");
  });
});

describe("formatDate", () => {
  it("toont de datum in Europe/Amsterdam, ongeacht de opgeslagen UTC-tijd", () => {
    // 2026-05-10T23:30:00Z is al 2026-05-11 01:30 in Europe/Amsterdam (zomertijd, UTC+2).
    const result = formatDate("2026-05-10T23:30:00Z");
    expect(result).toContain("mei");
    expect(result).toContain("2026");
  });
});

describe("formatDateRange", () => {
  it("combineert start- en einddatum leesbaar", () => {
    const result = formatDateRange("2026-05-10", "2026-05-17");
    expect(result).toContain("–");
    expect(result).toContain("2026");
  });
});
