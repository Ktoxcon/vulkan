import { ReservationStatus } from "@vulkan/lib/constants/reservation-status";
import { db } from "@vulkan/lib/db/index";
import { seatReservations } from "@vulkan/lib/db/schema/seat-reservations";
import type { SeatReservation } from "@vulkan/lib/db/schema/seat-reservations.types";

export async function makeSeatReservation(
  eventId: string,
  invitationId: string,
  overrides: Partial<{
    status: string;
    expiresAt: Date;
  }> = {},
): Promise<SeatReservation> {
  const [row] = await db
    .insert(seatReservations)
    .values({
      eventId,
      invitationId,
      status: overrides.status ?? ReservationStatus.ACTIVE,
      expiresAt:
        overrides.expiresAt ?? new Date(Date.now() + 15 * 60 * 1000),
    })
    .returning();
  return row as SeatReservation;
}
