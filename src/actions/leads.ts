"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/errors";
import { leadSchema, leadActivitySchema, publicLeadSchema } from "@/lib/validation/leads";
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

function leadFromFormData(formData: FormData) {
  return leadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    retreatId: formData.get("retreatId") ?? "",
    source: formData.get("source") ?? "",
    desiredPeriod: formData.get("desiredPeriod") ?? "",
    destination: formData.get("destination") ?? "",
    budgetRange: formData.get("budgetRange") ?? "",
    partySize: formData.get("partySize") || "",
    whatsappConsent: formData.get("whatsappConsent") === "on",
    marketingConsent: formData.get("marketingConsent") === "on",
    platformMatchingConsent: formData.get("platformMatchingConsent") === "on",
    status: formData.get("status") || "nieuw",
    followUpDate: formData.get("followUpDate") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

export async function createLeadAction(
  organizationId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const membership = await requireMembership(organizationId);
  const parsed = leadFromFormData(formData);
  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  const userId = await currentUserId();
  let allowed = membership.role === "owner" || membership.role === "admin";
  if (!allowed && parsed.data.retreatId && membership.role === "coordinator" && userId) {
    allowed = await isAssignedToRetreat(parsed.data.retreatId, userId);
  }
  if (!allowed) {
    throw new AuthorizationError("Je hebt geen toegang om leads aan te maken.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      organization_id: organizationId,
      retreat_id: parsed.data.retreatId || null,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      source: parsed.data.source || null,
      desired_period: parsed.data.desiredPeriod || null,
      destination: parsed.data.destination || null,
      budget_range: parsed.data.budgetRange || null,
      party_size: parsed.data.partySize || null,
      whatsapp_consent: parsed.data.whatsappConsent,
      marketing_consent: parsed.data.marketingConsent,
      platform_matching_consent: parsed.data.platformMatchingConsent,
      status: parsed.data.status,
      follow_up_date: parsed.data.followUpDate || null,
      notes: parsed.data.notes || null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return errorState("Lead aanmaken is mislukt. Probeer het opnieuw.");
  }

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: userId,
    action: "lead.aangemaakt",
    entity_type: "lead",
    entity_id: data.id,
    metadata: { naam: parsed.data.name },
  });

  revalidatePath("/leads");
  redirect(`/leads/${data.id}`);
}

export async function updateLeadAction(
  organizationId: string,
  leadId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const membership = await requireMembership(organizationId);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("leads")
    .select("retreat_id")
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) {
    return errorState("Lead niet gevonden.");
  }

  const userId = await currentUserId();
  let allowed = membership.role === "owner" || membership.role === "admin";
  if (!allowed && existing.retreat_id && membership.role === "coordinator" && userId) {
    allowed = await isAssignedToRetreat(existing.retreat_id, userId);
  }
  if (!allowed) {
    throw new AuthorizationError("Je hebt geen toegang om deze lead te wijzigen.");
  }

  const parsed = leadFromFormData(formData);
  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  const { error } = await supabase
    .from("leads")
    .update({
      retreat_id: parsed.data.retreatId || null,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      source: parsed.data.source || null,
      desired_period: parsed.data.desiredPeriod || null,
      destination: parsed.data.destination || null,
      budget_range: parsed.data.budgetRange || null,
      party_size: parsed.data.partySize || null,
      whatsapp_consent: parsed.data.whatsappConsent,
      marketing_consent: parsed.data.marketingConsent,
      platform_matching_consent: parsed.data.platformMatchingConsent,
      status: parsed.data.status,
      follow_up_date: parsed.data.followUpDate || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", leadId);

  if (error) {
    return errorState("Lead bijwerken is mislukt. Probeer het opnieuw.");
  }

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: userId,
    action: "lead.gewijzigd",
    entity_type: "lead",
    entity_id: leadId,
    metadata: { status: parsed.data.status },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return successState("Lead bijgewerkt.");
}

export async function addLeadActivityAction(
  organizationId: string,
  leadId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const membership = await requireMembership(organizationId);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("leads")
    .select("retreat_id, score")
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) {
    return errorState("Lead niet gevonden.");
  }

  const userId = await currentUserId();
  let allowed = membership.role === "owner" || membership.role === "admin";
  if (!allowed && existing.retreat_id && membership.role === "coordinator" && userId) {
    allowed = await isAssignedToRetreat(existing.retreat_id, userId);
  }
  if (!allowed) {
    throw new AuthorizationError("Je hebt geen toegang om deze lead te wijzigen.");
  }

  const parsed = leadActivitySchema.safeParse({
    activityType: formData.get("activityType"),
    description: formData.get("description") ?? "",
    scoreDelta: formData.get("scoreDelta") || 0,
  });
  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  const { error: activityError } = await supabase.from("lead_activities").insert({
    lead_id: leadId,
    organization_id: organizationId,
    activity_type: parsed.data.activityType,
    description: parsed.data.description || null,
    score_delta: parsed.data.scoreDelta,
    created_by: userId,
  });

  if (activityError) {
    return errorState("Activiteit toevoegen is mislukt.");
  }

  if (parsed.data.scoreDelta !== 0) {
    await supabase
      .from("leads")
      .update({ score: existing.score + parsed.data.scoreDelta })
      .eq("id", leadId);
  }

  revalidatePath(`/leads/${leadId}`);
  return successState("Activiteit toegevoegd.");
}

export async function convertLeadToParticipantAction(
  organizationId: string,
  leadId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const membership = await requireMembership(organizationId);
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!lead) {
    return errorState("Lead niet gevonden.");
  }

  const retreatId = (formData.get("retreatId") as string) || lead.retreat_id;
  if (!retreatId) {
    return errorState("Kies een retreat om deze lead naar om te zetten.");
  }

  const userId = await currentUserId();
  let allowed = membership.role === "owner" || membership.role === "admin";
  if (!allowed && membership.role === "coordinator" && userId) {
    allowed = await isAssignedToRetreat(retreatId, userId);
  }
  if (!allowed) {
    throw new AuthorizationError("Je hebt geen toegang om deze lead om te zetten.");
  }

  const { data: participant, error } = await supabase
    .from("participants")
    .insert({
      organization_id: organizationId,
      retreat_id: retreatId,
      lead_id: leadId,
      full_name: lead.name,
      email: lead.email,
      phone: lead.phone,
      booking_status: "optie",
      payment_status: "niet_betaald",
      source: lead.source ?? "lead",
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !participant) {
    return errorState(
      error?.message.includes("participants_retreat_email_unique_idx")
        ? "Er bestaat al een deelnemer met dit e-mailadres voor dit retreat."
        : "Omzetten naar deelnemer is mislukt."
    );
  }

  await supabase
    .from("leads")
    .update({ status: "geboekt", converted_participant_id: participant.id })
    .eq("id", leadId);

  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    organization_id: organizationId,
    activity_type: "omgezet_naar_deelnemer",
    description: "Lead omgezet naar deelnemer.",
    score_delta: 0,
    created_by: userId,
  });

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: userId,
    action: "lead.omgezet_naar_deelnemer",
    entity_type: "lead",
    entity_id: leadId,
    metadata: { participant_id: participant.id },
  });

  revalidatePath("/leads");
  revalidatePath("/deelnemers");
  redirect(`/deelnemers/${participant.id}`);
}

/**
 * Enige server action die géén membership vereist -- dit is de handler achter
 * het openbare interesseformulier op /retreat/[publicSlug]. Autorisatie loopt
 * hier niet via requireMembership/RLS-tenant-scoping, maar via de
 * `submit_public_lead` SECURITY DEFINER-functie, die zelf opnieuw valideert
 * dat het retreat bestaat en openbaar is (zie de migratie
 * 20260716123526_public_retreat_pages_and_consent_type.sql).
 */
export async function submitPublicLeadAction(
  publicSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = publicLeadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    desiredPeriod: formData.get("desiredPeriod") ?? "",
    message: formData.get("message") ?? "",
    whatsappConsent: formData.get("whatsappConsent") === "on",
    marketingConsent: formData.get("marketingConsent") === "on",
    platformMatchingConsent: formData.get("platformMatchingConsent") === "on",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  // Honeypot: een bot vult dit onzichtbare veld meestal wel in. Doe alsof het
  // gelukt is, maar sla niets op.
  if (parsed.data.website) {
    return successState("Bedankt voor je interesse! We nemen snel contact op.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_public_lead", {
    retreat_public_slug: publicSlug,
    lead_name: parsed.data.name,
    lead_email: parsed.data.email,
    lead_phone: parsed.data.phone || null,
    lead_desired_period: parsed.data.desiredPeriod || null,
    lead_message: parsed.data.message || null,
    lead_whatsapp_consent: parsed.data.whatsappConsent,
    lead_marketing_consent: parsed.data.marketingConsent,
    lead_platform_matching_consent: parsed.data.platformMatchingConsent,
  });

  if (error) {
    return errorState(
      "Aanmelden is niet gelukt. Controleer of dit retreat nog open staat voor inschrijving, of probeer het later opnieuw."
    );
  }

  return successState("Bedankt voor je interesse! We nemen zo snel mogelijk contact op.");
}
