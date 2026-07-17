import { z } from "zod";

export const MESSAGE_CHANNELS = ["whatsapp", "email"] as const;

export const MESSAGE_CHANNEL_LABELS: Record<(typeof MESSAGE_CHANNELS)[number], string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
};

export const messageTemplateSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "Vul een korte sleutel in (bijv. welkom).")
    .regex(/^[a-z0-9_]+$/, "Alleen kleine letters, cijfers en underscores."),
  name: z.string().trim().min(2, "Vul een naam in."),
  channel: z.enum(MESSAGE_CHANNELS).default("whatsapp"),
  body: z.string().trim().min(2, "Vul een berichttekst in.").max(2000),
});

export type MessageTemplateInput = z.infer<typeof messageTemplateSchema>;
