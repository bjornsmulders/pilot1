import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Tenantisolatie op de Data Access Layer (laag 1). Dit is de server-side
 * autorisatiecontrole die vóór elke Supabase-query draait -- onafhankelijk
 * van Postgres RLS (laag 2, zie supabase/migrations/20260716081524_rls_policies.sql).
 * Simuleert twee organisaties (A en B) en een gebruiker die alleen lid is van A.
 *
 * `../session` en `../errors` worden in elke test dynamisch (opnieuw)
 * geïmporteerd ná `vi.resetModules()`, zodat de `React.cache()`-memoisatie in
 * getMemberships() niet lekt tussen tests. Beide dynamische imports gebeuren
 * binnen dezelfde "verse" modulegrafiek, dus `instanceof AuthorizationError`
 * blijft kloppen -- een top-level statische import zou een andere
 * class-instantie zijn dan de instantie die session.ts intern gebruikt.
 */

const ORG_A = "11111111-1111-1111-1111-111111111111";
const ORG_B = "22222222-2222-2222-2222-222222222222";
const USER_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function makeThenable<T>(result: T) {
  const chain: Record<string, unknown> = {};
  const self = new Proxy(chain, {
    get(target, prop) {
      if (prop === "then") {
        return (resolve: (value: T) => void) => resolve(result);
      }
      return () => self;
    },
  });
  return self;
}

function mockSupabase(memberships: Array<{ organization_id: string; role: string }>) {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: USER_A } } })),
    },
    from: vi.fn(() =>
      makeThenable({
        data: memberships.map((m, index) => ({
          id: `membership-${index}`,
          organization_id: m.organization_id,
          role: m.role,
          status: "actief",
          organizations: { id: m.organization_id, name: `Org ${index}`, slug: `org-${index}` },
        })),
        error: null,
      })
    ),
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("tenantisolatie via de Data Access Layer", () => {
  it("een gebruiker met alleen lidmaatschap van organisatie A krijgt geen toegang tot organisatie B", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase([{ organization_id: ORG_A, role: "owner" }])
    );

    const { AuthorizationError } = await import("../errors");
    const { requireMembership, getMemberships } = await import("../session");

    const memberships = await getMemberships();
    expect(memberships).toHaveLength(1);
    expect(memberships[0].organizationId).toBe(ORG_A);

    await expect(requireMembership(ORG_A)).resolves.toMatchObject({ organizationId: ORG_A });
    await expect(requireMembership(ORG_B)).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("requireRole weigert een rol die niet in de toegestane lijst staat", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase([{ organization_id: ORG_A, role: "coordinator" }])
    );

    const { AuthorizationError } = await import("../errors");
    const { requireRole } = await import("../session");

    await expect(requireRole(ORG_A, ["owner", "admin"])).rejects.toBeInstanceOf(
      AuthorizationError
    );
    await expect(requireRole(ORG_A, ["coordinator"])).resolves.toMatchObject({ role: "coordinator" });
  });

  it("een gebruiker zonder enig lidmaatschap krijgt overal AuthorizationError", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase([]));

    const { AuthorizationError } = await import("../errors");
    const { requireMembership } = await import("../session");

    await expect(requireMembership(ORG_A)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(requireMembership(ORG_B)).rejects.toBeInstanceOf(AuthorizationError);
  });
});
