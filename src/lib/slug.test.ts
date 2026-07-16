import { describe, expect, it } from "vitest";

import { slugify, slugWithSuffix } from "./slug";

describe("slugify", () => {
  it("maakt een url-veilige slug van een naam met diakrieten en spaties", () => {
    expect(slugify("Stille Kracht Retreats")).toBe("stille-kracht-retreats");
    expect(slugify("Soller & Zoë's Retreat")).toBe("soller-zoe-s-retreat");
  });

  it("trimt losse koppeltekens aan begin en eind", () => {
    expect(slugify("  -- Yoga! --  ")).toBe("yoga");
  });

  it("levert altijd alleen kleine letters, cijfers en koppeltekens op", () => {
    expect(slugify("ABC 123 xyz")).toMatch(/^[a-z0-9-]+$/);
  });
});

describe("slugWithSuffix", () => {
  it("voegt een suffix toe voor unieke slugs bij naamconflicten", () => {
    expect(slugWithSuffix("Stille Kracht", "42")).toBe("stille-kracht-42");
  });
});
