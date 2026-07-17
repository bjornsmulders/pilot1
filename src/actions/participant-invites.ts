"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import { canManageRetreat } from "@/lib/auth/permissions";
import { AuthorizationError } from "@/lib/auth/errors";
import { generateToken } from "@/lib/tokens";
import { type ActionState, errorState, successState } from "@/lib/action-state";

const ONBOARDING_INVITE_EXPIRY_DAYS = 180;

/**
 * Genereert een onboardinglink voor een deelnemer -- zelfde patroon als
 * inviteMemberAction (teamuitnodigingen), maar dan voor het token-gebaseerde
 * self-service-pad uit ADR-0002 (deelnemers loggen niet in).
 */
export async function issueParticipantInviteAction(
  organizationId: string,
  participantId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- vereist door useActionState's actie-signatuur
  _prevState: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- vereist door useActionState's actie-signatuur
  _formData: FormData
): Promise<ActionState> {
  const membership = await requireMembership(organizationId);
  const supabase = await createClient();

  const { data: participant } = await supabase
    .from("participants")
    .select("id, retreat_id, full_name")
    .eq("id", participantId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!participant) {
    return errorState("Deelnemer niet gevonden.");
  }

  let canManage = membership.role === "owner" || membership.role === "admin";
  if (!canManage && membership.role === "coordinator") {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: assignment } = await supabase
        .from("retreat_team_members")
        .select("id")
        .eq("retreat_id", participant.retreat_id)
        .eq("profile_id", userData.user.id)
        .maybeSingle();
      canManage = canManageRetreat(membership.role, Boolean(assignment));
    }
  }
  if (!canManage) {
    throw new AuthorizationError("Je hebt geen toegang om een onboardinglink te versturen.");
  }

  const { token, tokenHash } = generateToken();
  const expiresAt = new Date(
    Date.now() + ONBOARDING_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("participant_invites").insert({
    participant_id: participantId,
    organization_id: organizationId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    issued_by: userData.user?.id ?? null,
  });

  if (error) {
    return errorState("Onboardinglink aanmaken is mislukt. Probeer het opnieuw.");
  }

  await supabase
    .from("participants")
    .update({ invitation_status: "verzonden" })
    .eq("id", participantId);

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: userData.user?.id ?? null,
    action: "deelnemer.onboardinglink_aangemaakt",
    entity_type: "participant",
    entity_id: participantId,
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/deelnemer/${token}`;

  revalidatePath(`/deelnemers/${participantId}`);
  return successState(inviteUrl);
}
