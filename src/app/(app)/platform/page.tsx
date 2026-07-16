import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getPlatformOverviewStats } from "@/lib/data/platform";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Platformoverzicht — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function PlatformOverviewPage() {
  const stats = await getPlatformOverviewStats();

  const cards = [
    { label: "Organisaties", value: stats?.total_organizations ?? 0 },
    { label: "Retreats totaal", value: stats?.total_retreats ?? 0 },
    { label: "Actieve retreats", value: stats?.active_retreats ?? 0 },
    { label: "Leads totaal", value: stats?.total_leads ?? 0 },
    { label: "Leads (laatste 30 dagen)", value: stats?.leads_last_30_days ?? 0 },
    { label: "Deelnemers totaal", value: stats?.total_participants ?? 0 },
    { label: "Laatste-kans kandidaten", value: stats?.platform_matching_candidates ?? 0 },
    { label: "Platform-introducties gedaan", value: stats?.platform_introductions ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Platformoverzicht</h1>
        <p className="text-muted-foreground">
          Alleen zichtbaar voor JourneyOS-platformbeheer. Aggregaten over alle
          organisaties heen — nooit individuele leads/deelnemers van een andere
          organisatie, behalve via de aparte matching-module hieronder.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Laatste-kans matching</CardTitle>
          <CardDescription>
            Bekijk kandidaten met platformbrede toestemming en introduceer ze
            handmatig bij onderbezette retreats van andere organisatoren.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/platform/laatste-kans">
              Naar matching-kandidaten
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
