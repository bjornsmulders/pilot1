"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import { canManageRetreat } from "@/lib/auth/permissions";
import { AuthorizationError } from "@/lib/auth/errors";
import { announcementSchema } from "@/lib/validation/announcements";
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

export async function createAnnouncementAction(
  organizationId: string,
  retreatId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const membership = await requireMembership(organizationId);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  await assertCanManageRetreat(organizationId, retreatId, membership.role, userData.user?.id ?? null);

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    visibleToParticipants: formData.get("visibleToParticipants") === "on",
  });
  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  const { error } = await supabase.from("announcements").insert({
    organization_id: organizationId,
    retreat_id: retreatId,
    title: parsed.data.title,
    body: parsed.data.body,
    visible_to_participants: parsed.data.visibleToParticipants,
    created_by: userData.user?.id ?? null,
  });

  if (error) {
    return errorState("Mededeling toevoegen is mislukt.");
  }

  revalidatePath(`/retreats/${retreatId}/mededelingen`);
  return successState("Mededeling geplaatst.");
}

export async function deleteAnnouncementAction(
  organizationId: string,
  retreatId: string,
  announcementId: string
): Promise<void> {
  const membership = await requireMembership(organizationId);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  await assertCanManageRetreat(organizationId, retreatId, membership.role, userData.user?.id ?? null);

  await supabase
    .from("announcements")
    .delete()
    .eq("id", announcementId)
    .eq("organization_id", organizationId);

  revalidatePath(`/retreats/${retreatId}/mededelingen`);
}
