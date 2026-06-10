import type { InvitationStatusFilterQuerySchema } from "@vulkan/lib/validators/invitation.schemas";
import type { z } from "zod";

export type InvitationStatusFilterQuery = z.infer<
  typeof InvitationStatusFilterQuerySchema
>;
