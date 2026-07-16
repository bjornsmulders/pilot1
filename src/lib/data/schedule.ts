import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import type { ScheduleItemRow } from "@/lib/supabase/database.types";

export async function listScheduleItems(
  organizationId: string,
  retreatId: string
): Promise<ScheduleItemRow[]> {
  await requireMembership(organizationId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("retreat_id", retreatId)
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
