import * as Sentry from "@sentry/nextjs";

/**
 * Next.js roept dit automatisch aan bij het opstarten van de server- en
 * edge-runtime (App Router "instrumentation" conventie). Sentry initialiseert
 * alleen als NEXT_PUBLIC_SENTRY_DSN is ingesteld -- zonder DSN is dit een
 * no-op, zodat lokale ontwikkeling zonder Sentry-account gewoon werkt.
 */
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({ dsn, tracesSampleRate: 0.2 });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({ dsn, tracesSampleRate: 0.2 });
  }
}

export const onRequestError = Sentry.captureRequestError;
