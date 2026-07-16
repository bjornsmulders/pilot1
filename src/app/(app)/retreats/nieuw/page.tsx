import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActiveMembership } from "@/lib/auth/session";
import { canCreateRetreat } from "@/lib/auth/permissions";
import { createRetreatAction } from "@/actions/retreats";
import { RetreatForm } from "@/components/retreats/retreat-form";

export const metadata: Metadata = { title: "Nieuw retreat — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function NieuwRetreatPage() {
  const membership = await getActiveMembership();
  if (!membership) return null;
  if (!canCreateRetreat(membership.role)) {
    redirect("/retreats");
  }

  const boundAction = createRetreatAction.bind(null, membership.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nieuw retreat</h1>
        <p className="text-muted-foreground">
          Vul de basisgegevens in. Je kunt later reisgegevens, dieetwensen en
          programma toevoegen.
        </p>
      </div>
      <RetreatForm action={boundAction} submitLabel="Retreat aanmaken" />
    </div>
  );
}
