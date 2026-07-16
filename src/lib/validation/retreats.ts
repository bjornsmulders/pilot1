import { z } from "zod";

export const RETREAT_STATUSES = [
  "concept",
  "inschrijving_open",
  "bijna_vol",
  "vol",
  "afgerond",
  "geannuleerd",
] as const;

export const RETREAT_STATUS_LABELS: Record<(typeof RETREAT_STATUSES)[number], string> = {
  concept: "Concept",
  inschrijving_open: "Inschrijving open",
  bijna_vol: "Bijna vol",
  vol: "Vol",
  afgerond: "Afgerond",
  geannuleerd: "Geannuleerd",
};

const dateStringSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Vul een geldige datum in.");

export const retreatSchema = z
  .object({
    title: z.string().trim().min(2, "Vul een titel in."),
    description: z.string().trim().max(4000).optional().or(z.literal("")),
    location: z.string().trim().max(200).optional().or(z.literal("")),
    country: z.string().trim().max(100).optional().or(z.literal("")),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    capacity: z.coerce
      .number()
      .int("Capaciteit moet een heel getal zijn.")
      .min(0, "Capaciteit kan niet negatief zijn."),
    pricePerPerson: z.coerce
      .number()
      .min(0, "Prijs kan niet negatief zijn.")
      .multipleOf(0.01, "Gebruik maximaal twee decimalen."),
    status: z.enum(RETREAT_STATUSES).default("concept"),
    enrollmentVisibility: z.enum(["openbaar", "besloten"]).default("besloten"),
    bookingDeadline: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (value) => !value || !Number.isNaN(Date.parse(value)),
        "Vul een geldige boekingsdeadline in."
      ),
    internalNotes: z.string().trim().max(4000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (new Date(data.endDate) < new Date(data.startDate)) {
      ctx.addIssue({
        code: "custom",
        message: "Einddatum kan niet vóór de startdatum liggen.",
        path: ["endDate"],
      });
    }
    if (
      data.bookingDeadline &&
      new Date(data.bookingDeadline) > new Date(data.startDate)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Boekingsdeadline moet vóór of op de startdatum liggen.",
        path: ["bookingDeadline"],
      });
    }
  });

export type RetreatInput = z.infer<typeof retreatSchema>;
