import { z } from "zod";

export const TRANSPORT_TYPES = ["vliegtuig", "auto", "trein", "anders"] as const;

export const TRANSPORT_TYPE_LABELS: Record<(typeof TRANSPORT_TYPES)[number], string> = {
  vliegtuig: "Vliegtuig",
  auto: "Auto",
  trein: "Trein",
  anders: "Anders",
};

export const onboardingSchema = z.object({
  transportType: z.enum(TRANSPORT_TYPES).optional().or(z.literal("")),
  departureLocation: z.string().trim().max(200).optional().or(z.literal("")),
  airport: z.string().trim().max(100).optional().or(z.literal("")),
  flightNumber: z.string().trim().max(50).optional().or(z.literal("")),
  arrivalTime: z.string().optional().or(z.literal("")),
  departureTime: z.string().optional().or(z.literal("")),
  carpoolOffered: z.coerce.boolean().default(false),
  carpoolRequested: z.coerce.boolean().default(false),
  travelNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  dietType: z.string().trim().max(200).optional().or(z.literal("")),
  dietAllergies: z.string().trim().max(500).optional().or(z.literal("")),
  dietOtherNotes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
