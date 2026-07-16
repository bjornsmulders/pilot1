import { z } from "zod";

export const BOOKING_STATUSES = [
  "optie",
  "gereserveerd",
  "bevestigd",
  "geannuleerd",
  "aanwezig",
  "no_show",
] as const;

export const BOOKING_STATUS_LABELS: Record<(typeof BOOKING_STATUSES)[number], string> = {
  optie: "Optie",
  gereserveerd: "Gereserveerd",
  bevestigd: "Bevestigd",
  geannuleerd: "Geannuleerd",
  aanwezig: "Aanwezig",
  no_show: "No-show",
};

export const PAYMENT_STATUSES = [
  "niet_betaald",
  "gedeeltelijk_betaald",
  "betaald",
  "mislukt",
  "terugbetaald",
  "geannuleerd",
] as const;

export const PAYMENT_STATUS_LABELS: Record<(typeof PAYMENT_STATUSES)[number], string> = {
  niet_betaald: "Niet betaald",
  gedeeltelijk_betaald: "Gedeeltelijk betaald",
  betaald: "Betaald",
  mislukt: "Mislukt",
  terugbetaald: "Terugbetaald",
  geannuleerd: "Geannuleerd",
};

export const participantSchema = z.object({
  fullName: z.string().trim().min(2, "Vul een naam in."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Vul een geldig e-mailadres in.")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  retreatId: z.string().uuid("Kies een retreat."),
  bookingStatus: z.enum(BOOKING_STATUSES).default("optie"),
  paymentStatus: z.enum(PAYMENT_STATUSES).default("niet_betaald"),
  source: z.string().trim().max(100).optional().or(z.literal("")),
  internalNotes: z.string().trim().max(4000).optional().or(z.literal("")),
});

export type ParticipantInput = z.infer<typeof participantSchema>;
