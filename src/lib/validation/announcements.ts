import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(2, "Vul een titel in."),
  body: z.string().trim().min(2, "Vul een bericht in.").max(4000),
  visibleToParticipants: z.coerce.boolean().default(true),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
