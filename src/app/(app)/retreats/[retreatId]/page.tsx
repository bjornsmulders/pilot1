import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getActiveMembership, getCurrentUser } from "@/lib/auth/session";
import { getRetreat } from "@/lib/data/retreats";
import { canManageRetreat } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateRetreatAction } from "@/actions/retreats";
import { RetreatForm } from "@/components/retreats/retreat-form";
import { RetreatStatusBadge } from "@/components/retreats/retreat-status-badge";
import { PublicLinkCard } from "@/components/retreats/public-link-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyEUR, formatDateRange } from "@/lib/format";

export const metadata: Metadata = { title: "Retreat — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function RetreatDetailPage({
  params,
}: {
  params: Promise<{ retreatId: string }>;
}) {
  const { retreatId } = await params;
  const membership = await getActiveMembership();
  if (!membership) return null;

  const retreat = await getRetreat(membership.organizationId, retreatId);
  if (!retreat) {
    notFound();
  }

  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("retreat_team_members")
    .select("id")
    .eq("retreat_id", retreatId)
    .eq("profile_id", user?.id ?? "")
    .maybeSingle();

  const canManage = canManageRetreat(membership.role, Boolean(assignment));
  const expectedRevenue = retreat.capacity * Number(retreat.price_per_person);
  const boundAction = updateRetreatAction.bind(null, membership.organizationId, retreatId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{retreat.title}</h1>
            <RetreatStatusBadge status={retreat.status} />
          </div>
          <p className="text-muted-foreground">
            {formatDateRange(retreat.start_date, retreat.end_date)}
            {retreat.location ? ` · ${retreat.location}` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Capaciteit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{retreat.capacity}</p>
            <p className="text-xs text-muted-foreground">
              plaatsen — boekingen volgen in de deelnemers-slice
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verwachte omzet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {formatCurrencyEUR(expectedRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">
              Formule: capaciteit ({retreat.capacity}) × prijs per persoon (
              {formatCurrencyEUR(Number(retreat.price_per_person))}). Dit is een
              maximum bij volledige bezetting, geen realtime omzet.
            </p>
          </CardContent>
        </Card>
      </div>

      {retreat.public_slug && retreat.enrollment_visibility === "openbaar" && (
        <PublicLinkCard
          url={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/retreat/${retreat.public_slug}`}
        />
      )}

      {canManage ? (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Gegevens wijzigen</h2>
          <RetreatForm action={boundAction} retreat={retreat} submitLabel="Wijzigingen opslaan" />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Je hebt alleen leestoegang tot dit retreat.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
