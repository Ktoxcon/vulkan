import { db } from "@vulkan/lib/db/index";
import { attendanceConfirmations } from "@vulkan/lib/db/schema/attendance-confirmations";
import type { AttendanceConfirmation } from "@vulkan/lib/db/schema/attendance-confirmations.types";
import { clientInterests } from "@vulkan/lib/db/schema/client-interests";

export async function makeAttendanceConfirmation(
  eventId: string,
  invitationId: string,
  clientId: string,
  overrides: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    attendanceDate: Date;
    confirmedAt: Date;
  }> = {},
): Promise<AttendanceConfirmation> {
  const [row] = await db
    .insert(attendanceConfirmations)
    .values({
      eventId,
      invitationId,
      clientId,
      firstName: overrides.firstName ?? "First",
      lastName: overrides.lastName ?? "Last",
      email:
        overrides.email ??
        `confirm-${Math.random().toString(36).slice(2)}@email.com`,
      attendanceDate:
        overrides.attendanceDate ?? new Date("2099-08-30T00:00:00.000Z"),
      ...(overrides.confirmedAt !== undefined
        ? { confirmedAt: overrides.confirmedAt }
        : {}),
    })
    .returning();
  return row as AttendanceConfirmation;
}

export async function addClientInterests(
  confirmationId: string,
  offeringIds: string[],
): Promise<void> {
  if (offeringIds.length === 0) return;
  await db
    .insert(clientInterests)
    .values(offeringIds.map((offeringId) => ({ confirmationId, offeringId })));
}
