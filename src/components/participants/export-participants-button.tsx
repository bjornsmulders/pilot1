"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toCsv, downloadCsv } from "@/lib/csv";
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/validation/participants";
import type { ParticipantRow } from "@/lib/supabase/database.types";

const COLUMNS = [
  { key: "full_name", label: "Naam" },
  { key: "email", label: "E-mail" },
  { key: "phone", label: "Telefoon" },
  { key: "booking_status", label: "Boekingsstatus" },
  { key: "payment_status", label: "Betaalstatus" },
  { key: "source", label: "Bron" },
  { key: "created_at", label: "Aangemaakt op" },
];

export function ExportParticipantsButton({ participants }: { participants: ParticipantRow[] }) {
  function handleExport() {
    const rows = participants.map((participant) => ({
      ...participant,
      booking_status: BOOKING_STATUS_LABELS[participant.booking_status],
      payment_status: PAYMENT_STATUS_LABELS[participant.payment_status],
    }));
    const csv = toCsv(rows, COLUMNS);
    downloadCsv(`deelnemers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <Button type="button" variant="outline" onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" />
      Exporteren
    </Button>
  );
}
