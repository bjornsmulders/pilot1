import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js 16 hernoemde `middleware.ts` naar `proxy.ts` (zie docs/decisions.md
 * ADR-0001). Deze proxy doet uitsluitend *optimistische* checks op basis van de
 * Supabase-sessiecookie: ingelogd/niet-ingelogd. Het is nadrukkelijk niet de
 * enige autorisatielaag — elke Server Action en elke query controleert zelf
 * opnieuw de sessie en de rol (zie src/lib/auth/session.ts) en Postgres Row
 * Level Security is de ondergrens. Zie docs/architecture.md.
 */
const PUBLIC_PATHS = [
  "/",
  "/inloggen",
  "/registreren",
  "/wachtwoord-vergeten",
  "/wachtwoord-resetten",
  "/auth/callback",
  "/uitnodiging",
  "/functies",
  "/voor-organisatoren",
  "/prijzen",
  "/contact",
  "/privacy",
  "/retreat",
  "/ontdek",
  "/o",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const publicPath = isPublicPath(pathname);

  if (!user && !publicPath) {
    const redirectUrl = new URL("/inloggen", request.url);
    redirectUrl.searchParams.set("volgende", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const hasRedirectTarget = request.nextUrl.searchParams.has("volgende");
  if (
    user &&
    !hasRedirectTarget &&
    (pathname === "/inloggen" || pathname === "/registreren")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
