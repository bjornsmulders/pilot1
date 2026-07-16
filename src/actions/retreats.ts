"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole, requireMembership } from "@/lib/auth/session";
import { canManageRetreat } from "@/lib/auth/permissions";
import { AuthorizationError } from "@/lib/auth/errors";
import { retreatSchema } from "@/lib/validation/retreats";
import { slugWithSuffix } from "@/lib/slug";
import {
  type ActionState,
  errorState,
  fieldErrorsFromZod,
  successState,
} from "@/lib/action-state";

function retreatFromFormData(formData: FormData) {
  return retreatSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    location: formData.get("location") ?? "",
    country: formData.get("country") ?? "",
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    capacity: formData.get("capacity"),
    pricePerPerson: formData.get("pricePerPerson"),
    status: formData.get("status") || "concept",
    enrollmentVisibility: formData.get("enrollmentVisibility") || "besloten",
    bookingDeadline: formData.get("bookingDeadline") ?? "",
    internalNotes: formData.get("internalNotes") ?? "",
    coverImageUrl: formData.get("coverImageUrl") ?? "",
    galleryImageUrls: formData.get("galleryImageUrls") ?? "",
    extraInfo: formData.get("extraInfo") ?? "",
  });
}

function newPublicSlug(title: string) {
  return slugWithSuffix(title, Math.random().toString(36).slice(2, 8));
}

function metadataFromParsed(data: { galleryImageUrls?: string; extraInfo?: string }) {
  const galleryImageUrls = (data.galleryImageUrls ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    gallery_image_urls: galleryImageUrls,
    extra_info: data.extraInfo || null,
  };
}

export async function createRetreatAction(
  organizationId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(organizationId, ["owner", "admin"]);

  const parsed = retreatFromFormData(formData);
  if (!parsed.success) {
    return errorState(
      "Controleer de gemarkeerde velden.",
      fieldErrorsFromZod(parsed.error)
    );
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("retreats")
    .insert({
      organization_id: organizationId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      country: parsed.data.country || null,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      capacity: parsed.data.capacity,
      price_per_person: parsed.data.pricePerPerson,
      status: parsed.data.status,
      enrollment_visibility: parsed.data.enrollmentVisibility,
      booking_deadline: parsed.data.bookingDeadline || null,
      internal_notes: parsed.data.internalNotes || null,
      cover_image_url: parsed.data.coverImageUrl || null,
      public_slug:
        parsed.data.enrollmentVisibility === "openbaar" ? newPublicSlug(parsed.data.title) : null,
      metadata: metadataFromParsed(parsed.data),
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return errorState("Retreat aanmaken is mislukt. Probeer het opnieuw.");
  }

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    action: "retreat.aangemaakt",
    entity_type: "retreat",
    entity_id: data.id,
    metadata: { titel: parsed.data.title },
  });

  revalidatePath("/retreats");
  redirect(`/retreats/${data.id}`);
}

export async function updateRetreatAction(
  organizationId: string,
  retreatId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const membership = await requireMembership(organizationId);

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("retreat_team_members")
    .select("id")
    .eq("retreat_id", retreatId)
    .eq("profile_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();

  if (!canManageRetreat(membership.role, Boolean(existing))) {
    throw new AuthorizationError("Je hebt geen toegang om dit retreat te wijzigen.");
  }

  const parsed = retreatFromFormData(formData);
  if (!parsed.success) {
    return errorState(
      "Controleer de gemarkeerde velden.",
      fieldErrorsFromZod(parsed.error)
    );
  }

  const { data: currentRetreat } = await supabase
    .from("retreats")
    .select("public_slug")
    .eq("id", retreatId)
    .maybeSingle();

  const publicSlug =
    parsed.data.enrollmentVisibility === "openbaar" && !currentRetreat?.public_slug
      ? newPublicSlug(parsed.data.title)
      : currentRetreat?.public_slug;

  const { error } = await supabase
    .from("retreats")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      country: parsed.data.country || null,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      capacity: parsed.data.capacity,
      price_per_person: parsed.data.pricePerPerson,
      status: parsed.data.status,
      enrollment_visibility: parsed.data.enrollmentVisibility,
      booking_deadline: parsed.data.bookingDeadline || null,
      internal_notes: parsed.data.internalNotes || null,
      cover_image_url: parsed.data.coverImageUrl || null,
      public_slug: publicSlug ?? null,
      metadata: metadataFromParsed(parsed.data),
    })
    .eq("id", retreatId);

  if (error) {
    return errorState("Retreat bijwerken is mislukt. Probeer het opnieuw.");
  }

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    action: "retreat.gewijzigd",
    entity_type: "retreat",
    entity_id: retreatId,
    metadata: { titel: parsed.data.title },
  });

  revalidatePath("/retreats");
  revalidatePath(`/retreats/${retreatId}`);
  return successState("Retreat bijgewerkt.");
}
