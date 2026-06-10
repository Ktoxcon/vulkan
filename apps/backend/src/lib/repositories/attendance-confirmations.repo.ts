import { db } from "@vulkan/lib/db/index";
import { attendanceConfirmations } from "@vulkan/lib/db/schema/attendance-confirmations";
import type { AttendanceConfirmation } from "@vulkan/lib/db/schema/attendance-confirmations.types";
import { salesEvents } from "@vulkan/lib/db/schema/sales-events";
import { users } from "@vulkan/lib/db/schema/users";
import type {
  NewAttendanceConfirmationInput,
  OwnerNotificationContext,
} from "@vulkan/lib/repositories/attendance-confirmations.repo.types";
import type { DbExecutor } from "@vulkan/lib/repositories/capacity.repo.types";
import { eq } from "drizzle-orm";

export const AttendanceConfirmationsRepository = {
  async findByInvitationId(
    invitationId: string,
    executor: DbExecutor = db,
  ): Promise<AttendanceConfirmation | undefined> {
    const [attendanceConfirmation] = await executor
      .select()
      .from(attendanceConfirmations)
      .where(eq(attendanceConfirmations.invitationId, invitationId))
      .limit(1);

    return attendanceConfirmation;
  },

  async create(
    input: NewAttendanceConfirmationInput,
    executor: DbExecutor = db,
  ): Promise<AttendanceConfirmation> {
    const [attendaceConfirmation] = await executor
      .insert(attendanceConfirmations)
      .values(input)
      .returning();

    return attendaceConfirmation as AttendanceConfirmation;
  },

  async findOwnerNotificationContext(
    confirmationId: string,
    executor: DbExecutor = db,
  ): Promise<OwnerNotificationContext | undefined> {
    const [row] = await executor
      .select({
        ownerEmail: users.email,
        ownerName: users.name,
        eventName: salesEvents.name,
        clientFirstName: attendanceConfirmations.firstName,
        clientLastName: attendanceConfirmations.lastName,
        clientEmail: attendanceConfirmations.email,
        attendanceDate: attendanceConfirmations.attendanceDate,
      })
      .from(attendanceConfirmations)
      .innerJoin(
        salesEvents,
        eq(attendanceConfirmations.eventId, salesEvents.id),
      )
      .innerJoin(users, eq(salesEvents.ownerId, users.id))
      .where(eq(attendanceConfirmations.id, confirmationId))
      .limit(1);

    if (!row) return undefined;

    return {
      ownerEmail: row.ownerEmail,
      ownerName: row.ownerName,
      eventName: row.eventName,
      clientName: `${row.clientFirstName} ${row.clientLastName}`.trim(),
      clientEmail: row.clientEmail,
      attendanceDate: row.attendanceDate,
    };
  },
};
