import type { Metadata } from "next";

import { previewOnboardingInvite } from "@/lib/data/onboarding";
import { submitOnboardingAction } from "@/actions/onboarding";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateRange } from "@/lib/format";

export const metadata: Metadata = { title: "Jouw onboarding — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function ParticipantOnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await previewOnboardingInvite(token);

  if (!preview) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Card>
          <CardContent className="pt-6">
            <p className="font-medium text-foreground">Deze link is ongeldig of verlopen</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vraag de organisator van je retreat om een nieuwe link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const boundAction = submitOnboardingAction.bind(null, token);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Hoi {preview.participant_full_name}!
        </h1>
        <p className="text-muted-foreground">
          Vul hieronder je gegevens in voor <strong>{preview.retreat_title}</strong> (
          {formatDateRange(preview.retreat_start_date, preview.retreat_end_date)}
          {preview.retreat_location ? ` · ${preview.retreat_location}` : ""}).
        </p>
      </div>

      <OnboardingForm action={boundAction} preview={preview} />
    </div>
  );
}
