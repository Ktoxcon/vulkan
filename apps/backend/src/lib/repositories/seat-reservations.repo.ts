import { ReservationStatus } from "@vulkan/lib/constants/reservation-status";
import { db } from "@vulkan/lib/db/index";
import { invitationStatusEvents } from "@vulkan/lib/db/schema/invitation-status-events";
import { invitations } from "@vulkan/lib/db/schema/invitations";
import { salesEvents } from "@vulkan/lib/db/schema/sales-events";
import { seatReservations } from "@vulkan/lib/db/schema/seat-reservations";
import type { SeatReservation } from "@vulkan/lib/db/schema/seat-reservations.types";
import type { DbExecutor } from "@vulkan/lib/repositories/capacity.repo.types";
import { and, eq, gt } from "drizzle-orm";

export const SeatReservationsRepository = {
  async lockEvent(eventId: string, executor: DbExecutor = db): Promise<void> {
    await executor
      .select({ id: salesEvents.id })
      .from(salesEvents)
      .where(eq(salesEvents.id, eventId))
      .for("update");
  },

  async findActiveByInvitation(
    invitationId: string,
    now: Date,
    executor: DbExecutor = db,
  ): Promise<SeatReservation | undefined> {
    const [row] = await executor
      .select()
      .from(seatReservations)
      .where(
        and(
          eq(seatReservations.invitationId, invitationId),
          eq(seatReservations.status, ReservationStatus.ACTIVE),
          gt(seatReservations.expiresAt, now),
        ),
      )
      .limit(1);
    return row;
  },

  async findById(
    reservationId: string,
    executor: DbExecutor = db,
  ): Promise<SeatReservation | undefined> {
    const [row] = await executor
      .select()
      .from(seatReservations)
      .where(eq(seatReservations.id, reservationId))
      .limit(1);
    return row;
  },

  async create(
    eventId: string,
    invitationId: string,
    expiresAt: Date,
    executor: DbExecutor = db,
  ): Promise<SeatReservation> {
    const [row] = await executor
      .insert(seatReservations)
      .values({
        eventId,
        invitationId,
        status: ReservationStatus.ACTIVE,
        expiresAt,
      })
      .returning();
    return row as SeatReservation;
  },

  async markExpired(
    reservationId: string,
    now: Date,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .update(seatReservations)
      .set({ status: ReservationStatus.EXPIRED, updatedAt: now })
      .where(eq(seatReservations.id, reservationId));
  },

  async setInvitationStatus(
    invitationId: string,
    status: string,
    now: Date,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .update(invitations)
      .set({ status, updatedAt: now })
      .where(eq(invitations.id, invitationId));
    await executor
      .insert(invitationStatusEvents)
      .values({ invitationId, status });
  },
};
