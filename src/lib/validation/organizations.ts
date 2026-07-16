import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Vul de naam van je organisatie in."),
  country: z.string().trim().min(2, "Vul een land in.").default("Nederland"),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Vul een geldig e-mailadres in.")
    .optional()
    .or(z.literal("")),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in."),
  role: z.enum(["admin", "coordinator", "viewer"], {
    message: "Kies een geldige rol.",
  }),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
