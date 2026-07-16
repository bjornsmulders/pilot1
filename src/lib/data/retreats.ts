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
