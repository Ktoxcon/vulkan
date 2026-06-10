import { OfferingImportStatus } from "@vulkan/lib/constants/offering-import.constants";
import { OfferingType } from "@vulkan/lib/validators/offering.schemas";
import { z } from "zod";

const offeringTypeValues = Object.values(OfferingType) as [string, ...string[]];

export const OfferingImportIdParamSchema = z.uuid();

export const ConfirmOfferingImportBodySchema = z.object({
  status: z.literal(OfferingImportStatus.CONFIRMED),
});

export const OfferingCsvRowSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  type: z.enum(offeringTypeValues),
  description: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .default(null),
  basePrice: z
    .string()
    .trim()
    .min(1, "basePrice is required")
    .transform((value) => Number(value))
    .refine(
      (value) => Number.isFinite(value) && value >= 0,
      "basePrice must be a number greater than or equal to 0",
    ),
});
