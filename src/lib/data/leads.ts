import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import type { LeadRow, LeadActivityRow, LeadStatus } from "@/lib/supabase/database.types";

export interface LeadFilters {
  status?: LeadStatus;
  query?: string;
  retreatId?: string;
  followUpDueOnly?: boolean;
}

export async function listLeads(
  organizationId: string,
  filters: LeadFilters = {}
): Promise<LeadRow[]> {
  await requireMembership(organizationId);
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.retreatId) query = query.eq("retreat_id", filters.retreatId);
  if (filters.query) query = query.ilike("name", `%${filters.query}%`);
  if (filters.followUpDueOnly) {
    query = query.lte("follow_up_date", new Date().toISOString().slice(0, 10));
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getLead(
  organizationId: string,
  leadId: string
): Promise<LeadRow | null> {
  await requireMembership(organizationId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", leadId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listLeadActivities(
  organizationId: string,
  leadId: string
): Promise<LeadActivityRow[]> {
  await requireMembership(organizationId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
