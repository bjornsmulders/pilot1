"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole, requireMembership } from "@/lib/auth/session";
import { canManageRetreat } from "@/lib/auth/permissions";
import { messageTemplateSchema } from "@/lib/validation/messages";
import {
  type ActionState,
  errorState,
  fieldErrorsFromZod,
  successState,
} from "@/lib/action-state";

function templateFromFormData(formData: FormData) {
  return messageTemplateSchema.safeParse({
    key: formData.get("key"),
    name: formData.get("name"),
    channel: formData.get("channel") || "whatsapp",
    body: formData.get("body"),
  });
}

export async function createMessageTemplateAction(
  organizationId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(organizationId, ["owner", "admin"]);

  const parsed = templateFromFormData(formData);
  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("message_templates").insert({
    organization_id: organizationId,
    key: parsed.data.key,
    name: parsed.data.name,
    channel: parsed.data.channel,
    body: parsed.data.body,
    created_by: userData.user?.id ?? null,
  });

  if (error) {
    return errorState(
      error.message.includes("message_templates_organization_id_key_key")
        ? "Er bestaat al een template met deze sleutel."
        : "Template aanmaken is mislukt."
    );
  }

  revalidatePath("/instellingen/berichten");
  return successState("Template aangemaakt.");
}

export async function updateMessageTemplateAction(
  organizationId: string,
  templateId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(organizationId, ["owner", "admin"]);

  const parsed = templateFromFormData(formData);
  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("message_templates")
    .update({
      key: parsed.data.key,
      name: parsed.data.name,
      channel: parsed.data.channel,
      body: parsed.data.body,
    })
    .eq("id", templateId)
    .eq("organization_id", organizationId);

  if (error) {
    return errorState("Template bijwerken is mislukt.");
  }

  revalidatePath("/instellingen/berichten");
  return successState("Template bijgewerkt.");
}

export async function deleteMessageTemplateAction(
  organizationId: string,
  templateId: string
): Promise<void> {
  await requireRole(organizationId, ["owner", "admin"]);

  const supabase = await createClient();
  await supabase
    .from("message_templates")
    .delete()
    .eq("id", templateId)
    .eq("organization_id", organizationId);

  revalidatePath("/instellingen/berichten");
}

/**
 * Registreert dat een organisator een voorbereid WhatsApp-bericht heeft
 * geopend voor een lead/deelnemer (handmatige statusregistratie, zie
 * docs/whatsapp-strategy.md). Bewust géén ActionState/useActionState-vorm --
 * wordt rechtstreeks aangeroepen vanuit een onClick in MessageComposer, niet
 * via een <form>.
 *
 * Autorisatie is hier bewust strenger dan de RLS-ondergrens
 * (message_deliveries_write staat elk orglid toe): mirrort de matrix in
 * docs/security.md (owner/admin altijd, coordinator alleen eigen toegewezen
 * retreat, viewer nooit).
 */
export async function logMessageDeliveryAction(
  organizationId: string,
  target: { type: "lead" | "participant"; id: string },
  templateId: string,
  renderedPreview: string
): Promise<{ ok: boolean; error?: string }> {
  const membership = await requireMembership(organizationId);
  const supabase = await createClient();

  const table = target.type === "lead" ? "leads" : "participants";
  const { data: entity } = await supabase
    .from(table)
    .select("retreat_id")
    .eq("id", target.id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!entity) {
    return { ok: false, error: `${target.type === "lead" ? "Lead" : "Deelnemer"} niet gevonden.` };
  }

  let allowed = membership.role === "owner" || membership.role === "admin";
  if (!allowed && membership.role === "coordinator" && entity.retreat_id) {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: assignment } = await supabase
        .from("retreat_team_members")
        .select("id")
        .eq("retreat_id", entity.retreat_id)
        .eq("profile_id", userData.user.id)
        .maybeSingle();
      allowed = canManageRetreat(membership.role, Boolean(assignment));
    }
  }
  if (!allowed) {
    return { ok: false, error: "Je hebt geen toegang om dit bericht te versturen." };
  }

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("message_deliveries").insert({
    organization_id: organizationId,
    participant_id: target.type === "participant" ? target.id : null,
    lead_id: target.type === "lead" ? target.id : null,
    template_id: templateId,
    channel: "whatsapp_link",
    rendered_preview: renderedPreview.slice(0, 500),
    status: "geopend_in_whatsapp",
    sent_by: userData.user?.id ?? null,
  });

  if (error) {
    return { ok: false, error: "Registreren is niet gelukt." };
  }

  revalidatePath(target.type === "lead" ? `/leads/${target.id}` : `/deelnemers/${target.id}`);
  return { ok: true };
}
