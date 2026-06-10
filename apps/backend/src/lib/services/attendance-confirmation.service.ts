import {
  EmailMismatchError,
  InvalidAttendanceDateError,
  ReservationExpiredError,
} from "@vulkan/errors/confirmation.errors";
import { AlreadyConfirmedError } from "@vulkan/errors/eligibility.errors";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { ReservationStatus } from "@vulkan/lib/constants/reservation-status";
import { getOwnerNotificationQueue } from "@vulkan/lib/queue/owner-notification.queue";
import { db } from "@vulkan/lib/db/index";
import { draftConfirmations } from "@vulkan/lib/db/schema/draft-confirmations";
import { invitations } from "@vulkan/lib/db/schema/invitations";
import { seatReservations } from "@vulkan/lib/db/schema/seat-reservations";
import { AttendanceConfirmationsRepository } from "@vulkan/lib/repositories/attendance-confirmations.repo";
import type { DbExecutor } from "@vulkan/lib/repositories/capacity.repo.types";
import { ClientInterestsRepository } from "@vulkan/lib/repositories/client-interests.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import type { TokenResolution } from "@vulkan/lib/repositories/invitations.repo.types";
import { SeatReservationsRepository } from "@vulkan/lib/repositories/seat-reservations.repo";
import {
  ConfirmationSuccessMessage,
  MillisecondsPerDay,
} from "@vulkan/lib/services/attendance-confirmation.service.constants";
import type { AttendanceConfirmationView } from "@vulkan/lib/services/attendance-confirmation.service.types";
import { CapacityService } from "@vulkan/lib/services/capacity.service";
import { EligibilityService } from "@vulkan/lib/services/eligibility.service";
import { EligibilityReason } from "@vulkan/lib/services/eligibility.service.constants";
import { EventOfferingsService } from "@vulkan/lib/services/event-offerings.service";
import { InvitationsService } from "@vulkan/lib/services/invitations.service";
import { PortfolioGenerationService } from "@vulkan/lib/services/portfolio-generation.service";
import type { AttendanceConfirmationBody } from "@vulkan/lib/validators/attendance-confirmation.schemas.types";
import { OfferingType } from "@vulkan/lib/validators/offering.schemas";
import { and, eq, gt } from "drizzle-orm";

export const AttendanceConfirmationService = {
  async confirm(
    token: string,
    body: AttendanceConfirmationBody,
  ): Promise<AttendanceConfirmationView> {
    const resolution = await InvitationsRepository.findByToken(token);

    if (!resolution) {
      throw EligibilityService.toError(EligibilityReason.INVALID_TOKEN);
    }

    if (resolution.invitation.confirmedAt !== null) {
      throw new AlreadyConfirmedError();
    }

    AttendanceConfirmationService.assertEmailMatches(resolution, body.email);

    const attendanceDate = AttendanceConfirmationService.resolveAttendanceDate(
      resolution,
      body.attendanceDate,
    );

    await EventOfferingsService.assertOfferingsSelectable(
      resolution.event.id,
      body.offeringIds,
    );

    const now = new Date();

    const { confirmation, offerings } = await db.transaction(async (tx) => {
      await SeatReservationsRepository.lockEvent(resolution.event.id, tx);

      const locked = await InvitationsRepository.findByToken(token, tx);
      await EligibilityService.assertEligible(locked, now, tx);

      const reservation =
        await SeatReservationsRepository.findActiveByInvitation(
          resolution.invitation.id,
          now,
          tx,
        );

      if (!reservation) {
        throw new ReservationExpiredError();
      }

      const snapshot = await CapacityService.snapshot(
        resolution.event.id,
        resolution.event.capacity,
        now,
        tx,
      );

      if (snapshot.availableSeats <= 0) {
        throw EligibilityService.toError(EligibilityReason.CAPACITY_REACHED);
      }

      const created = await AttendanceConfirmationsRepository.create(
        {
          eventId: resolution.event.id,
          invitationId: resolution.invitation.id,
          clientId: resolution.client.id,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          attendanceDate,
          confirmedAt: now,
        },
        tx,
      );

      await ClientInterestsRepository.createMany(
        created.id,
        body.offeringIds,
        tx,
      );

      await PortfolioGenerationService.generate(
        {
          event: resolution.event,
          client: resolution.client,
          confirmationId: created.id,
          ownerId: resolution.event.ownerId,
          offeringIds: body.offeringIds,
        },
        tx,
      );

      await AttendanceConfirmationService.convertReservation(
        reservation.id,
        now,
        tx,
      );

      await SeatReservationsRepository.setInvitationStatus(
        resolution.invitation.id,
        InvitationStatus.CONFIRMED,
        now,
        tx,
      );

      await AttendanceConfirmationService.markInvitationConfirmed(
        resolution.invitation.id,
        now,
        tx,
      );

      await AttendanceConfirmationService.deleteDraft(
        resolution.invitation.id,
        tx,
      );

      const interestOfferings =
        await ClientInterestsRepository.listOfferingsByIds(
          body.offeringIds,
          tx,
        );

      return { confirmation: created, offerings: interestOfferings };
    });

    await AttendanceConfirmationService.enqueueOwnerNotification(
      confirmation.id,
    );

    return {
      message: ConfirmationSuccessMessage,
      confirmationId: confirmation.id,
      confirmedAt: confirmation.confirmedAt,
      attendanceDate: confirmation.attendanceDate,
      event: {
        id: resolution.event.id,
        name: resolution.event.name,
        eventStartDate: resolution.event.eventStartDate,
        eventEndDate: resolution.event.eventEndDate,
      },
      interests: {
        products: offerings
          .filter((offering) => offering.type === OfferingType.PRODUCT)
          .map((offering) => ({
            offeringId: offering.offeringId,
            name: offering.name,
          })),
        services: offerings
          .filter((offering) => offering.type === OfferingType.SERVICE)
          .map((offering) => ({
            offeringId: offering.offeringId,
            name: offering.name,
          })),
      },
    };
  },

  assertEmailMatches(resolution: TokenResolution, email: string): void {
    if (
      resolution.client.email.trim().toLowerCase() !==
      email.trim().toLowerCase()
    ) {
      throw new EmailMismatchError();
    }
  },

  resolveAttendanceDate(resolution: TokenResolution, submitted: Date): Date {
    const available = InvitationsService.buildAttendanceDates(
      resolution.event.eventStartDate,
      resolution.event.eventEndDate !== null &&
        resolution.event.eventEndDate.getTime() >
          resolution.event.eventStartDate.getTime()
        ? resolution.event.eventEndDate
        : null,
    );
    const submittedDay = AttendanceConfirmationService.toDayKey(submitted);
    const match = available.find(
      (date) => AttendanceConfirmationService.toDayKey(date) === submittedDay,
    );

    if (!match) {
      throw new InvalidAttendanceDateError(
        available.map((date) => AttendanceConfirmationService.toDayKey(date)),
      );
    }

    return match;
  },

  toDayKey(date: Date): string {
    return new Date(
      Math.floor(date.getTime() / MillisecondsPerDay) * MillisecondsPerDay,
    )
      .toISOString()
      .slice(0, 10);
  },

  async convertReservation(
    reservationId: string,
    now: Date,
    executor: DbExecutor,
  ): Promise<void> {
    await executor
      .update(seatReservations)
      .set({ status: ReservationStatus.CONFIRMED, updatedAt: now })
      .where(
        and(
          eq(seatReservations.id, reservationId),
          eq(seatReservations.status, ReservationStatus.ACTIVE),
          gt(seatReservations.expiresAt, now),
        ),
      );
  },

  async markInvitationConfirmed(
    invitationId: string,
    now: Date,
    executor: DbExecutor,
  ): Promise<void> {
    await executor
      .update(invitations)
      .set({ confirmedAt: now, updatedAt: now })
      .where(eq(invitations.id, invitationId));
  },

  async deleteDraft(invitationId: string, executor: DbExecutor): Promise<void> {
    await executor
      .delete(draftConfirmations)
      .where(eq(draftConfirmations.invitationId, invitationId));
  },

  async enqueueOwnerNotification(confirmationId: string): Promise<void> {
    try {
      await getOwnerNotificationQueue().add(confirmationId, { confirmationId });
    } catch (error) {
      console.error(
        `Failed to enqueue owner notification for confirmation ${confirmationId}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  },
};
