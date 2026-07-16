import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getActiveMembership } from "@/lib/auth/session";
import { listLeads } from "@/lib/data/leads";
import type { LeadStatus } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";
import { ExportLeadsButton } from "@/components/leads/export-leads-button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Leads — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; followUp?: string }>;
}) {
  const { status, q, followUp } = await searchParams;
  const membership = await getActiveMembership();
  if (!membership) return null;

  const leads = await listLeads(membership.organizationId, {
    status: status as LeadStatus | undefined,
    query: q,
    followUpDueOnly: followUp === "1",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Interesse en wachtlijst.</p>
        </div>
        <div className="flex gap-2">
          <ExportLeadsButton leads={leads} />
          <Button asChild>
            <Link href="/leads/nieuw">Nieuwe lead</Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-xl" />}>
        <LeadFilters />
      </Suspense>

      <LeadTable leads={leads} />
    </div>
  );
}
