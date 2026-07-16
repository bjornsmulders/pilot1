import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Supabase-client voor gebruik in Server Components, Server Actions en Route
 * Handlers. Gebruikt de anon key + de sessiecookie van de ingelogde gebruiker —
 * alle queries lopen dus door Row Level Security als die gebruiker. Nooit de
 * service-role key hier gebruiken (zie ./admin.ts).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Genegeerd: een Server Component mag geen cookies schrijven. De
            // sessie wordt in dat geval al ververst door proxy.ts.
          }
        },
      },
    }
  );
}
