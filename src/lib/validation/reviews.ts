import { z } from "zod";

export const publicReviewSchema = z.object({
  authorName: z.string().trim().min(2, "Vul een naam in."),
  rating: z.coerce.number().int().min(1, "Kies een waardering.").max(5),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  // Honeypot, zelfde patroon als publicLeadSchema.
  website: z.string().trim().max(200).optional().or(z.literal("")),
});

export type PublicReviewInput = z.infer<typeof publicReviewSchema>;
