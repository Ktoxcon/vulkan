import { attendanceConfirmations } from "@vulkan/lib/db/schema/attendance-confirmations";

export type AttendanceConfirmation =
  typeof attendanceConfirmations.$inferSelect;
export type NewAttendanceConfirmation =
  typeof attendanceConfirmations.$inferInsert;
