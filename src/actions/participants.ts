"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/errors";
import { participantSchema } from "@/lib/validation/participants";
import {
  type ActionState,
  errorState,
  fieldErrorsFromZod,
  successState,
} from "@/lib/action-state";

async function currentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function isAssignedToRetreat(retreatId: string, profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("retreat_team_members")
    .select("id")
    .eq("retreat_id", retreatId)
    .eq("profile_id", profileId)
    .maybeSingle();
  return Boolean(data);
}

function participantFromFormData(formData: FormData) {
  return participantSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    retreatId: formData.get("retreatId"),
    bookingStatus: formData.get("bookingStatus") || "optie",
    paymentStatus: formData.get("paymentStatus") || "niet_betaald",
    source: formData.get("source") ?? "",
    internalNotes: formData.get("internalNotes") ?? "",
  });
}

export async function createParticipantAction(
  organizationId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const membership = await requireMembership(organizationId);
  const parsed = participantFromFormData(formData);
  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  const userId = await currentUserId();
  let allowed = membership.role === "owner" || membership.role === "admin";
  if (!allowed && membership.role === "coordinator" && userId) {
    allowed = await isAssignedToRetreat(parsed.data.retreatId, userId);
  }
  if (!allowed) {
    throw new AuthorizationError("Je hebt geen toegang om deelnemers toe te voegen.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participants")
    .insert({
      organization_id: organizationId,
      retreat_id: parsed.data.retreatId,
      full_name: parsed.data.fullName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      booking_status: parsed.data.bookingStatus,
      payment_status: parsed.data.paymentStatus,
      source: parsed.data.source || null,
      internal_notes: parsed.data.internalNotes || null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return errorState(
      error?.message.includes("participants_retreat_email_unique_idx")
        ? "Er bestaat al een deelnemer met dit e-mailadres voor dit retreat."
        : "Deelnemer aanmaken is mislukt. Probeer het opnieuw."
    );
  }

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: userId,
    action: "deelnemer.aangemaakt",
    entity_type: "participant",
    entity_id: data.id,
    metadata: { naam: parsed.data.fullName },
  });

  revalidatePath("/deelnemers");
  redirect(`/deelnemers/${data.id}`);
}

export async function updateParticipantAction(
  organizationId: string,
  participantId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const membership = await requireMembership(organizationId);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("participants")
    .select("retreat_id")
    .eq("id", participantId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) {
    return errorState("Deelnemer niet gevonden.");
  }

  const userId = await currentUserId();
  let allowed = membership.role === "owner" || membership.role === "admin";
  if (!allowed && membership.role === "coordinator" && userId) {
    allowed = await isAssignedToRetreat(existing.retreat_id, userId);
  }
  if (!allowed) {
    throw new AuthorizationError("Je hebt geen toegang om deze deelnemer te wijzigen.");
  }

  const parsed = participantFromFormData(formData);
  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  // Verplaatsen naar een ander retreat mag alleen als je ook op het nieuwe
  // retreat mag schrijven (coordinator-scoping geldt aan beide kanten).
  if (parsed.data.retreatId !== existing.retreat_id) {
    let allowedForTarget = membership.role === "owner" || membership.role === "admin";
    if (!allowedForTarget && membership.role === "coordinator" && userId) {
      allowedForTarget = await isAssignedToRetreat(parsed.data.retreatId, userId);
    }
    if (!allowedForTarget) {
      return errorState("Je hebt geen toegang tot het retreat waar je naartoe wilt verplaatsen.");
    }
  }

  const { error } = await supabase
    .from("participants")
    .update({
      retreat_id: parsed.data.retreatId,
      full_name: parsed.data.fullName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      booking_status: parsed.data.bookingStatus,
      payment_status: parsed.data.paymentStatus,
      source: parsed.data.source || null,
      internal_notes: parsed.data.internalNotes || null,
    })
    .eq("id", participantId);

  if (error) {
    return errorState(
      error.message.includes("participants_retreat_email_unique_idx")
        ? "Er bestaat al een deelnemer met dit e-mailadres voor dit retreat."
        : "Deelnemer bijwerken is mislukt. Probeer het opnieuw."
    );
  }

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: userId,
    action: "deelnemer.gewijzigd",
    entity_type: "participant",
    entity_id: participantId,
    metadata: { booking_status: parsed.data.bookingStatus },
  });

  revalidatePath("/deelnemers");
  revalidatePath(`/deelnemers/${participantId}`);
  return successState("Deelnemer bijgewerkt.");
}
