import { describe, expect, it } from "vitest";

import { generateToken, hashToken } from "./tokens";

describe("generateToken", () => {
  it("genereert een uniek token en de bijbehorende sha-256 hash", () => {
    const a = generateToken();
    const b = generateToken();

    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
    expect(a.tokenHash).toBe(hashToken(a.token));
  });

  it("levert een URL-veilig token op (geen +, / of = tekens)", () => {
    const { token } = generateToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("hashToken is deterministisch", () => {
    expect(hashToken("vast-token")).toBe(hashToken("vast-token"));
    expect(hashToken("vast-token")).not.toBe(hashToken("ander-token"));
  });

  it("de hash is nooit gelijk aan het plaintext token", () => {
    const { token, tokenHash } = generateToken();
    expect(tokenHash).not.toBe(token);
    expect(tokenHash).toHaveLength(64); // hex-encoded sha-256
  });
});
