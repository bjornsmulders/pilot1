import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getActiveMembership, getCurrentUser } from "@/lib/auth/session";
import { getLead, listLeadActivities } from "@/lib/data/leads";
import { listRetreatOptions } from "@/lib/data/retreats";
import { canManageRetreat } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateLeadAction } from "@/actions/leads";
import { LeadForm } from "@/components/leads/lead-form";
import { LeadActivityLog } from "@/components/leads/lead-activity-log";
import { ConvertToParticipantDialog } from "@/components/leads/convert-to-participant-dialog";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";

export const metadata: Metadata = { title: "Lead — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const membership = await getActiveMembership();
  if (!membership) return null;

  const lead = await getLead(membership.organizationId, leadId);
  if (!lead) notFound();

  const [activities, retreats, user] = await Promise.all([
    listLeadActivities(membership.organizationId, leadId),
    listRetreatOptions(membership.organizationId),
    getCurrentUser(),
  ]);

  let canManage = membership.role === "owner" || membership.role === "admin";
  if (!canManage && lead.retreat_id && membership.role === "coordinator" && user) {
    const supabase = await createClient();
    const { data: assignment } = await supabase
      .from("retreat_team_members")
      .select("id")
      .eq("retreat_id", lead.retreat_id)
      .eq("profile_id", user.id)
      .maybeSingle();
    canManage = canManageRetreat(membership.role, Boolean(assignment));
  }

  const boundAction = updateLeadAction.bind(null, membership.organizationId, leadId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{lead.name}</h1>
          <LeadStatusBadge status={lead.status} />
        </div>
        {canManage && lead.status !== "geboekt" && (
          <ConvertToParticipantDialog
            organizationId={membership.organizationId}
            leadId={leadId}
            defaultRetreatId={lead.retreat_id}
            retreats={retreats}
          />
        )}
      </div>

      {canManage ? (
        <LeadForm action={boundAction} lead={lead} retreats={retreats} submitLabel="Wijzigingen opslaan" />
      ) : (
        <p className="text-sm text-muted-foreground">Je hebt alleen leestoegang tot deze lead.</p>
      )}

      <LeadActivityLog
        organizationId={membership.organizationId}
        leadId={leadId}
        activities={activities}
      />
    </div>
  );
}
