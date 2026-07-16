import { Badge } from "@/components/ui/badge";
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/validation/participants";
import type { BookingStatus, PaymentStatus } from "@/lib/supabase/database.types";

const BOOKING_VARIANT: Record<
  BookingStatus,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive"
> = {
  optie: "outline",
  gereserveerd: "secondary",
  bevestigd: "success",
  geannuleerd: "destructive",
  aanwezig: "success",
  no_show: "warning",
};

const PAYMENT_VARIANT: Record<
  PaymentStatus,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive"
> = {
  niet_betaald: "outline",
  gedeeltelijk_betaald: "warning",
  betaald: "success",
  mislukt: "destructive",
  terugbetaald: "secondary",
  geannuleerd: "destructive",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant={BOOKING_VARIANT[status]}>{BOOKING_STATUS_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={PAYMENT_VARIANT[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}
