import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, Users, CalendarDays } from "lucide-react";

import { getPublicRetreat } from "@/lib/data/retreats";
import { submitPublicLeadAction } from "@/actions/leads";
import { PublicInterestForm } from "@/components/retreats/public-interest-form";
import { RetreatStatusBadge } from "@/components/retreats/retreat-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyEUR, formatDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}): Promise<Metadata> {
  const { publicSlug } = await params;
  const retreat = await getPublicRetreat(publicSlug);
  if (!retreat) return { title: "Retreat — JourneyOS" };
  return {
    title: `${retreat.title} — JourneyOS`,
    description: retreat.description ?? undefined,
  };
}

export default async function PublicRetreatPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;
  const retreat = await getPublicRetreat(publicSlug);
  if (!retreat) {
    notFound();
  }

  const boundAction = submitPublicLeadAction.bind(null, publicSlug);
  const isFull = retreat.status === "vol";

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-64 w-full overflow-hidden bg-muted sm:h-96">
        {retreat.cover_image_url ? (
          <Image
            src={retreat.cover_image_url}
            alt={retreat.title}
            fill
            className="object-cover"
            unoptimized
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-lg text-muted-foreground">JourneyOS</span>
          </div>
        )}
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-foreground">{retreat.title}</h1>
            <RetreatStatusBadge status={retreat.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatDateRange(retreat.start_date, retreat.end_date)}
            </span>
            {retreat.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {retreat.location}
                {retreat.country ? `, ${retreat.country}` : ""}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {retreat.capacity} plaatsen
            </span>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-6 sm:col-span-2">
            {retreat.description && (
              <Card>
                <CardContent className="whitespace-pre-line pt-6 text-sm leading-relaxed text-foreground">
                  {retreat.description}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Prijs per persoon</p>
                <p className="text-2xl font-semibold text-foreground">
                  {formatCurrencyEUR(Number(retreat.price_per_person))}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            {isFull ? (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  Dit retreat zit momenteel vol. Laat toch je gegevens achter — bij een
                  vrijgekomen plek nemen we contact met je op.
                </CardContent>
              </Card>
            ) : null}
            <div className={isFull ? "mt-4" : undefined}>
              <PublicInterestForm action={boundAction} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
