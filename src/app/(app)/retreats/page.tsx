import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getActiveMembership } from "@/lib/auth/session";
import { listRetreats } from "@/lib/data/retreats";
import { canCreateRetreat } from "@/lib/auth/permissions";
import type { RetreatStatus } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { RetreatFilters } from "@/components/retreats/retreat-filters";
import { RetreatTable } from "@/components/retreats/retreat-table";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Retreats — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function RetreatsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const membership = await getActiveMembership();
  if (!membership) return null;

  const retreats = await listRetreats(membership.organizationId, {
    status: status as RetreatStatus | undefined,
    query: q,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Retreats</h1>
          <p className="text-muted-foreground">Al je retreats op één plek.</p>
        </div>
        {canCreateRetreat(membership.role) && (
          <Button asChild>
            <Link href="/retreats/nieuw">Nieuw retreat</Link>
          </Button>
        )}
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-md" />}>
        <RetreatFilters />
      </Suspense>

      <RetreatTable retreats={retreats} />
    </div>
  );
}
