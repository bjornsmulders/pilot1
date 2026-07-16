import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getActiveMembership } from "@/lib/auth/session";
import { listParticipants } from "@/lib/data/participants";
import { listRetreatOptions } from "@/lib/data/retreats";
import type { BookingStatus } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { ParticipantFilters } from "@/components/participants/participant-filters";
import { ParticipantTable } from "@/components/participants/participant-table";
import { ExportParticipantsButton } from "@/components/participants/export-participants-button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Deelnemers — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingStatus?: string; q?: string; retreatId?: string }>;
}) {
  const { bookingStatus, q, retreatId } = await searchParams;
  const membership = await getActiveMembership();
  if (!membership) return null;

  const [participants, retreats] = await Promise.all([
    listParticipants(membership.organizationId, {
      bookingStatus: bookingStatus as BookingStatus | undefined,
      query: q,
      retreatId,
    }),
    listRetreatOptions(membership.organizationId),
  ]);

  const retreatTitleById = Object.fromEntries(retreats.map((r) => [r.id, r.title]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Deelnemers</h1>
          <p className="text-muted-foreground">Boekingen en betaalstatus per retreat.</p>
        </div>
        <div className="flex gap-2">
          <ExportParticipantsButton participants={participants} />
          <Button asChild>
            <Link href="/deelnemers/nieuw">Nieuwe deelnemer</Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-xl" />}>
        <ParticipantFilters retreats={retreats} />
      </Suspense>

      <ParticipantTable participants={participants} retreatTitleById={retreatTitleById} />
    </div>
  );
}
