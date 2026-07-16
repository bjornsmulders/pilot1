import { describe, expect, it } from "vitest";

import { formatWhatsAppNumber, buildWaLink } from "./whatsapp";

describe("formatWhatsAppNumber", () => {
  it("zet een Nederlands nummer met voorloop-0 om naar internationaal", () => {
    expect(formatWhatsAppNumber("06-12345678")).toBe("31612345678");
  });

  it("laat een al-internationaal nummer met + intact (alleen cijfers)", () => {
    expect(formatWhatsAppNumber("+31 6 12345678")).toBe("31612345678");
  });

  it("strip een voorloop-00", () => {
    expect(formatWhatsAppNumber("0031612345678")).toBe("31612345678");
  });

  it("geeft null voor een leeg/ongeldig nummer", () => {
    expect(formatWhatsAppNumber("")).toBeNull();
    expect(formatWhatsAppNumber("geen nummer")).toBeNull();
  });
});

describe("buildWaLink", () => {
  it("bouwt een geldige wa.me-link met URL-geencodeerde tekst", () => {
    const link = buildWaLink("0612345678", "Hallo!");
    expect(link).toBe("https://wa.me/31612345678?text=Hallo!");
  });

  it("geeft null als het nummer ongeldig is", () => {
    expect(buildWaLink("", "Hallo!")).toBeNull();
  });
});
