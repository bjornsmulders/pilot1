import type { Metadata } from "next";

import { getActiveMembership } from "@/lib/auth/session";
import { listRetreatOptions } from "@/lib/data/retreats";
import { createLeadAction } from "@/actions/leads";
import { LeadForm } from "@/components/leads/lead-form";

export const metadata: Metadata = { title: "Nieuwe lead — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function NieuweLeadPage() {
  const membership = await getActiveMembership();
  if (!membership) return null;

  const retreats = await listRetreatOptions(membership.organizationId);
  const boundAction = createLeadAction.bind(null, membership.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nieuwe lead</h1>
        <p className="text-muted-foreground">Leg interesse vast, ook zonder specifiek retreat.</p>
      </div>
      <LeadForm action={boundAction} retreats={retreats} submitLabel="Lead aanmaken" />
    </div>
  );
}
