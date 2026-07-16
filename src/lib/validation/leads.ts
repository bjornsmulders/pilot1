import { z } from "zod";

export const LEAD_STATUSES = [
  "nieuw",
  "geinteresseerd",
  "warm",
  "gesprek_gepland",
  "geboekt",
  "verloren",
] as const;

export const LEAD_STATUS_LABELS: Record<(typeof LEAD_STATUSES)[number], string> = {
  nieuw: "Nieuw",
  geinteresseerd: "Geïnteresseerd",
  warm: "Warm",
  gesprek_gepland: "Gesprek gepland",
  geboekt: "Geboekt",
  verloren: "Verloren",
};

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Vul een naam in."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Vul een geldig e-mailadres in.")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  retreatId: z.string().uuid().optional().or(z.literal("")),
  source: z.string().trim().max(100).optional().or(z.literal("")),
  desiredPeriod: z.string().trim().max(100).optional().or(z.literal("")),
  destination: z.string().trim().max(100).optional().or(z.literal("")),
  budgetRange: z.string().trim().max(100).optional().or(z.literal("")),
  partySize: z.coerce.number().int().positive().optional().or(z.literal("")),
  whatsappConsent: z.coerce.boolean().default(false),
  marketingConsent: z.coerce.boolean().default(false),
  platformMatchingConsent: z.coerce.boolean().default(false),
  status: z.enum(LEAD_STATUSES).default("nieuw"),
  followUpDate: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const leadActivitySchema = z.object({
  activityType: z.string().trim().min(2, "Vul een type activiteit in."),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  scoreDelta: z.coerce.number().int().min(-100).max(100).default(0),
});

export type LeadActivityInput = z.infer<typeof leadActivitySchema>;

// Schema voor het openbare interesseformulier op /retreat/[publicSlug].
// Bewust smaller dan leadSchema (geen retreatId/source/status/etc. -- die
// worden serverside afgeleid) en met een honeypot-veld tegen eenvoudige bots.
export const publicLeadSchema = z.object({
  name: z.string().trim().min(2, "Vul een naam in."),
  email: z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in."),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  desiredPeriod: z.string().trim().max(100).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  whatsappConsent: z.coerce.boolean().default(false),
  marketingConsent: z.coerce.boolean().default(false),
  platformMatchingConsent: z.coerce.boolean().default(false),
  // Bewust geen max(0)/literal("")-restrictie hier: een bot die dit veld invult
  // moet de rest van de validatie gewoon doorlopen, zodat de server action de
  // honeypot-treffer stil kan afhandelen (nep-succes tonen) in plaats van een
  // zichtbare veldfout -- die zou een bot juist verraden dat het een val is.
  website: z.string().trim().max(200).optional().or(z.literal("")),
});

export type PublicLeadInput = z.infer<typeof publicLeadSchema>;
