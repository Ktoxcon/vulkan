import type {
  CreateUserRequestBodySchema,
  EditUserSchema,
} from "@vulkan/lib/validators/user.schemas";
import type { z } from "zod";

export type CreateUserRequestBody = z.infer<typeof CreateUserRequestBodySchema>;
export type EditUserRequestBody = z.infer<typeof EditUserSchema>;
