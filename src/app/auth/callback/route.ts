import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Supabase stuurt e-mailbevestiging-, magic-link- en wachtwoord-reset-links
 * hierheen met een `code`-parameter (PKCE). We wisselen die om voor een sessie
 * en sturen de gebruiker daarna door.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/inloggen?fout=bevestiging_mislukt`);
}
