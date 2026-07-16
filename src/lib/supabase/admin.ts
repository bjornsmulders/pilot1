import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Service-role Supabase-client. Omzeilt Row Level Security volledig.
 *
 * Regels voor gebruik (zie docs/security.md):
 *  - Alleen aanroepen vanuit geïsoleerde server-only code die geen
 *    gebruikerssessie heeft om op te autoriseren (bv. een webhookhandler).
 *  - Nooit gebruiken om een gewone, ingelogde-gebruikersactie uit te voeren die
 *    ook via de gewone client + RLS kan.
 *  - Nooit importeren in een bestand dat ook client-side code bevat.
 *  - Elke aanroepplek documenteert in een commentaar waarom RLS hier niet volstaat.
 *
 * `SUPABASE_SERVICE_ROLE_KEY` heeft geen `NEXT_PUBLIC_`-prefix en wordt daardoor
 * nooit door Next.js naar de browserbundel gestuurd.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY of NEXT_PUBLIC_SUPABASE_URL ontbreekt. Deze client mag alleen server-side en met volledige configuratie gebruikt worden."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
