import { z } from "zod";

export const scheduleItemSchema = z
  .object({
    title: z.string().trim().min(2, "Vul een titel in."),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    startsAt: z.string().optional().or(z.literal("")),
    endsAt: z.string().optional().or(z.literal("")),
    location: z.string().trim().max(200).optional().or(z.literal("")),
    sortOrder: z.coerce.number().int().default(0),
  })
  .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && new Date(data.endsAt) < new Date(data.startsAt)) {
      ctx.addIssue({
        code: "custom",
        message: "Eindtijd kan niet vóór de starttijd liggen.",
        path: ["endsAt"],
      });
    }
  });

export type ScheduleItemInput = z.infer<typeof scheduleItemSchema>;
