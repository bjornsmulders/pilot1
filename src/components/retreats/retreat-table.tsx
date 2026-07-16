import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RetreatStatusBadge } from "@/components/retreats/retreat-status-badge";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyEUR, formatDateRange } from "@/lib/format";
import type { RetreatListItem } from "@/lib/data/retreats";

export function RetreatTable({ retreats }: { retreats: RetreatListItem[] }) {
  if (retreats.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="font-medium text-foreground">Nog geen retreats</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Maak je eerste retreat aan om leads en deelnemers te kunnen beheren.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titel</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead>Locatie</TableHead>
            <TableHead>Capaciteit</TableHead>
            <TableHead>Prijs p.p.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {retreats.map((retreat) => (
            <TableRow key={retreat.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/retreats/${retreat.id}`} className="hover:underline">
                  {retreat.title}
                </Link>
                {retreat.isAssignedToMe && (
                  <Badge variant="outline" className="ml-2 align-middle">
                    Toegewezen aan mij
                  </Badge>
                )}
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/retreats/${retreat.id}`} className="block p-3">
                  {formatDateRange(retreat.start_date, retreat.end_date)}
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/retreats/${retreat.id}`} className="block p-3">
                  {retreat.location || "—"}
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/retreats/${retreat.id}`} className="block p-3">
                  {retreat.capacity}
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/retreats/${retreat.id}`} className="block p-3">
                  {formatCurrencyEUR(retreat.price_per_person)}
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/retreats/${retreat.id}`} className="block p-3">
                  <RetreatStatusBadge status={retreat.status} />
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link
                  href={`/retreats/${retreat.id}`}
                  aria-label="Bekijken"
                  className="flex items-center justify-center p-3"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
