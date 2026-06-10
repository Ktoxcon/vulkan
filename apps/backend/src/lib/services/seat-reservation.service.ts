import { CapacityReachedError } from "@vulkan/errors/eligibility.errors";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { DefaultReservationTimeoutMinutes } from "@vulkan/lib/constants/reservation.constants";
import { db } from "@vulkan/lib/db/index";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import type { SeatReservation } from "@vulkan/lib/db/schema/seat-reservations.types";
import { getReservationExpirationQueue } from "@vulkan/lib/queue/reservation-expiration.queue";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { SeatReservationsRepository } from "@vulkan/lib/repositories/seat-reservations.repo";
import { CapacityService } from "@vulkan/lib/services/capacity.service";
import { EligibilityService } from "@vulkan/lib/services/eligibility.service";
import { MillisecondsPerMinute } from "@vulkan/lib/services/seat-reservation.service.constants";
import type {
  SeatReservationResult,
  SeatReservationView,
} from "@vulkan/lib/services/seat-reservation.service.types";

export const SeatReservationService = {
  async reserve(token: string): Promise<SeatReservationResult> {
    const resolution = await InvitationsRepository.findByToken(token);
    const now = new Date();
    const eligible = await EligibilityService.assertEligible(resolution, now);
    const { event, invitation } = eligible;

    const result = await db.transaction(async (tx) => {
      await SeatReservationsRepository.lockEvent(event.id, tx);

      const existing = await SeatReservationsRepository.findActiveByInvitation(
        invitation.id,
        now,
        tx,
      );

      if (existing) {
        return { reservation: existing, created: false };
      }

      const snapshot = await CapacityService.snapshot(
        event.id,
        event.capacity,
        now,
        tx,
      );

      if (!CapacityService.hasAvailability(snapshot)) {
        throw new CapacityReachedError();
      }

      const expiresAt = SeatReservationService.computeExpiresAt(event, now);
      const reservation = await SeatReservationsRepository.create(
        event.id,
        invitation.id,
        expiresAt,
        tx,
      );

      await SeatReservationsRepository.setInvitationStatus(
        invitation.id,
        InvitationStatus.STARTED,
        now,
        tx,
      );

      return { reservation, created: true };
    });

    if (result.created) {
      await SeatReservationService.enqueueExpiration(result.reservation, now);
    }

    return {
      reservation: SeatReservationService.toView(result.reservation),
      created: result.created,
    };
  },

  computeExpiresAt(event: SalesEvent, now: Date): Date {
    const minutes =
      event.reservationTimeoutMinutes > 0
        ? event.reservationTimeoutMinutes
        : DefaultReservationTimeoutMinutes;

    return new Date(now.getTime() + minutes * MillisecondsPerMinute);
  },

  async enqueueExpiration(
    reservation: SeatReservation,
    now: Date,
  ): Promise<void> {
    const delay = Math.max(0, reservation.expiresAt.getTime() - now.getTime());

    await getReservationExpirationQueue().add(
      reservation.id,
      { reservationId: reservation.id },
      { delay },
    );
  },

  toView(reservation: SeatReservation): SeatReservationView {
    return {
      id: reservation.id,
      eventId: reservation.eventId,
      invitationId: reservation.invitationId,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
    };
  },
};
