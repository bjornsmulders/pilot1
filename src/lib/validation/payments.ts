import { z } from "zod";

export const PAYMENT_TYPES = ["aanbetaling", "volledige_betaling", "overig"] as const;

export const PAYMENT_TYPE_LABELS: Record<(typeof PAYMENT_TYPES)[number], string> = {
  aanbetaling: "Aanbetaling",
  volledige_betaling: "Volledige betaling",
  overig: "Overig",
};

// Handmatige betalingsregistratie (module J, zonder live Mollie-koppeling --
// zie docs/decisions.md). Organisator int buiten JourneyOS om (bank/contant)
// en registreert het hier zodat de betaalstatus klopt.
export const manualPaymentSchema = z.object({
  type: z.enum(PAYMENT_TYPES).default("aanbetaling"),
  amount: z.coerce
    .number()
    .positive("Bedrag moet groter dan 0 zijn.")
    .multipleOf(0.01, "Gebruik maximaal twee decimalen."),
});

export type ManualPaymentInput = z.infer<typeof manualPaymentSchema>;
