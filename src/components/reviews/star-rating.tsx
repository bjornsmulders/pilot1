import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function StarRating({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating} van 5 sterren`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(
            "h-4 w-4",
            value <= rating ? "fill-warning text-warning" : "text-muted-foreground"
          )}
        />
      ))}
    </div>
  );
}
