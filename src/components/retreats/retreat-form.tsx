"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { RETREAT_STATUSES, RETREAT_STATUS_LABELS } from "@/lib/validation/retreats";
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
import type { RetreatRow } from "@/lib/supabase/database.types";

type BoundAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function RetreatForm({
  action,
  retreat,
  submitLabel = "Retreat opslaan",
}: {
  action: BoundAction;
  retreat?: RetreatRow;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
    if (state.status === "success" && state.message) {
      toast.success(state.message);
    }
  }, [state]);

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" name="title" defaultValue={retreat?.title} required />
            {err("title") && <p className="text-sm text-destructive">{err("title")}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Omschrijving</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={retreat?.description ?? ""}
              rows={4}
            />
            {err("description") && (
              <p className="text-sm text-destructive">{err("description")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Locatie</Label>
            <Input id="location" name="location" defaultValue={retreat?.location ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Land</Label>
            <Input id="country" name="country" defaultValue={retreat?.country ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Startdatum</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={retreat?.start_date ?? ""}
              required
            />
            {err("startDate") && (
              <p className="text-sm text-destructive">{err("startDate")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Einddatum</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={retreat?.end_date ?? ""}
              required
            />
            {err("endDate") && <p className="text-sm text-destructive">{err("endDate")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capaciteit</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={0}
              step={1}
              defaultValue={retreat?.capacity ?? 0}
              required
            />
            {err("capacity") && (
              <p className="text-sm text-destructive">{err("capacity")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricePerPerson">Prijs per persoon (EUR)</Label>
            <Input
              id="pricePerPerson"
              name="pricePerPerson"
              type="number"
              min={0}
              step={0.01}
              defaultValue={retreat?.price_per_person ?? 0}
              required
            />
            {err("pricePerPerson") && (
              <p className="text-sm text-destructive">{err("pricePerPerson")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={retreat?.status ?? "concept"}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETREAT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {RETREAT_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="enrollmentVisibility">Inschrijving</Label>
            <Select
              name="enrollmentVisibility"
              defaultValue={retreat?.enrollment_visibility ?? "besloten"}
            >
              <SelectTrigger id="enrollmentVisibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="besloten">Besloten</SelectItem>
                <SelectItem value="openbaar">Openbaar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="coverImageUrl">Coverafbeelding (URL)</Label>
            <Input
              id="coverImageUrl"
              name="coverImageUrl"
              type="url"
              placeholder="https://…"
              defaultValue={retreat?.cover_image_url ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Plak een link naar een afbeelding (bijv. van je eigen website).
              Wordt gebruikt op de openbare retreatpagina.
            </p>
            {err("coverImageUrl") && (
              <p className="text-sm text-destructive">{err("coverImageUrl")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookingDeadline">Boekingsdeadline</Label>
            <Input
              id="bookingDeadline"
              name="bookingDeadline"
              type="date"
              defaultValue={retreat?.booking_deadline ?? ""}
            />
            {err("bookingDeadline") && (
              <p className="text-sm text-destructive">{err("bookingDeadline")}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="internalNotes">Interne notities</Label>
            <Textarea
              id="internalNotes"
              name="internalNotes"
              defaultValue={retreat?.internal_notes ?? ""}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Alleen zichtbaar voor je team, nooit voor deelnemers.
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
