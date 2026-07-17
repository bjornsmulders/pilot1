"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { TRANSPORT_TYPES, TRANSPORT_TYPE_LABELS } from "@/lib/validation/onboarding";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { OnboardingPreviewRow } from "@/lib/supabase/database.types";

type BoundAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

function toLocalInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 16);
}

export function OnboardingForm({
  action,
  preview,
}: {
  action: BoundAction;
  preview: OnboardingPreviewRow;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  if (state.status === "success") {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-foreground">
          <p className="font-medium">Bedankt, {preview.participant_full_name}!</p>
          <p className="mt-1 text-muted-foreground">
            Je gegevens zijn opgeslagen. Je kunt deze link later opnieuw openen om iets te
            wijzigen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Reisgegevens</CardTitle>
          <CardDescription>Helpt ons om aankomsten te groeperen en carpools te regelen.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="transportType">Vervoer</Label>
            <Select name="transportType" defaultValue={preview.travel_transport_type ?? ""}>
              <SelectTrigger id="transportType">
                <SelectValue placeholder="Kies vervoerswijze" />
              </SelectTrigger>
              <SelectContent>
                {TRANSPORT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {TRANSPORT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="departureLocation">Vertrekplaats</Label>
            <Input
              id="departureLocation"
              name="departureLocation"
              defaultValue={preview.travel_departure_location ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="airport">Vliegveld (indien van toepassing)</Label>
            <Input id="airport" name="airport" defaultValue={preview.travel_airport ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flightNumber">Vluchtnummer</Label>
            <Input
              id="flightNumber"
              name="flightNumber"
              defaultValue={preview.travel_flight_number ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="arrivalTime">Aankomsttijd</Label>
            <Input
              id="arrivalTime"
              name="arrivalTime"
              type="datetime-local"
              defaultValue={toLocalInputValue(preview.travel_arrival_time)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departureTime">Vertricktijd (terugreis)</Label>
            <Input
              id="departureTime"
              name="departureTime"
              type="datetime-local"
              defaultValue={toLocalInputValue(preview.travel_departure_time)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="carpoolOffered"
              name="carpoolOffered"
              type="checkbox"
              defaultChecked={preview.travel_carpool_offered ?? false}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="carpoolOffered" className="font-normal">
              Ik kan meerijden aanbieden
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="carpoolRequested"
              name="carpoolRequested"
              type="checkbox"
              defaultChecked={preview.travel_carpool_requested ?? false}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="carpoolRequested" className="font-normal">
              Ik zoek een carpool
            </Label>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="travelNotes">Overige reisopmerkingen</Label>
            <Textarea id="travelNotes" name="travelNotes" rows={2} defaultValue={preview.travel_notes ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dieetwensen</CardTitle>
          <CardDescription>Alleen wat nodig is voor de catering — geen medische dossiers.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="dietType">Dieet (bijv. vegetarisch, veganistisch, glutenvrij)</Label>
            <Input id="dietType" name="dietType" defaultValue={preview.diet_type ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dietAllergies">Allergieën</Label>
            <Input id="dietAllergies" name="dietAllergies" defaultValue={preview.diet_allergies ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dietOtherNotes">Overige opmerkingen</Label>
            <Textarea
              id="dietOtherNotes"
              name="dietOtherNotes"
              rows={2}
              defaultValue={preview.diet_other_notes ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Bezig met opslaan…" : "Opslaan"}
      </Button>
    </form>
  );
}
