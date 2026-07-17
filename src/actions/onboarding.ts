"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation/onboarding";
import {
  type ActionState,
  errorState,
  fieldErrorsFromZod,
  successState,
} from "@/lib/action-state";

/**
 * Publiek, ongeauthenticeerd -- de token in `submit_onboarding` is de enige
 * autorisatie (zie de migratie 20260716180000_participant_onboarding.sql).
 */
export async function submitOnboardingAction(
  token: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = onboardingSchema.safeParse({
    transportType: formData.get("transportType") ?? "",
    departureLocation: formData.get("departureLocation") ?? "",
    airport: formData.get("airport") ?? "",
    flightNumber: formData.get("flightNumber") ?? "",
    arrivalTime: formData.get("arrivalTime") ?? "",
    departureTime: formData.get("departureTime") ?? "",
    carpoolOffered: formData.get("carpoolOffered") === "on",
    carpoolRequested: formData.get("carpoolRequested") === "on",
    travelNotes: formData.get("travelNotes") ?? "",
    dietType: formData.get("dietType") ?? "",
    dietAllergies: formData.get("dietAllergies") ?? "",
    dietOtherNotes: formData.get("dietOtherNotes") ?? "",
  });

  if (!parsed.success) {
    return errorState("Controleer de gemarkeerde velden.", fieldErrorsFromZod(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_onboarding", {
    invite_token: token,
    transport_type: parsed.data.transportType || null,
    departure_location: parsed.data.departureLocation || null,
    airport: parsed.data.airport || null,
    flight_number: parsed.data.flightNumber || null,
    arrival_time: parsed.data.arrivalTime || null,
    departure_time: parsed.data.departureTime || null,
    carpool_offered: parsed.data.carpoolOffered,
    carpool_requested: parsed.data.carpoolRequested,
    travel_notes: parsed.data.travelNotes || null,
    diet_type: parsed.data.dietType || null,
    diet_allergies: parsed.data.dietAllergies || null,
    diet_other_notes: parsed.data.dietOtherNotes || null,
  });

  if (error) {
    return errorState(
      "Opslaan is niet gelukt. Deze link is mogelijk verlopen -- vraag de organisator om een nieuwe."
    );
  }

  return successState("Bedankt! Je gegevens zijn opgeslagen.");
}
