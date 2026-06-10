import { z } from "zod";

export const AttendanceConfirmationBodySchema = z.object({
  firstName: z.string().trim().min(1).max(255),
  lastName: z.string().trim().min(1).max(255),
  email: z.email(),
  attendanceDate: z.coerce.date(),
  offeringIds: z.array(z.uuid()).default([]),
});
