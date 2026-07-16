import { z } from "zod";

const wachtwoordSchema = z
  .string()
  .min(8, "Wachtwoord moet minimaal 8 tekens bevatten.")
  .regex(/[a-zA-Z]/, "Wachtwoord moet minimaal één letter bevatten.")
  .regex(/[0-9]/, "Wachtwoord moet minimaal één cijfer bevatten.");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Vul je volledige naam in."),
    email: z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in."),
    password: wachtwoordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Wachtwoorden komen niet overeen.",
    path: ["passwordConfirmation"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in."),
  password: z.string().min(1, "Vul je wachtwoord in."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: wachtwoordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Wachtwoorden komen niet overeen.",
    path: ["passwordConfirmation"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
