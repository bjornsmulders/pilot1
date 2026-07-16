import { describe, expect, it } from "vitest";

import { registerSchema, loginSchema } from "./auth";

describe("registerSchema", () => {
  const base = {
    fullName: "Elena de Groot",
    email: "elena@stillekracht.nl",
    password: "Welkom123",
    passwordConfirmation: "Welkom123",
  };

  it("accepteert geldige registratiegegevens", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it("weigert wachtwoorden die niet overeenkomen", () => {
    const result = registerSchema.safeParse({
      ...base,
      passwordConfirmation: "Anders123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.passwordConfirmation).toBeTruthy();
    }
  });

  it("weigert een te kort wachtwoord", () => {
    const result = registerSchema.safeParse({
      ...base,
      password: "kort1",
      passwordConfirmation: "kort1",
    });
    expect(result.success).toBe(false);
  });

  it("weigert een ongeldig e-mailadres", () => {
    const result = registerSchema.safeParse({ ...base, email: "geen-email" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("weigert een leeg wachtwoord", () => {
    const result = loginSchema.safeParse({ email: "a@b.nl", password: "" });
    expect(result.success).toBe(false);
  });
});
