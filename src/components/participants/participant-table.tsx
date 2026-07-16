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
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/participants/participant-status-badges";
import type { ParticipantRow } from "@/lib/supabase/database.types";

export function ParticipantTable({
  participants,
  retreatTitleById,
}: {
  participants: ParticipantRow[];
  retreatTitleById: Record<string, string>;
}) {
  if (participants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="font-medium text-foreground">Nog geen deelnemers</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Voeg een deelnemer toe, of zet een lead om naar deelnemer.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Naam</TableHead>
            <TableHead>Retreat</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Boeking</TableHead>
            <TableHead>Betaling</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant) => (
            <TableRow key={participant.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/deelnemers/${participant.id}`} className="hover:underline">
                  {participant.full_name}
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/deelnemers/${participant.id}`} className="block p-3 text-sm text-muted-foreground">
                  {retreatTitleById[participant.retreat_id] ?? "—"}
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/deelnemers/${participant.id}`} className="block p-3 text-sm text-muted-foreground">
                  {participant.email || participant.phone || "—"}
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/deelnemers/${participant.id}`} className="block p-3">
                  <BookingStatusBadge status={participant.booking_status} />
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/deelnemers/${participant.id}`} className="block p-3">
                  <PaymentStatusBadge status={participant.payment_status} />
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link
                  href={`/deelnemers/${participant.id}`}
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
