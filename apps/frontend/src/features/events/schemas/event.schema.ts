import { z } from "zod"

const baseEventShape = {
  name: z.string().min(1, "events:validation.nameRequired"),
  description: z.string().optional(),
  capacity: z.coerce
    .number()
    .int("events:validation.capacityInteger")
    .positive("events:validation.capacityPositive"),
  reservationTimeoutMinutes: z.coerce
    .number()
    .int("events:validation.reservationTimeoutInteger")
    .nonnegative("events:validation.reservationTimeoutNonnegative")
    .optional(),
  requireConfirmation: z.boolean().optional(),
  eventStartDate: z.string().min(1, "events:validation.eventStartRequired"),
  eventEndDate: z.string().optional(),
  registrationStartDate: z.string().min(1, "events:validation.registrationStartRequired"),
  registrationEndDate: z.string().min(1, "events:validation.registrationEndRequired"),
}

function refineDates(
  values: {
    eventStartDate?: string
    eventEndDate?: string
    registrationStartDate?: string
    registrationEndDate?: string
  },
  ctx: z.RefinementCtx
) {
  const eventStart = values.eventStartDate ? new Date(values.eventStartDate) : undefined
  const eventEnd = values.eventEndDate ? new Date(values.eventEndDate) : undefined
  const regStart = values.registrationStartDate
    ? new Date(values.registrationStartDate)
    : undefined
  const regEnd = values.registrationEndDate ? new Date(values.registrationEndDate) : undefined

  if (regStart && regEnd && regStart >= regEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["registrationEndDate"],
      message: "events:validation.registrationEndAfterStart",
    })
  }

  if (regEnd && eventStart && regEnd > eventStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["registrationEndDate"],
      message: "events:validation.registrationEndsBeforeEvent",
    })
  }

  if (eventStart && eventEnd && eventEnd < eventStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["eventEndDate"],
      message: "events:validation.eventEndAfterStart",
    })
  }
}

export const createEventSchema = z.object(baseEventShape).superRefine(refineDates)

export const editEventSchema = z
  .object({
    name: baseEventShape.name.optional(),
    description: baseEventShape.description,
    capacity: baseEventShape.capacity.optional(),
    reservationTimeoutMinutes: baseEventShape.reservationTimeoutMinutes,
    requireConfirmation: baseEventShape.requireConfirmation,
    eventStartDate: z
      .string()
      .min(1, "events:validation.eventStartRequired")
      .optional(),
    eventEndDate: baseEventShape.eventEndDate,
    registrationStartDate: z
      .string()
      .min(1, "events:validation.registrationStartRequired")
      .optional(),
    registrationEndDate: z
      .string()
      .min(1, "events:validation.registrationEndRequired")
      .optional(),
  })
  .superRefine(refineDates)

export type CreateEventFormValues = z.infer<typeof createEventSchema>

export type EditEventFormValues = z.infer<typeof editEventSchema>
