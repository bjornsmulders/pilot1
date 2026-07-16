"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getMemberships } from "@/lib/auth/session";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import {
  type ActionState,
  errorState,
  fieldErrorsFromZod,
  successState,
} from "@/lib/action-state";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Alleen relatieve, same-origin paden toestaan als redirect-doel (voorkomt open redirects). */
function safeNextPath(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
}

export async function signUpAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!parsed.success) {
    return errorState(
      "Controleer de gemarkeerde velden.",
      fieldErrorsFromZod(parsed.error)
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${appUrl()}/auth/callback`,
    },
  });

  if (error) {
    return errorState(translateAuthError(error.message));
  }

  if (data.session) {
    redirect(safeNextPath(formData.get("next")) ?? "/onboarding/organisatie-aanmaken");
  }

  return successState(
    "Account aangemaakt. Check je e-mail om je adres te bevestigen voordat je inlogt."
  );
}

export async function signInAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return errorState(
      "Controleer de gemarkeerde velden.",
      fieldErrorsFromZod(parsed.error)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return errorState(translateAuthError(error.message));
  }

  const nextPath = safeNextPath(formData.get("next"));
  if (nextPath) {
    redirect(nextPath);
  }

  const memberships = await getMemberships();
  redirect(memberships.length === 0 ? "/onboarding/organisatie-aanmaken" : "/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/inloggen");
}

export async function requestPasswordResetAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return errorState(
      "Controleer de gemarkeerde velden.",
      fieldErrorsFromZod(parsed.error)
    );
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl()}/wachtwoord-resetten`,
  });

  // Altijd hetzelfde succesbericht tonen, ongeacht of het e-mailadres bestaat --
  // voorkomt dat deze pagina gebruikt kan worden om geregistreerde e-mailadressen
  // te achterhalen.
  return successState(
    "Als dit e-mailadres bij ons bekend is, ontvang je een link om je wachtwoord opnieuw in te stellen."
  );
}

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!parsed.success) {
    return errorState(
      "Controleer de gemarkeerde velden.",
      fieldErrorsFromZod(parsed.error)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return errorState(translateAuthError(error.message));
  }

  redirect("/dashboard");
}

function translateAuthError(message: string): string {
  const known: Record<string, string> = {
    "Invalid login credentials": "E-mailadres of wachtwoord is onjuist.",
    "User already registered": "Er bestaat al een account met dit e-mailadres.",
    "Email not confirmed": "Bevestig eerst je e-mailadres voordat je inlogt.",
  };
  return known[message] ?? "Er ging iets mis. Probeer het opnieuw.";
}
