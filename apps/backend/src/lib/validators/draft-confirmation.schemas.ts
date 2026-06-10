import { z } from "zod";

export const DraftConfirmationDataSchema = z.object({
  firstName: z.string().trim().min(1).max(255).optional(),
  lastName: z.string().trim().min(1).max(255).optional(),
  email: z.email().optional(),
  attendanceDate: z.iso.datetime().optional(),
  productIds: z.array(z.uuid()).optional(),
  serviceIds: z.array(z.uuid()).optional(),
});

export const DraftConfirmationUpsertBodySchema = z.object({
  data: DraftConfirmationDataSchema,
});
