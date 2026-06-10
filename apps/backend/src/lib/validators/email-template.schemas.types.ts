import type { z } from "zod";
import type {
  CreateEmailTemplateBodySchema,
  UpdateEmailTemplateBodySchema,
} from "@vulkan/lib/validators/email-template.schemas";

export type CreateEmailTemplateBody = z.infer<
  typeof CreateEmailTemplateBodySchema
>;
export type UpdateEmailTemplateBody = z.infer<
  typeof UpdateEmailTemplateBodySchema
>;
