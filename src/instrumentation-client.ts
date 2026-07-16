import * as Sentry from "@sentry/nextjs";

/**
 * Client-side Sentry-init (Next.js "instrumentation-client" conventie, sinds
 * Next.js 15.3 de vervanger van sentry.client.config.ts). No-op zonder DSN.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    // Nooit gevoelige onboardingantwoorden of privéberichten laten meesturen
    // in breadcrumbs/replay -- zie docs/security.md.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export const onRouterTransitionStart = dsn ? Sentry.captureRouterTransitionStart : undefined;
