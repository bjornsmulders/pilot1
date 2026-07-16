import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PAYMENT_TYPE_LABELS } from "@/lib/validation/payments";
import { formatCurrencyEUR, formatDateTime } from "@/lib/format";
import type { PaymentRow } from "@/lib/supabase/database.types";

export function PaymentList({ payments }: { payments: PaymentRow[] }) {
  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen betalingen geregistreerd.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {payments.map((payment) => (
        <Card key={payment.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="font-medium text-foreground">
                {formatCurrencyEUR(Number(payment.amount))}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {PAYMENT_TYPE_LABELS[payment.type]}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {payment.paid_at ? formatDateTime(payment.paid_at) : formatDateTime(payment.created_at)}
                {payment.provider === "handmatig" ? " · handmatig geregistreerd" : " · Mollie"}
              </p>
            </div>
            <Badge variant={payment.status === "betaald" ? "success" : "outline"}>
              {payment.status === "betaald" ? "Betaald" : payment.status}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
