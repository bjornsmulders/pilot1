import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { getPublicOrganization, getOrganizationReviewStats } from "@/lib/data/organizations";
import { listPublicRetreats } from "@/lib/data/retreats";
import { PublicRetreatCard } from "@/components/retreats/public-retreat-card";
import { StarRating } from "@/components/reviews/star-rating";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> {
  const { orgSlug } = await params;
  const organization = await getPublicOrganization(orgSlug);
  if (!organization) return { title: "Organisator — JourneyOS" };
  return { title: `${organization.name} — JourneyOS` };
}

export default async function PublicOrganizationPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await getPublicOrganization(orgSlug);
  if (!organization) {
    notFound();
  }

  const [retreats, reviewStats] = await Promise.all([
    listPublicRetreats(orgSlug),
    getOrganizationReviewStats(orgSlug),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            JourneyOS
          </Link>
          <Link href="/ontdek" className="text-sm text-muted-foreground hover:text-foreground">
            Meer retreats ontdekken →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex items-center gap-4">
          {organization.logo_url && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
              <Image src={organization.logo_url} alt={organization.name} fill className="object-cover" unoptimized />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{organization.name}</h1>
            {reviewStats.review_count > 0 && (
              <div className="mt-1 flex items-center gap-1.5">
                <StarRating rating={Math.round(reviewStats.average_rating ?? 0)} />
                <span className="text-sm text-muted-foreground">
                  {Number(reviewStats.average_rating).toFixed(1)} van 5 — {reviewStats.review_count}{" "}
                  {reviewStats.review_count === 1 ? "review" : "reviews"} over alle retreats
                </span>
              </div>
            )}
            {organization.website && (
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline hover:no-underline"
              >
                {organization.website}
              </a>
            )}
          </div>
        </div>

        {retreats.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-border p-10 text-center">
            <p className="font-medium text-foreground">Nog geen openbare retreats</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Deze organisator heeft op dit moment geen open retreats.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {retreats.map((retreat) => (
              <PublicRetreatCard key={retreat.id} retreat={retreat} showOrganizer={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
