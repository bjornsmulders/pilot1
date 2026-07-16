import "server-only";
import { randomBytes, createHash } from "node:crypto";

/**
 * Genereert een willekeurig, URL-veilig token en de bijbehorende sha-256 hash.
 * Alleen de hash wordt ooit opgeslagen (invitations.token_hash,
 * participant_invites.token_hash) — het plaintext token bestaat alleen in het
 * response-object van deze functie, om direct in een e-mail/WhatsApp-link te
 * zetten. Zie docs/security.md.
 */
export function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
