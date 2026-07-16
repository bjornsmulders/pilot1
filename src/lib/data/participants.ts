import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import type { ParticipantRow, BookingStatus } from "@/lib/supabase/database.types";

export interface ParticipantFilters {
  bookingStatus?: BookingStatus;
  query?: string;
  retreatId?: string;
}

export async function listParticipants(
  organizationId: string,
  filters: ParticipantFilters = {}
): Promise<ParticipantRow[]> {
  await requireMembership(organizationId);
  const supabase = await createClient();

  let query = supabase
    .from("participants")
    .select("*")
    .eq("organization_id", organizationId)
    .is("anonymized_at", null)
    .order("created_at", { ascending: false });

  if (filters.bookingStatus) query = query.eq("booking_status", filters.bookingStatus);
  if (filters.retreatId) query = query.eq("retreat_id", filters.retreatId);
  if (filters.query) query = query.ilike("full_name", `%${filters.query}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getParticipant(
  organizationId: string,
  participantId: string
): Promise<ParticipantRow | null> {
  await requireMembership(organizationId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", participantId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
