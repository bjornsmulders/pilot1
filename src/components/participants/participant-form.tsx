"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
} from "@/lib/validation/participants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ParticipantRow } from "@/lib/supabase/database.types";

type BoundAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function ParticipantForm({
  action,
  participant,
  retreats,
  submitLabel = "Deelnemer opslaan",
}: {
  action: BoundAction;
  participant?: ParticipantRow;
  retreats: { id: string; title: string }[];
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Naam</Label>
            <Input id="fullName" name="fullName" defaultValue={participant?.full_name} required />
            {err("fullName") && <p className="text-sm text-destructive">{err("fullName")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="retreatId">Retreat</Label>
            <Select name="retreatId" defaultValue={participant?.retreat_id} required>
              <SelectTrigger id="retreatId">
                <SelectValue placeholder="Kies een retreat" />
              </SelectTrigger>
              <SelectContent>
                {retreats.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err("retreatId") && <p className="text-sm text-destructive">{err("retreatId")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input id="email" name="email" type="email" defaultValue={participant?.email ?? ""} />
            {err("email") && <p className="text-sm text-destructive">{err("email")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefoon</Label>
            <Input id="phone" name="phone" defaultValue={participant?.phone ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookingStatus">Boekingsstatus</Label>
            <Select name="bookingStatus" defaultValue={participant?.booking_status ?? "optie"}>
              <SelectTrigger id="bookingStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOKING_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {BOOKING_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Betaalstatus</Label>
            <Select name="paymentStatus" defaultValue={participant?.payment_status ?? "niet_betaald"}>
              <SelectTrigger id="paymentStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {PAYMENT_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="source">Bron</Label>
            <Input
              id="source"
              name="source"
              placeholder="bijv. lead, referral, handmatig"
              defaultValue={participant?.source ?? ""}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="internalNotes">Interne notities</Label>
            <Textarea
              id="internalNotes"
              name="internalNotes"
              defaultValue={participant?.internal_notes ?? ""}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Alleen zichtbaar voor je team, nooit voor de deelnemer.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Bezig met opslaan…" : submitLabel}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
