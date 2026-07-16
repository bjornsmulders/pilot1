"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { type ActionState, errorState, successState } from "@/lib/action-state";

export async function introduceLeadToRetreatAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePlatformAdmin();

  const sourceLeadId = formData.get("sourceLeadId") as string;
  const targetRetreatId = formData.get("targetRetreatId") as string;

  if (!sourceLeadId || !targetRetreatId) {
    return errorState("Kies een retreat om naar te introduceren.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("introduce_lead_to_retreat", {
    source_lead_id: sourceLeadId,
    target_retreat_id: targetRetreatId,
  });

  if (error) {
    return errorState(error.message || "Introductie is mislukt.");
  }

  revalidatePath("/platform/laatste-kans");
  return successState("Geïntroduceerd -- de organisator ziet deze lead nu in zijn eigen leads-overzicht.");
}
