import { z } from "zod";

export const EmailTemplateEventIdParamSchema = z.string().uuid();

export const CreateEmailTemplateBodySchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(512),
  htmlBody: z.string().min(1),
  textBody: z.string().min(1),
});

export const UpdateEmailTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(255),
    subject: z.string().min(1).max(512),
    htmlBody: z.string().min(1),
    textBody: z.string().min(1),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });
