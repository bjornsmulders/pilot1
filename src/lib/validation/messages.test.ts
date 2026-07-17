import { describe, expect, it } from "vitest";

import { messageTemplateSchema } from "./messages";

describe("messageTemplateSchema", () => {
  it("accepteert een geldige template", () => {
    const result = messageTemplateSchema.safeParse({
      key: "welkom",
      name: "Welkomstbericht",
      channel: "whatsapp",
      body: "Hoi {{voornaam}}, welkom bij {{retreat}}!",
    });
    expect(result.success).toBe(true);
  });

  it("weigert een sleutel met hoofdletters/spaties", () => {
    const result = messageTemplateSchema.safeParse({
      key: "Welkom Bericht",
      name: "Welkomstbericht",
      body: "Tekst",
    });
    expect(result.success).toBe(false);
  });

  it("valt terug op whatsapp als er geen kanaal is meegegeven", () => {
    const result = messageTemplateSchema.safeParse({
      key: "welkom",
      name: "Welkomstbericht",
      body: "Tekst",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.channel).toBe("whatsapp");
    }
  });
});
