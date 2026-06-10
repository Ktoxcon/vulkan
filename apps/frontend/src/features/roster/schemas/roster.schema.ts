import { z } from "zod"

export const addRosterClientSchema = z.object({
  name: z.string().trim().min(1, "roster:validation.nameRequired"),
  email: z
    .string()
    .trim()
    .min(1, "validation:emailRequired")
    .email("validation:email"),
  company: z.string().trim().optional(),
})

export type AddRosterClientValues = z.infer<typeof addRosterClientSchema>
