import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getActiveMembership } from "@/lib/auth/session";
import { getRetreat } from "@/lib/data/retreats";
import { listReviews } from "@/lib/data/reviews";
import { setReviewPublishedAction } from "@/actions/reviews";
import { ReviewModerationList } from "@/components/reviews/review-moderation-list";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Reviews — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function RetreatReviewsPage({
  params,
}: {
  params: Promise<{ retreatId: string }>;
}) {
  const { retreatId } = await params;
  const membership = await getActiveMembership();
  if (!membership) return null;

  const retreat = await getRetreat(membership.organizationId, retreatId);
  if (!retreat) notFound();

  const reviews = await listReviews(membership.organizationId, retreatId);
  const boundSetPublished = setReviewPublishedAction.bind(
    null,
    membership.organizationId,
    retreatId
  );
  const publicUrl = retreat.public_slug
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/retreat/${retreat.public_slug}#review`
    : null;

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
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Reviews</h1>
        <p className="text-muted-foreground">
          Nieuwe reviews zijn pas zichtbaar op de openbare retreatpagina nadat je ze hebt
          gepubliceerd.
        </p>
      </div>

      {publicUrl ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Stuur oud-deelnemers na afloop deze link om een review achter te laten:{" "}
            <code className="rounded bg-muted px-2 py-0.5">{publicUrl}</code>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Zet dit retreat op &ldquo;Openbaar&rdquo; om een deelbare reviewlink te krijgen.
          </CardContent>
        </Card>
      )}

      <ReviewModerationList reviews={reviews} onSetPublished={boundSetPublished} />
    </div>
  );
}
