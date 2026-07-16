import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_LABELS } from "@/lib/validation/leads";
import type { LeadStatus } from "@/lib/supabase/database.types";

const VARIANT_BY_STATUS: Record<
  LeadStatus,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive"
> = {
  nieuw: "outline",
  geinteresseerd: "secondary",
  warm: "warning",
  gesprek_gepland: "default",
  geboekt: "success",
  verloren: "destructive",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge variant={VARIANT_BY_STATUS[status]}>{LEAD_STATUS_LABELS[status]}</Badge>;
}
