import Link from "next/link";
import Image from "next/image";
import { MapPin, CalendarDays } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { RetreatStatusBadge } from "@/components/retreats/retreat-status-badge";
import { StarRating } from "@/components/reviews/star-rating";
import { formatCurrencyEUR, formatDateRange } from "@/lib/format";
import type { PublicRetreatListingRow } from "@/lib/supabase/database.types";

export function PublicRetreatCard({
  retreat,
  showOrganizer = true,
}: {
  retreat: PublicRetreatListingRow;
  showOrganizer?: boolean;
}) {
  return (
    <Link href={`/retreat/${retreat.public_slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="relative h-40 w-full bg-muted">
          {retreat.cover_image_url ? (
            <Image
              src={retreat.cover_image_url}
              alt={retreat.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-sm text-muted-foreground">
              JourneyOS
            </div>
          )}
        </div>
        <CardContent className="flex flex-col gap-2 pt-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-foreground group-hover:underline">
              {retreat.title}
            </h3>
            <RetreatStatusBadge status={retreat.status} />
          </div>
          {showOrganizer && (
            <p className="text-xs text-muted-foreground">{retreat.organization_name}</p>
          )}
          {retreat.review_count > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={Math.round(retreat.average_rating ?? 0)} />
              <span className="text-xs text-muted-foreground">
                {Number(retreat.average_rating).toFixed(1)} ({retreat.review_count})
              </span>
            </div>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDateRange(retreat.start_date, retreat.end_date)}
          </p>
          {retreat.location && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {retreat.location}
              {retreat.country ? `, ${retreat.country}` : ""}
            </p>
          )}
          <p className="mt-1 text-sm font-semibold text-foreground">
            {formatCurrencyEUR(Number(retreat.price_per_person))}
            <span className="font-normal text-muted-foreground"> p.p.</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
