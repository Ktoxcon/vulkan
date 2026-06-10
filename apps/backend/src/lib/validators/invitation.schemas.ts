import { InvitationStatusValues } from "@vulkan/lib/constants/invitation-status";
import { z } from "zod";

export const InvitationStatusFilterQuerySchema = z.object({
  status: z
    .union([
      z.enum(InvitationStatusValues),
      z.array(z.enum(InvitationStatusValues)),
    ])
    .optional(),
});

export const InvitationTokenParamSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9_-]+$/);
