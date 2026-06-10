import { z } from "zod"

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "invitation-flow:validation.firstNameRequired"),
  lastName: z.string().min(1, "invitation-flow:validation.lastNameRequired"),
  email: z
    .string()
    .min(1, "validation:emailRequired")
    .email("invitation-flow:validation.emailInvalid"),
  attendanceDate: z
    .string()
    .min(1, "invitation-flow:validation.attendanceDateRequired"),
})

export const confirmSchema = personalInfoSchema.extend({
  offeringIds: z.array(z.string().uuid()),
})

export const draftPartialSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    attendanceDate: z.string().min(1),
    productIds: z.array(z.string().uuid()),
    serviceIds: z.array(z.string().uuid()),
  })
  .partial()

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>
export type ConfirmSchemaInput = z.infer<typeof confirmSchema>
export type DraftPartialInput = z.infer<typeof draftPartialSchema>
