import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/reviews/star-rating";
import { formatDateShort } from "@/lib/format";
import type { PublicReviewRow } from "@/lib/supabase/database.types";

export function PublicReviewList({ reviews }: { reviews: PublicReviewRow[] }) {
  if (reviews.length === 0) return null;

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <StarRating rating={Math.round(average)} />
        <p className="text-sm text-muted-foreground">
          {average.toFixed(1)} van 5 — {reviews.length}{" "}
          {reviews.length === 1 ? "review" : "reviews"}
        </p>
      </div>
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-foreground">{review.author_name}</p>
              <StarRating rating={review.rating} />
            </div>
            <p className="text-xs text-muted-foreground">{formatDateShort(review.created_at)}</p>
            {review.body && <p className="mt-2 text-sm text-foreground">{review.body}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
