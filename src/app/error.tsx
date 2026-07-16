"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Er ging iets mis</h1>
      <p className="max-w-md text-muted-foreground">
        Deze pagina kon niet worden geladen. Probeer het opnieuw; als het
        probleem aanhoudt, neem contact op met je organisatie.
      </p>
      <Button onClick={reset}>Opnieuw proberen</Button>
    </div>
  );
}
