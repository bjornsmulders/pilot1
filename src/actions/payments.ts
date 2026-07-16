"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { manualPaymentSchema } from "@/lib/validation/payments";
import {
  type ActionState,
  errorState,
  fieldErrorsFromZod,
  successState,
} from "@/lib/action-state";

/**
 * Registreert een betaling die de organisator buiten JourneyOS om heeft
 * ontvangen (bank, contant, ...) -- er is nog geen live Mollie-koppeling (zie
 * docs/decisions.md). `provider` staat daarom altijd op 'handmatig'. Alleen
 * owner/admin mogen dit (zelfde als de payments_write RLS-policy, geen
 * coordinator-uitzondering -- zie ADR-0005).
 */
export async function registerManualPaymentAction(
  organizationId: string,
  participantId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(organizationId, ["owner", "admin"]);

  const parsed = manualPaymentSchema.safeParse({
    type: formData.get("type") || "aanbetaling",
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  const supabase = await createClient();
  const { data: participant } = await supabase
    .from("participants")
    .select("id, retreat_id, payment_status")
    .eq("id", participantId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!participant) {
    return errorState("Deelnemer niet gevonden.");
  }

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("payments").insert({
    organization_id: organizationId,
    participant_id: participantId,
    retreat_id: participant.retreat_id,
    type: parsed.data.type,
    amount: parsed.data.amount,
    currency: "EUR",
    status: "betaald",
    provider: "handmatig",
    paid_at: new Date().toISOString(),
    created_by: userData.user?.id ?? null,
  });

  if (error) {
    return errorState("Betaling registreren is mislukt. Probeer het opnieuw.");
  }

  // Betaalstatus van de deelnemer bijwerken: een volledige betaling zet 'm
  // altijd op betaald; een aanbetaling alleen als er nog niets betaald was
  // geregistreerd (nooit een bestaande 'betaald'-status downgraden).
  if (parsed.data.type === "volledige_betaling") {
    await supabase
      .from("participants")
      .update({ payment_status: "betaald" })
      .eq("id", participantId);
  } else if (parsed.data.type === "aanbetaling" && participant.payment_status === "niet_betaald") {
    await supabase
      .from("participants")
      .update({ payment_status: "gedeeltelijk_betaald" })
      .eq("id", participantId);
  }

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: userData.user?.id ?? null,
    action: "betaling.handmatig_geregistreerd",
    entity_type: "payment",
    entity_id: participantId,
    metadata: { bedrag: parsed.data.amount, type: parsed.data.type },
  });

  revalidatePath(`/deelnemers/${participantId}`);
  return successState("Betaling geregistreerd.");
}
