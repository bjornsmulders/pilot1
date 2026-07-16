import { Badge } from "@/components/ui/badge";
import { RETREAT_STATUS_LABELS } from "@/lib/validation/retreats";
import type { RetreatStatus } from "@/lib/supabase/database.types";

const VARIANT_BY_STATUS: Record<
  RetreatStatus,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive"
> = {
  concept: "outline",
  inschrijving_open: "success",
  bijna_vol: "warning",
  vol: "secondary",
  afgerond: "outline",
  geannuleerd: "destructive",
};

export function RetreatStatusBadge({ status }: { status: RetreatStatus }) {
  return <Badge variant={VARIANT_BY_STATUS[status]}>{RETREAT_STATUS_LABELS[status]}</Badge>;
}
