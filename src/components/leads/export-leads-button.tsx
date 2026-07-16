"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toCsv, downloadCsv } from "@/lib/csv";
import { LEAD_STATUS_LABELS } from "@/lib/validation/leads";
import type { LeadRow } from "@/lib/supabase/database.types";

const COLUMNS = [
  { key: "name", label: "Naam" },
  { key: "email", label: "E-mail" },
  { key: "phone", label: "Telefoon" },
  { key: "source", label: "Bron" },
  { key: "status", label: "Status" },
  { key: "score", label: "Score" },
  { key: "desired_period", label: "Gewenste periode" },
  { key: "destination", label: "Bestemming" },
  { key: "budget_range", label: "Budgetrange" },
  { key: "party_size", label: "Aantal personen" },
  { key: "follow_up_date", label: "Follow-updatum" },
  { key: "created_at", label: "Aangemaakt op" },
];

export function ExportLeadsButton({ leads }: { leads: LeadRow[] }) {
  function handleExport() {
    const rows = leads.map((lead) => ({
      ...lead,
      status: LEAD_STATUS_LABELS[lead.status],
    }));
    const csv = toCsv(rows, COLUMNS);
    downloadCsv(`leads-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <Button type="button" variant="outline" onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" />
      Exporteren
    </Button>
  );
}
