import { ReservationStatus } from "@vulkan/lib/constants/reservation-status";
import { SeatReservationsRepository } from "@vulkan/lib/repositories/seat-reservations.repo";
import { ReservationExpirationWorker } from "@vulkan/lib/queue/reservation-expiration.worker";
import type { ReservationExpirationJobData } from "@vulkan/lib/queue/reservation-expiration.queue.types";
import { makeSeatReservation } from "@tests/fixtures/seat-reservations";
import { seedInvitationFlow } from "@tests/helpers/seed-invitation-flow";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Job } from "bullmq";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDb: TestDb;

function fakeJob(reservationId: string): Job<ReservationExpirationJobData> {
  return { data: { reservationId } } as Job<ReservationExpirationJobData>;
}

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await testDb.close();
});

describe("ReservationExpirationWorker.process (story 4.10)", () => {
  it("flips an elapsed ACTIVE reservation to EXPIRED and logs the release", async () => {
    const { event, invitation } = await seedInvitationFlow();
    const reservation = await makeSeatReservation(event.id, invitation.id, {
      status: ReservationStatus.ACTIVE,
      expiresAt: new Date(Date.now() - 60 * 1000),
    });
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await ReservationExpirationWorker.process(fakeJob(reservation.id));

    const reloaded = await SeatReservationsRepository.findById(reservation.id);
    expect(reloaded?.status).toBe(ReservationStatus.EXPIRED);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0]![0]).toContain(reservation.id);
  });

  it("no-ops for a missing reservation", async () => {
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    await ReservationExpirationWorker.process(
      fakeJob("11111111-1111-4111-8111-111111111111"),
    );
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("does NOT expire a reservation that has not yet elapsed", async () => {
    const { event, invitation } = await seedInvitationFlow();
    const reservation = await makeSeatReservation(event.id, invitation.id, {
      status: ReservationStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await ReservationExpirationWorker.process(fakeJob(reservation.id));

    const reloaded = await SeatReservationsRepository.findById(reservation.id);
    expect(reloaded?.status).toBe(ReservationStatus.ACTIVE);
  });

  it("does NOT re-expire a reservation already CONFIRMED (idempotent / no clobber)", async () => {
    const { event, invitation } = await seedInvitationFlow();
    const reservation = await makeSeatReservation(event.id, invitation.id, {
      status: ReservationStatus.CONFIRMED,
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    await ReservationExpirationWorker.process(fakeJob(reservation.id));

    const reloaded = await SeatReservationsRepository.findById(reservation.id);
    expect(reloaded?.status).toBe(ReservationStatus.CONFIRMED);
  });
});
