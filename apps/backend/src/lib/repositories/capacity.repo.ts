import { ReservationStatus } from "@vulkan/lib/constants/reservation-status";
import { db } from "@vulkan/lib/db/index";
import { attendanceConfirmations } from "@vulkan/lib/db/schema/attendance-confirmations";
import { seatReservations } from "@vulkan/lib/db/schema/seat-reservations";
import type {
  DbExecutor,
  SeatCounts,
} from "@vulkan/lib/repositories/capacity.repo.types";
import { and, count, eq, gt } from "drizzle-orm";

export const CapacityRepository = {
  async countConfirmed(
    eventId: string,
    executor: DbExecutor = db,
  ): Promise<number> {
    const [row] = await executor
      .select({ total: count() })
      .from(attendanceConfirmations)
      .where(eq(attendanceConfirmations.eventId, eventId));

    return row?.total ?? 0;
  },

  async countActiveReservations(
    eventId: string,
    now: Date,
    executor: DbExecutor = db,
  ): Promise<number> {
    const [row] = await executor
      .select({ total: count() })
      .from(seatReservations)
      .where(
        and(
          eq(seatReservations.eventId, eventId),
          eq(seatReservations.status, ReservationStatus.ACTIVE),
          gt(seatReservations.expiresAt, now),
        ),
      );

    return row?.total ?? 0;
  },

  async getSeatCounts(
    eventId: string,
    now: Date,
    executor: DbExecutor = db,
  ): Promise<SeatCounts> {
    const confirmedSeats = await CapacityRepository.countConfirmed(
      eventId,
      executor,
    );
    const reservedSeats = await CapacityRepository.countActiveReservations(
      eventId,
      now,
      executor,
    );

    return { confirmedSeats, reservedSeats };
  },
};
