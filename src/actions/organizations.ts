"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireUser, requireRole, getCurrentUser } from "@/lib/auth/session";
import { createOrganizationSchema, inviteMemberSchema } from "@/lib/validation/organizations";
import { slugify, slugWithSuffix } from "@/lib/slug";
import { generateToken } from "@/lib/tokens";
import {
  type ActionState,
  errorState,
  fieldErrorsFromZod,
  successState,
} from "@/lib/action-state";

const INVITE_EXPIRY_DAYS = 7;

export async function createOrganizationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();

  const parsed = createOrganizationSchema.safeParse({
    name: formData.get("name"),
    country: formData.get("country") || "Nederland",
    contactEmail: formData.get("contactEmail") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Controleer de gemarkeerde velden.",
      fieldErrorsFromZod(parsed.error)
    );
  }

  const supabase = await createClient();
  const baseSlug = slugify(parsed.data.name) || "organisatie";

  let orgId: string | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 5 && !orgId; attempt += 1) {
    const candidateSlug =
      attempt === 0 ? baseSlug : slugWithSuffix(baseSlug, String(Math.floor(Math.random() * 10000)));

    const { data, error } = await supabase.rpc("create_organization", {
      org_name: parsed.data.name,
      org_slug: candidateSlug,
      org_contact_email: parsed.data.contactEmail || null,
      org_country: parsed.data.country,
    });

    if (!error && data) {
      orgId = (data as { id: string }).id;
      break;
    }

    lastError = error?.message ?? "Onbekende fout";
    if (!error?.message?.includes("duplicate key")) {
      break;
    }
  }

  if (!orgId) {
    return errorState(
      lastError?.includes("duplicate key")
        ? "Er bestaat al een organisatie met een vergelijkbare naam. Probeer een andere naam."
        : "Organisatie aanmaken is mislukt. Probeer het opnieuw."
    );
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function inviteMemberAction(
  organizationId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(organizationId, ["owner"]);

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return errorState(
      "Controleer de gemarkeerde velden.",
      fieldErrorsFromZod(parsed.error)
    );
  }

  const supabase = await createClient();
  const { token, tokenHash } = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("invitations").insert({
    organization_id: organizationId,
    email: parsed.data.email,
    role: parsed.data.role,
    token_hash: tokenHash,
    expires_at: expiresAt,
    invited_by: userData.user?.id ?? null,
  });

  if (error) {
    return errorState(
      error.message.includes("invitations_pending_unique_idx")
        ? "Er staat al een openstaande uitnodiging voor dit e-mailadres."
        : "Uitnodiging aanmaken is mislukt. Probeer het opnieuw."
    );
  }

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: userData.user?.id ?? null,
    action: "teamlid.uitgenodigd",
    entity_type: "invitation",
    metadata: { email: parsed.data.email, role: parsed.data.role },
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/uitnodiging/${token}`;

  revalidatePath("/instellingen/organisatie");
  return successState(
    `Uitnodiging aangemaakt. Deel deze link met ${parsed.data.email}: ${inviteUrl}`
  );
}

export async function acceptInvitationAction(
  token: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- vereist door useActionState's actie-signatuur
  _prevState: ActionState
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return errorState("Log in om deze uitnodiging te accepteren.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invitation", {
    invitation_token: token,
  });

  if (error || !data) {
    return errorState(error?.message ?? "Uitnodiging accepteren is mislukt.");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
