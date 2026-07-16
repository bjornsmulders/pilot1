"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS } from "@/lib/validation/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BoundAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function RegisterPaymentForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
    if (state.status === "success" && state.message) {
      toast.success(state.message);
      formRef.current?.reset();
    }
  }, [state]);

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="amount">Bedrag (EUR)</Label>
        <Input id="amount" name="amount" type="number" min={0.01} step={0.01} required className="w-32" />
        {err("amount") && <p className="text-sm text-destructive">{err("amount")}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select name="type" defaultValue="aanbetaling">
          <SelectTrigger id="type" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {PAYMENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Bezig…" : "Registreer betaling"}
      </Button>
      <p className="w-full text-xs text-muted-foreground">
        Voor betalingen die je buiten JourneyOS om hebt ontvangen (bank, contant).
        Automatische incasso via Mollie volgt later.
      </p>
    </form>
  );
}
