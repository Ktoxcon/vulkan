import { z } from "zod"

export const createOfferingSchema = z.object({
  type: z.enum(["product", "service"], { required_error: "catalog:validation.typeRequired" }),
  name: z.string().min(1, "catalog:validation.nameRequired"),
  description: z.string().optional(),
  basePrice: z.coerce
    .number({ invalid_type_error: "catalog:validation.basePriceNumber" })
    .positive("catalog:validation.basePricePositive"),
  isActive: z.boolean().optional().default(true),
})

export const editOfferingSchema = z.object({
  name: z.string().min(1, "catalog:validation.nameRequired"),
  description: z.string().optional(),
  basePrice: z.coerce
    .number({ invalid_type_error: "catalog:validation.basePriceNumber" })
    .positive("catalog:validation.basePricePositive"),
  isActive: z.boolean().optional(),
})

export type CreateOfferingFormValues = z.input<typeof createOfferingSchema>

export type CreateOfferingFormOutput = z.output<typeof createOfferingSchema>

export type EditOfferingFormValues = z.input<typeof editOfferingSchema>

export type EditOfferingFormOutput = z.output<typeof editOfferingSchema>
