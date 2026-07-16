import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getActiveMembership } from "@/lib/auth/session";
import { getRetreat } from "@/lib/data/retreats";
import { listScheduleItems } from "@/lib/data/schedule";
import { createScheduleItemAction, deleteScheduleItemAction } from "@/actions/schedule";
import { ScheduleItemForm } from "@/components/schedule/schedule-item-form";
import { ScheduleList } from "@/components/schedule/schedule-list";

export const metadata: Metadata = { title: "Programma — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function RetreatSchedulePage({
  params,
}: {
  params: Promise<{ retreatId: string }>;
}) {
  const { retreatId } = await params;
  const membership = await getActiveMembership();
  if (!membership) return null;

  const retreat = await getRetreat(membership.organizationId, retreatId);
  if (!retreat) notFound();

  const items = await listScheduleItems(membership.organizationId, retreatId);
  const boundCreate = createScheduleItemAction.bind(null, membership.organizationId, retreatId);
  const boundDelete = deleteScheduleItemAction.bind(null, membership.organizationId, retreatId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/retreats/${retreatId}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar {retreat.title}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Programma</h1>
      </div>

      <ScheduleList items={items} onDelete={boundDelete} />
      <ScheduleItemForm action={boundCreate} />
    </div>
  );
}
