"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import { canManageRetreat } from "@/lib/auth/permissions";
import { AuthorizationError } from "@/lib/auth/errors";
import { publicReviewSchema } from "@/lib/validation/reviews";
import {
  type ActionState,
  errorState,
  fieldErrorsFromZod,
  successState,
} from "@/lib/action-state";

/**
 * Enige weg voor een anonieme bezoeker om een review in te dienen -- geen
 * requireMembership, zelfde honeypot-patroon als submitPublicLeadAction. De
 * review is na indienen nog niet zichtbaar; een staflid publiceert 'm pas via
 * setReviewPublishedAction hieronder (zie de reviews-migratie).
 */
export async function submitPublicReviewAction(
  publicSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = publicReviewSchema.safeParse({
    authorName: formData.get("authorName"),
    rating: formData.get("rating"),
    body: formData.get("body") ?? "",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  if (parsed.data.website) {
    return successState("Bedankt voor je review!");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_public_review", {
    retreat_public_slug: publicSlug,
    author_name: parsed.data.authorName,
    rating: parsed.data.rating,
    body: parsed.data.body || null,
  });

  if (error) {
    return errorState("Review indienen is niet gelukt. Probeer het later opnieuw.");
  }

  return successState("Bedankt voor je review! Deze verschijnt na goedkeuring op de retreatpagina.");
}

export async function setReviewPublishedAction(
  organizationId: string,
  retreatId: string,
  reviewId: string,
  isPublished: boolean
): Promise<void> {
  const membership = await requireMembership(organizationId);
  const supabase = await createClient();

  let canManage = membership.role === "owner" || membership.role === "admin";
  if (!canManage && membership.role === "coordinator") {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data } = await supabase
        .from("retreat_team_members")
        .select("id")
        .eq("retreat_id", retreatId)
        .eq("profile_id", userData.user.id)
        .maybeSingle();
      canManage = canManageRetreat(membership.role, Boolean(data));
    }
  }
  if (!canManage) {
    throw new AuthorizationError("Je hebt geen toegang om reviews van dit retreat te beheren.");
  }

  const { data: userData } = await supabase.auth.getUser();
  await supabase
    .from("reviews")
    .update({
      is_published: isPublished,
      moderated_by: userData.user?.id ?? null,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("organization_id", organizationId);

  revalidatePath(`/retreats/${retreatId}/reviews`);
}
