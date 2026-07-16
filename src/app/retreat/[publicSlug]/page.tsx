import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, CalendarDays, MessageCircle } from "lucide-react";

import { getPublicRetreat } from "@/lib/data/retreats";
import { listPublicReviews } from "@/lib/data/reviews";
import { submitPublicLeadAction } from "@/actions/leads";
import { submitPublicReviewAction } from "@/actions/reviews";
import { buildWaLink } from "@/lib/whatsapp";
import { PublicInterestForm } from "@/components/retreats/public-interest-form";
import { RetreatStatusBadge } from "@/components/retreats/retreat-status-badge";
import { PublicReviewForm } from "@/components/reviews/public-review-form";
import { PublicReviewList } from "@/components/reviews/public-review-list";
import { Button } from "@/components/ui/button";
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

function galleryUrls(metadata: Record<string, unknown>): string[] {
  const value = metadata.gallery_image_urls;
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
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
  const boundReviewAction = submitPublicReviewAction.bind(null, publicSlug);
  const reviews = await listPublicReviews(publicSlug);
  const isFull = retreat.status === "vol";
  const extraInfo = typeof retreat.metadata.extra_info === "string" ? retreat.metadata.extra_info : null;
  const gallery = galleryUrls(retreat.metadata);
  const waMessage = `Hoi! Ik ben geïnteresseerd in "${retreat.title}" (${formatDateRange(
    retreat.start_date,
    retreat.end_date
  )}). Kun je me meer informatie sturen?`;
  const waLink = retreat.organization_contact_phone
    ? buildWaLink(retreat.organization_contact_phone, waMessage)
    : null;

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
          <p className="mt-1 text-sm text-muted-foreground">
            Georganiseerd door{" "}
            <Link href={`/o/${retreat.organization_slug}`} className="underline hover:no-underline">
              {retreat.organization_name}
            </Link>
          </p>
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

            {gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {gallery.map((url) => (
                  <div
                    key={url}
                    className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    <Image src={url} alt="" fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            )}

            {extraInfo && (
              <Card>
                <CardContent className="whitespace-pre-line pt-6 text-sm leading-relaxed text-foreground">
                  {extraInfo}
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

            {reviews.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-foreground">Reviews</h2>
                <PublicReviewList reviews={reviews} />
              </div>
            )}

            <PublicReviewForm action={boundReviewAction} />
          </div>

          <div className="flex flex-col gap-4">
            {isFull ? (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  Dit retreat zit momenteel vol. Laat toch je gegevens achter — bij een
                  vrijgekomen plek nemen we contact met je op.
                </CardContent>
              </Card>
            ) : null}

            {waLink && (
              <Button asChild size="lg" className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#1ebe5a]">
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  Meld je aan via WhatsApp
                </a>
              </Button>
            )}

            {waLink && (
              <p className="text-center text-xs text-muted-foreground">— of vul het formulier in —</p>
            )}

            <PublicInterestForm action={boundAction} />
          </div>
        </div>
      </div>
    </div>
  );
}
