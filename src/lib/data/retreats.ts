import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import type { RetreatRow, RetreatStatus } from "@/lib/supabase/database.types";

export interface RetreatListItem extends RetreatRow {
  isAssignedToMe: boolean;
}

export async function listRetreats(
  organizationId: string,
  filters: { status?: RetreatStatus; query?: string } = {}
): Promise<RetreatListItem[]> {
  const membership = await requireMembership(organizationId);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  let query = supabase
    .from("retreats")
    .select("*")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("start_date", { ascending: true });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.query) {
    query = query.ilike("title", `%${filters.query}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  let assignedRetreatIds = new Set<string>();
  if (membership.role === "coordinator" && userData.user) {
    const { data: assignments } = await supabase
      .from("retreat_team_members")
      .select("retreat_id")
      .eq("organization_id", organizationId)
      .eq("profile_id", userData.user.id);
    assignedRetreatIds = new Set((assignments ?? []).map((a) => a.retreat_id));
  }

  return (data ?? []).map((retreat) => ({
    ...retreat,
    isAssignedToMe: assignedRetreatIds.has(retreat.id),
  }));
}

export async function listRetreatOptions(
  organizationId: string
): Promise<{ id: string; title: string }[]> {
  await requireMembership(organizationId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("retreats")
    .select("id, title")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("start_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getRetreat(organizationId: string, retreatId: string) {
  await requireMembership(organizationId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("retreats")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", retreatId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Haalt een retreat op voor de openbare retreatpagina. Geen `requireMembership`
 * -- dit mag door een anonieme bezoeker aangeroepen worden. Gaat via de
 * `get_public_retreat`-RPC (zie
 * supabase/migrations/20260716150000_public_marketplace_and_org_pages.sql),
 * die zelf opnieuw controleert dat het retreat openbaar/actief is en de
 * organisatienaam/contactnummer meegeeft zonder anon brede leestoegang tot
 * `organizations` te hoeven geven.
 */
export async function getPublicRetreat(publicSlug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_retreat", {
    retreat_public_slug: publicSlug,
  });

  if (error) throw error;
  return data?.[0] ?? null;
}

/**
 * Voedt zowel de centrale ontdekpagina (/ontdek, geen filter) als de publieke
 * organisatorpagina (/o/[orgSlug], met filter). Zie ADR-0008 in
 * docs/decisions.md voor waarom dit platformbreed leesbaar is.
 */
export async function listPublicRetreats(orgSlug?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_public_retreats", {
    filter_org_slug: orgSlug ?? null,
  });

  if (error) throw error;
  return data ?? [];
}

export interface OrganizationDashboardStats {
  activeRetreats: number;
  totalCapacity: number;
  bookedSeats: number;
  occupancyRate: number;
}

export async function getOrganizationDashboardStats(
  organizationId: string
): Promise<OrganizationDashboardStats> {
  await requireMembership(organizationId);
  const supabase = await createClient();

  const { data: retreats, error } = await supabase
    .from("retreats")
    .select("id, capacity, status")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .in("status", ["inschrijving_open", "bijna_vol", "vol"]);

  if (error) throw error;

  const activeRetreats = retreats?.length ?? 0;
  const totalCapacity = (retreats ?? []).reduce((sum, r) => sum + r.capacity, 0);

  // Deelnemersaantallen komen in de deelnemers-slice; tot die tijd tonen we de
  // capaciteit en laten we bezette plaatsen expliciet op 0 staan in plaats van
  // een onjuist getal te verzinnen.
  const bookedSeats = 0;
  const occupancyRate = totalCapacity > 0 ? bookedSeats / totalCapacity : 0;

  return { activeRetreats, totalCapacity, bookedSeats, occupancyRate };
}
