import { createFakeReservationQueue } from "@tests/helpers/fake-reservation-queue";

const fakeQueue = createFakeReservationQueue();

vi.mock("@vulkan/lib/queue/reservation-expiration.queue", () => ({
  getReservationExpirationQueue: () => fakeQueue,
}));

import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { ReservationStatus } from "@vulkan/lib/constants/reservation-status";
import { DefaultReservationTimeoutMinutes } from "@vulkan/lib/constants/reservation.constants";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import { InvitationStatusEventsRepository } from "@vulkan/lib/repositories/invitation-status-events.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { SeatReservationsRepository } from "@vulkan/lib/repositories/seat-reservations.repo";
import { SeatReservationService } from "@vulkan/lib/services/seat-reservation.service";
import { makeAttendanceConfirmation } from "@tests/fixtures/attendance-confirmations";
import { seedInvitationFlow } from "@tests/helpers/seed-invitation-flow";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
  fakeQueue.reset();
});

afterEach(async () => {
  await testDb.close();
});

describe("SeatReservationService.reserve (story 4.3)", () => {
  it("creates an ACTIVE reservation, sets invitation STARTED + history, enqueues delayed job", async () => {
    const { event, invitation } = await seedInvitationFlow({
      reservationTimeoutMinutes: 15,
    });

    const result = await SeatReservationService.reserve(invitation.token);

    expect(result.created).toBe(true);
    expect(result.reservation.status).toBe(ReservationStatus.ACTIVE);
    expect(result.reservation.eventId).toBe(event.id);
    expect(result.reservation.invitationId).toBe(invitation.id);
    expect(result.reservation.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const reloaded = await InvitationsRepository.findByToken(invitation.token);
    expect(reloaded?.invitation.status).toBe(InvitationStatus.STARTED);

    const history = await InvitationStatusEventsRepository.listByInvitationId(
      invitation.id,
    );
    expect(history.map((row) => row.status)).toContain(
      InvitationStatus.STARTED,
    );

    expect(fakeQueue.add).toHaveBeenCalledTimes(1);
    expect(fakeQueue.jobs[0]!.data.reservationId).toBe(result.reservation.id);
    expect(fakeQueue.jobs[0]!.opts.delay).toBeGreaterThan(0);
  });

  it("is idempotent: a live reservation is returned (created=false), no duplicate, no new job", async () => {
    const { invitation } = await seedInvitationFlow();

    const first = await SeatReservationService.reserve(invitation.token);
    const second = await SeatReservationService.reserve(invitation.token);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.reservation.id).toBe(first.reservation.id);
    expect(fakeQueue.add).toHaveBeenCalledTimes(1);
  });

  it("OVERSELL PREVENTION: throws CAPACITY_REACHED instead of an over-capacity reservation", async () => {
    const { event, invitation, client } = await seedInvitationFlow({
      capacity: 1,
    });
    await makeAttendanceConfirmation(event.id, invitation.id, client.id);

    await expect(
      SeatReservationService.reserve(invitation.token),
    ).rejects.toMatchObject({ code: "CAPACITY_REACHED", httpStatusCode: 409 });

    const count = await SeatReservationsRepository.findActiveByInvitation(
      invitation.id,
      new Date(),
    );
    expect(count).toBeUndefined();
    expect(fakeQueue.add).not.toHaveBeenCalled();
  });

  it("re-validates eligibility before reserving (paused -> EVENT_PAUSED, no reservation)", async () => {
    const { invitation } = await seedInvitationFlow({
      status: EventStatus.PAUSED,
    });

    await expect(
      SeatReservationService.reserve(invitation.token),
    ).rejects.toMatchObject({ code: "EVENT_PAUSED" });
    expect(fakeQueue.add).not.toHaveBeenCalled();
  });

  it("rejects an unknown token with INVALID_TOKEN", async () => {
    await expect(
      SeatReservationService.reserve("nope-not-real"),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
  });

  describe("computeExpiresAt", () => {
    it("uses the event's configured timeout when positive", async () => {
      const { event } = await seedInvitationFlow({
        reservationTimeoutMinutes: 30,
      });
      const base = new Date("2026-06-01T00:00:00.000Z");
      const expires = SeatReservationService.computeExpiresAt(event, base);
      expect(expires.getTime() - base.getTime()).toBe(30 * 60 * 1000);
    });

    it("falls back to the default timeout when the event timeout is 0", async () => {
      const { event } = await seedInvitationFlow({
        reservationTimeoutMinutes: 0,
      });
      const base = new Date("2026-06-01T00:00:00.000Z");
      const expires = SeatReservationService.computeExpiresAt(event, base);
      expect(expires.getTime() - base.getTime()).toBe(
        DefaultReservationTimeoutMinutes * 60 * 1000,
      );
    });
  });
});
