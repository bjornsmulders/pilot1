import type { Metadata } from "next";

import { getActiveMembership } from "@/lib/auth/session";
import { listRetreatOptions } from "@/lib/data/retreats";
import { createParticipantAction } from "@/actions/participants";
import { ParticipantForm } from "@/components/participants/participant-form";

export const metadata: Metadata = { title: "Nieuwe deelnemer — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function NieuweDeelnemerPage() {
  const membership = await getActiveMembership();
  if (!membership) return null;

  const retreats = await listRetreatOptions(membership.organizationId);
  const boundAction = createParticipantAction.bind(null, membership.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nieuwe deelnemer</h1>
        <p className="text-muted-foreground">Voeg handmatig een deelnemer toe aan een retreat.</p>
      </div>
      <ParticipantForm action={boundAction} retreats={retreats} submitLabel="Deelnemer aanmaken" />
    </div>
  );
}
