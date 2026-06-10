import type { z } from "zod";
import type {
  AssignOfferingBodySchema,
  CreateOfferingBodySchema,
  ListOfferingsQuerySchema,
  OfferingType,
  UpdateOfferingBodySchema,
} from "@vulkan/lib/validators/offering.schemas";

export type OfferingTypeValue =
  (typeof OfferingType)[keyof typeof OfferingType];

export type CreateOfferingBody = z.infer<typeof CreateOfferingBodySchema>;
export type UpdateOfferingBody = z.infer<typeof UpdateOfferingBodySchema>;
export type ListOfferingsQuery = z.infer<typeof ListOfferingsQuerySchema>;
export type AssignOfferingBody = z.infer<typeof AssignOfferingBodySchema>;
