import type { Metadata } from "next";
import Link from "next/link";
import { Tent, Users, TrendingUp, ArrowRight } from "lucide-react";

import { getActiveMembership } from "@/lib/auth/session";
import { getOrganizationDashboardStats } from "@/lib/data/retreats";
import { canCreateRetreat } from "@/lib/auth/permissions";
import { formatPercentage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const membership = await getActiveMembership();
  if (!membership) return null;

  const stats = await getOrganizationDashboardStats(membership.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Overzicht van {membership.organization.name}.
          </p>
        </div>
        {canCreateRetreat(membership.role) && (
          <Button asChild>
            <Link href="/retreats/nieuw">Nieuw retreat</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actieve retreats
            </CardTitle>
            <Tent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{stats.activeRetreats}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totale capaciteit
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{stats.totalCapacity}</p>
            <p className="text-xs text-muted-foreground">plaatsen in actieve retreats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bezettingsgraad
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {formatPercentage(stats.occupancyRate)}
            </p>
            <p className="text-xs text-muted-foreground">
              boekingen ÷ capaciteit — komt in de deelnemers-slice
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volgende stap</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Bekijk je retreats, of maak er een nieuwe aan.
          </p>
          <Button asChild variant="outline">
            <Link href="/retreats" className="gap-2">
              Naar retreatoverzicht <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
