import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";

/**
 * Platformbrede "laatste kans"-matching (zie ADR-0007 in docs/decisions.md en
 * supabase/migrations/20260716123500_platform_matching.sql). Deze functies
 * lezen doelbewust over organisatiegrenzen heen -- dat mag alleen via de
 * SECURITY DEFINER RPC's, die zelf opnieuw `is_platform_admin()` controleren.
 * De `requirePlatformAdmin()`-check hier is de eerste (server-side) laag; de
 * RPC's zijn de tweede.
 */

export async function listMatchingCandidates() {
  await requirePlatformAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_platform_matching_candidates");
  if (error) throw error;
  return data ?? [];
}

export async function listMatchingRetreats() {
  await requirePlatformAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_platform_matching_retreats");
  if (error) throw error;
  return data ?? [];
}

export async function getPlatformOverviewStats() {
  await requirePlatformAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("platform_overview_stats");
  if (error) throw error;
  return data?.[0] ?? null;
}
