import { z } from "zod";
import { PaginationRequestBody } from "@vulkan/lib/validators/pagination.schemas";

export const OfferingType = {
  PRODUCT: "product",
  SERVICE: "service",
} as const;

const offeringTypeValues = Object.values(OfferingType) as [string, ...string[]];

export const CreateOfferingBodySchema = z.object({
  type: z.enum(offeringTypeValues),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  basePrice: z.coerce.number().nonnegative().default(0),
  isActive: z.boolean().optional(),
});

export const UpdateOfferingBodySchema = z
  .object({
    name: z.string().trim().min(1),
    description: z.string().nullable(),
    basePrice: z.coerce.number().nonnegative(),
    isActive: z.boolean(),
  })
  .partial();

export const ListOfferingsQuerySchema = PaginationRequestBody.extend({
  type: z.enum(offeringTypeValues).optional(),
  isActive: z
    .union([z.literal("true"), z.literal("false")])
    .transform((value) => value === "true")
    .optional(),
  search: z.string().trim().min(1).optional(),
});

export const EventIdParamSchema = z.string().uuid();
export const OfferingIdParamSchema = z.string().uuid();

export const AssignOfferingBodySchema = z.object({
  offeringId: z.string().uuid(),
});
