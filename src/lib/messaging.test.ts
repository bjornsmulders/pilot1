import { describe, expect, it } from "vitest";

import { renderTemplate } from "./messaging";

describe("renderTemplate", () => {
  it("vervangt bekende variabelen", () => {
    const result = renderTemplate("Hoi {{voornaam}}, welkom bij {{retreat}}!", {
      voornaam: "Sanne",
      retreat: "Mallorca retreat",
    });
    expect(result).toBe("Hoi Sanne, welkom bij Mallorca retreat!");
  });

  it("laat onbekende variabelen letterlijk staan", () => {
    const result = renderTemplate("Hoi {{voornaam}}, je link: {{onboarding_link}}", {
      voornaam: "Sanne",
    });
    expect(result).toBe("Hoi Sanne, je link: {{onboarding_link}}");
  });

  it("werkt zonder variabelen in de tekst", () => {
    const result = renderTemplate("Gewoon een bericht.", {});
    expect(result).toBe("Gewoon een bericht.");
  });
});
