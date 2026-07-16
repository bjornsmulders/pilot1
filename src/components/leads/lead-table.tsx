import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { formatDateShort } from "@/lib/format";
import type { LeadRow } from "@/lib/supabase/database.types";

export function LeadTable({ leads }: { leads: LeadRow[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="font-medium text-foreground">Nog geen leads</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Voeg een lead toe zodra iemand interesse toont in een retreat.
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
            <TableHead>Contact</TableHead>
            <TableHead>Bron</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Follow-up</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                <Link href={`/leads/${lead.id}`} className="hover:underline">
                  {lead.name}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.email || lead.phone || "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{lead.source || "—"}</TableCell>
              <TableCell>{lead.score}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.follow_up_date ? formatDateShort(lead.follow_up_date) : "—"}
              </TableCell>
              <TableCell>
                <LeadStatusBadge status={lead.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
