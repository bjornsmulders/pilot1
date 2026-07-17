import "server-only";

import { createClient } from "@/lib/supabase/server";

/** Publiek, ongeauthenticeerd -- de token zelf is de enige autorisatie. */
export async function previewOnboardingInvite(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("preview_onboarding_invite", {
    invite_token: token,
  });

  if (error) return null;
  return data?.[0] ?? null;
}
