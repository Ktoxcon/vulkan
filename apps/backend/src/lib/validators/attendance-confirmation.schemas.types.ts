import type { AttendanceConfirmationBodySchema } from "@vulkan/lib/validators/attendance-confirmation.schemas";
import type { z } from "zod";

export type AttendanceConfirmationBody = z.infer<
  typeof AttendanceConfirmationBodySchema
>;
