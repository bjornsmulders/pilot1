"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

let initialized = false;

function initPostHogOnce() {
  if (initialized || !POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // we sturen pageviews handmatig bij App Router-navigatie
    person_profiles: "identified_only",
  });
  initialized = true;
}

/**
 * Volgt alleen wat nodig is voor productanalytics op basis van expliciete
 * acties en paginabezoeken -- nooit de inhoud van onboardingantwoorden of
 * berichten. Zonder NEXT_PUBLIC_POSTHOG_KEY is dit een no-op.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHogOnce();
  }, []);

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    const query = searchParams.toString();
    posthog.capture("$pageview", { $current_url: query ? `${pathname}?${query}` : pathname });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
