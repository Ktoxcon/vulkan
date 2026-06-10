import type {
  DraftConfirmationDataSchema,
  DraftConfirmationUpsertBodySchema,
} from "@vulkan/lib/validators/draft-confirmation.schemas";
import type { z } from "zod";

export type DraftConfirmationData = z.infer<typeof DraftConfirmationDataSchema>;
export type DraftConfirmationUpsertBody = z.infer<
  typeof DraftConfirmationUpsertBodySchema
>;
