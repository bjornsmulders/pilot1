"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/reviews/star-rating";
import { formatDateTime } from "@/lib/format";
import type { ReviewRow } from "@/lib/supabase/database.types";

export function ReviewModerationList({
  reviews,
  onSetPublished,
}: {
  reviews: ReviewRow[];
  onSetPublished: (reviewId: string, isPublished: boolean) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen reviews binnengekomen.</p>;
  }

  function handleToggle(reviewId: string, next: boolean) {
    startTransition(async () => {
      await onSetPublished(reviewId, next);
      toast.success(next ? "Review gepubliceerd." : "Review verborgen.");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{review.author_name}</p>
                <StarRating rating={review.rating} />
                <Badge variant={review.is_published ? "success" : "outline"}>
                  {review.is_published ? "Gepubliceerd" : "Concept"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{formatDateTime(review.created_at)}</p>
              {review.body && <p className="mt-1 text-sm text-foreground">{review.body}</p>}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleToggle(review.id, !review.is_published)}
            >
              {review.is_published ? "Verbergen" : "Publiceren"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
