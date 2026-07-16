import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getActiveMembership, getCurrentUser } from "@/lib/auth/session";
import { getParticipant } from "@/lib/data/participants";
import { listRetreatOptions } from "@/lib/data/retreats";
import { listPayments } from "@/lib/data/payments";
import { canManageRetreat } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateParticipantAction } from "@/actions/participants";
import { registerManualPaymentAction } from "@/actions/payments";
import { ParticipantForm } from "@/components/participants/participant-form";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/participants/participant-status-badges";
import { PaymentList } from "@/components/payments/payment-list";
import { RegisterPaymentForm } from "@/components/payments/register-payment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Deelnemer — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { participantId } = await params;
  const membership = await getActiveMembership();
  if (!membership) return null;

  const participant = await getParticipant(membership.organizationId, participantId);
  if (!participant) notFound();

  const [retreats, user] = await Promise.all([
    listRetreatOptions(membership.organizationId),
    getCurrentUser(),
  ]);

  let canManage = membership.role === "owner" || membership.role === "admin";
  if (!canManage && membership.role === "coordinator" && user) {
    const supabase = await createClient();
    const { data: assignment } = await supabase
      .from("retreat_team_members")
      .select("id")
      .eq("retreat_id", participant.retreat_id)
      .eq("profile_id", user.id)
      .maybeSingle();
    canManage = canManageRetreat(membership.role, Boolean(assignment));
  }

  const boundAction = updateParticipantAction.bind(null, membership.organizationId, participantId);
  const boundPaymentAction = registerManualPaymentAction.bind(
    null,
    membership.organizationId,
    participantId
  );

  // Mirrort de payments_select RLS-policy: owner/admin/viewer org-breed, of
  // een coordinator die aan dit specifieke retreat is toegewezen (zie
  // ADR-0005 in docs/decisions.md). Alleen owner/admin mogen schrijven.
  const canViewPayments =
    membership.role === "owner" ||
    membership.role === "admin" ||
    membership.role === "viewer" ||
    canManage;
  const canRegisterPayment = membership.role === "owner" || membership.role === "admin";
  const payments = canViewPayments
    ? await listPayments(membership.organizationId, participantId)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{participant.full_name}</h1>
          <BookingStatusBadge status={participant.booking_status} />
          <PaymentStatusBadge status={participant.payment_status} />
        </div>
        {participant.lead_id && (
          <Link
            href={`/leads/${participant.lead_id}`}
            className="text-sm text-muted-foreground underline hover:no-underline"
          >
            Bekijk oorspronkelijke lead
          </Link>
        )}
      </div>

      {canManage ? (
        <ParticipantForm
          action={boundAction}
          participant={participant}
          retreats={retreats}
          submitLabel="Wijzigingen opslaan"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Je hebt alleen leestoegang tot deze deelnemer.
        </p>
      )}

      {canViewPayments && (
        <Card>
          <CardHeader>
            <CardTitle>Betalingen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <PaymentList payments={payments} />
            {canRegisterPayment && <RegisterPaymentForm action={boundPaymentAction} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
