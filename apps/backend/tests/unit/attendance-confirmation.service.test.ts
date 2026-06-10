import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { ReservationStatus } from "@vulkan/lib/constants/reservation-status";
import { AttendanceConfirmationsRepository } from "@vulkan/lib/repositories/attendance-confirmations.repo";
import { DraftConfirmationsRepository } from "@vulkan/lib/repositories/draft-confirmations.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { SeatReservationsRepository } from "@vulkan/lib/repositories/seat-reservations.repo";
import { AttendanceConfirmationService } from "@vulkan/lib/services/attendance-confirmation.service";
import type { AttendanceConfirmationBody } from "@vulkan/lib/validators/attendance-confirmation.schemas.types";
import { makeAttendanceConfirmation } from "@tests/fixtures/attendance-confirmations";
import { makeDraft } from "@tests/fixtures/draft-confirmations";
import { makeInvitation } from "@tests/fixtures/invitations";
import { makeEventOffering } from "@tests/fixtures/offerings";
import { addRosterClient } from "@tests/fixtures/rosters";
import { makeSeatReservation } from "@tests/fixtures/seat-reservations";
import { seedInvitationFlow } from "@tests/helpers/seed-invitation-flow";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vulkan/lib/queue/owner-notification.queue", () => ({
  getOwnerNotificationQueue: () => ({ add: async () => undefined }),
}));

let testDb: TestDb;

const SingleDayStart = new Date("2099-08-30T00:00:00.000Z");

function body(
  email: string,
  overrides: Partial<AttendanceConfirmationBody> = {},
): AttendanceConfirmationBody {
  return {
    firstName: "Grace",
    lastName: "Hopper",
    email,
    attendanceDate: SingleDayStart,
    offeringIds: [],
    ...overrides,
  };
}

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("AttendanceConfirmationService.confirm (stories 4.6/4.7/4.8)", () => {
  it("atomically confirms: writes confirmation + interests, converts reservation, marks CONFIRMED, deletes draft", async () => {
    const { event, invitation, client } = await seedInvitationFlow();
    const reservation = await makeSeatReservation(event.id, invitation.id);
    const product = await makeEventOffering(event.id, event.ownerId, {
      type: "product",
      name: "Cloud Migration",
    });
    const service = await makeEventOffering(event.id, event.ownerId, {
      type: "service",
      name: "Managed Support",
    });
    await makeDraft(invitation.id, { firstName: "draft" });

    const view = await AttendanceConfirmationService.confirm(
      invitation.token,
      body(client.email, {
        offeringIds: [product.offeringId, service.offeringId],
      }),
    );

    expect(view.message).toBeTruthy();
    expect(view.confirmationId).toBeTruthy();
    expect(view.event.id).toBe(event.id);
    expect(view.interests.products.map((p) => p.name)).toContain(
      "Cloud Migration",
    );
    expect(view.interests.services.map((s) => s.name)).toContain(
      "Managed Support",
    );

    const confirmation =
      await AttendanceConfirmationsRepository.findByInvitationId(invitation.id);
    expect(confirmation?.firstName).toBe("Grace");

    const reloadedReservation = await SeatReservationsRepository.findById(
      reservation.id,
    );
    expect(reloadedReservation?.status).toBe(ReservationStatus.CONFIRMED);

    const reloadedInvitation = await InvitationsRepository.findByToken(
      invitation.token,
    );
    expect(reloadedInvitation?.invitation.status).toBe(
      InvitationStatus.CONFIRMED,
    );
    expect(reloadedInvitation?.invitation.confirmedAt).not.toBeNull();

    const draft = await DraftConfirmationsRepository.findByInvitationId(
      invitation.id,
    );
    expect(draft).toBeUndefined();
  });

  it("ALREADY_CONFIRMED (409) when the invitation is already confirmed", async () => {
    const { event, invitation, client } = await seedInvitationFlow(
      {},
      { confirmedAt: new Date("2026-01-01T00:00:00.000Z") },
    );
    await makeSeatReservation(event.id, invitation.id);

    await expect(
      AttendanceConfirmationService.confirm(
        invitation.token,
        body(client.email),
      ),
    ).rejects.toMatchObject({ code: "ALREADY_CONFIRMED", httpStatusCode: 409 });
  });

  it("EMAIL_MISMATCH (400) when the submitted email differs from the invitation email", async () => {
    const { event, invitation } = await seedInvitationFlow();
    await makeSeatReservation(event.id, invitation.id);

    await expect(
      AttendanceConfirmationService.confirm(
        invitation.token,
        body("someone-else@email.com"),
      ),
    ).rejects.toMatchObject({ code: "EMAIL_MISMATCH", httpStatusCode: 400 });
  });

  it("email match is case-insensitive", async () => {
    const { event, invitation, client } = await seedInvitationFlow();
    await makeSeatReservation(event.id, invitation.id);

    const view = await AttendanceConfirmationService.confirm(
      invitation.token,
      body(client.email.toUpperCase()),
    );
    expect(view.confirmationId).toBeTruthy();
  });

  it("INVALID_ATTENDANCE_DATE (400) for a single-day event when the date is not the event date", async () => {
    const { event, invitation, client } = await seedInvitationFlow();
    await makeSeatReservation(event.id, invitation.id);

    await expect(
      AttendanceConfirmationService.confirm(
        invitation.token,
        body(client.email, {
          attendanceDate: new Date("2099-09-15T00:00:00.000Z"),
        }),
      ),
    ).rejects.toMatchObject({
      code: "INVALID_ATTENDANCE_DATE",
      httpStatusCode: 400,
    });
  });

  it("accepts any in-range date for a multi-day event", async () => {
    const { event, invitation, client } = await seedInvitationFlow({
      eventStartDate: new Date("2099-08-30T00:00:00.000Z"),
      eventEndDate: new Date("2099-09-01T00:00:00.000Z"),
    });
    await makeSeatReservation(event.id, invitation.id);

    const view = await AttendanceConfirmationService.confirm(
      invitation.token,
      body(client.email, {
        attendanceDate: new Date("2099-08-31T00:00:00.000Z"),
      }),
    );
    expect(view.attendanceDate).toBeInstanceOf(Date);
  });

  it("RESERVATION_EXPIRED (409) when there is no active reservation", async () => {
    const { invitation, client } = await seedInvitationFlow();

    await expect(
      AttendanceConfirmationService.confirm(
        invitation.token,
        body(client.email),
      ),
    ).rejects.toMatchObject({
      code: "RESERVATION_EXPIRED",
      httpStatusCode: 409,
    });
  });

  it("rolls back the whole transaction when an interest offering is not selectable", async () => {
    const { event, invitation, client } = await seedInvitationFlow();
    await makeSeatReservation(event.id, invitation.id);

    await expect(
      AttendanceConfirmationService.confirm(
        invitation.token,
        body(client.email, {
          offeringIds: ["22222222-2222-4222-8222-222222222222"],
        }),
      ),
    ).rejects.toMatchObject({ code: "OFFERING_NOT_SELECTABLE" });

    const confirmation =
      await AttendanceConfirmationsRepository.findByInvitationId(invitation.id);
    expect(confirmation).toBeUndefined();
    const reloadedInvitation = await InvitationsRepository.findByToken(
      invitation.token,
    );
    expect(reloadedInvitation?.invitation.status).not.toBe(
      InvitationStatus.CONFIRMED,
    );
  });

  it("OVERSELL PREVENTION: rejects confirmation with CAPACITY_REACHED when capacity is full", async () => {
    const { event, invitation, client, roster } = await seedInvitationFlow({
      capacity: 1,
    });
    await makeSeatReservation(event.id, invitation.id);

    const other = await addRosterClient(roster.id);
    const otherInvitation = await makeInvitation(event.id, other.id);
    await makeAttendanceConfirmation(event.id, otherInvitation.id, other.id);

    await expect(
      AttendanceConfirmationService.confirm(
        invitation.token,
        body(client.email),
      ),
    ).rejects.toMatchObject({ code: "CAPACITY_REACHED" });
  });
});
