import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getActiveMembership } from "@/lib/auth/session";
import { getRetreat } from "@/lib/data/retreats";
import { listAnnouncements } from "@/lib/data/announcements";
import { createAnnouncementAction, deleteAnnouncementAction } from "@/actions/announcements";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { AnnouncementList } from "@/components/announcements/announcement-list";

export const metadata: Metadata = { title: "Mededelingen — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function RetreatAnnouncementsPage({
  params,
}: {
  params: Promise<{ retreatId: string }>;
}) {
  const { retreatId } = await params;
  const membership = await getActiveMembership();
  if (!membership) return null;

  const retreat = await getRetreat(membership.organizationId, retreatId);
  if (!retreat) notFound();

  const announcements = await listAnnouncements(membership.organizationId, retreatId);
  const boundCreate = createAnnouncementAction.bind(null, membership.organizationId, retreatId);
  const boundDelete = deleteAnnouncementAction.bind(null, membership.organizationId, retreatId);

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
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Mededelingen</h1>
      </div>

      <AnnouncementList announcements={announcements} onDelete={boundDelete} />
      <AnnouncementForm action={boundCreate} />
    </div>
  );
}
