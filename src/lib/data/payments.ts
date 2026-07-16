import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import type { PaymentRow } from "@/lib/supabase/database.types";

export async function listPayments(
  organizationId: string,
  participantId: string
): Promise<PaymentRow[]> {
  await requireMembership(organizationId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
