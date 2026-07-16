import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import type { ReviewRow } from "@/lib/supabase/database.types";

export async function listReviews(
  organizationId: string,
  retreatId: string
): Promise<ReviewRow[]> {
  await requireMembership(organizationId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("retreat_id", retreatId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Publiek, ongeauthenticeerd -- alleen gepubliceerde reviews. */
export async function listPublicReviews(publicSlug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_public_reviews", {
    retreat_public_slug: publicSlug,
  });

  if (error) throw error;
  return data ?? [];
}
