import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import type { AnnouncementRow } from "@/lib/supabase/database.types";

export async function listAnnouncements(
  organizationId: string,
  retreatId: string
): Promise<AnnouncementRow[]> {
  await requireMembership(organizationId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("retreat_id", retreatId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
