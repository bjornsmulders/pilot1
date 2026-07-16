"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import { canManageRetreat } from "@/lib/auth/permissions";
import { AuthorizationError } from "@/lib/auth/errors";
import { scheduleItemSchema } from "@/lib/validation/schedule";
import {
  type ActionState,
  errorState,
  fieldErrorsFromZod,
  successState,
} from "@/lib/action-state";

async function assertCanManageRetreat(
  organizationId: string,
  retreatId: string,
  role: string,
  profileId: string | null
) {
  if (role === "owner" || role === "admin") return;
  let isAssigned = false;
  if (role === "coordinator" && profileId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("retreat_team_members")
      .select("id")
      .eq("retreat_id", retreatId)
      .eq("profile_id", profileId)
      .maybeSingle();
    isAssigned = Boolean(data);
  }
  if (!canManageRetreat(role as "owner" | "admin" | "coordinator" | "viewer", isAssigned)) {
    throw new AuthorizationError("Je hebt geen toegang om dit retreat te beheren.");
  }
}

function scheduleItemFromFormData(formData: FormData) {
  return scheduleItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    startsAt: formData.get("startsAt") ?? "",
    endsAt: formData.get("endsAt") ?? "",
    location: formData.get("location") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
  });
}

export async function createScheduleItemAction(
  organizationId: string,
  retreatId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const membership = await requireMembership(organizationId);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  await assertCanManageRetreat(organizationId, retreatId, membership.role, userData.user?.id ?? null);

  const parsed = scheduleItemFromFormData(formData);
  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  const { error } = await supabase.from("schedule_items").insert({
    organization_id: organizationId,
    retreat_id: retreatId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    starts_at: parsed.data.startsAt || null,
    ends_at: parsed.data.endsAt || null,
    location: parsed.data.location || null,
    sort_order: parsed.data.sortOrder,
    created_by: userData.user?.id ?? null,
  });

  if (error) {
    return errorState("Programmaonderdeel toevoegen is mislukt.");
  }

  revalidatePath(`/retreats/${retreatId}/programma`);
  return successState("Programmaonderdeel toegevoegd.");
}

export async function deleteScheduleItemAction(
  organizationId: string,
  retreatId: string,
  scheduleItemId: string
): Promise<void> {
  const membership = await requireMembership(organizationId);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  await assertCanManageRetreat(organizationId, retreatId, membership.role, userData.user?.id ?? null);

  await supabase
    .from("schedule_items")
    .delete()
    .eq("id", scheduleItemId)
    .eq("organization_id", organizationId);

  revalidatePath(`/retreats/${retreatId}/programma`);
}
