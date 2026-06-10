import { z } from "zod"

export const emailTemplateSchema = z.object({
  name: z.string().min(1, "email-templates:nameRequired"),
  subject: z.string().min(1, "email-templates:subjectRequired"),
  htmlBody: z.string().min(1, "email-templates:htmlBodyRequired"),
  textBody: z.string().min(1, "email-templates:textBodyRequired"),
})

export type EmailTemplateFormValues = z.infer<typeof emailTemplateSchema>
