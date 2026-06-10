import { EventStatus } from "@vulkan/lib/constants/event-status";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import type { TokenResolution } from "@vulkan/lib/repositories/invitations.repo.types";
import { CapacityService } from "@vulkan/lib/services/capacity.service";
import { EligibilityService } from "@vulkan/lib/services/eligibility.service";
import { makeAttendanceConfirmation } from "@tests/fixtures/attendance-confirmations";
import { makeSeatReservation } from "@tests/fixtures/seat-reservations";
import { seedInvitationFlow } from "@tests/helpers/seed-invitation-flow";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;

const now = new Date("2026-08-05T00:00:00.000Z");

async function resolve(token: string): Promise<TokenResolution> {
  const resolution = await InvitationsRepository.findByToken(token);
  return resolution as TokenResolution;
}

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("EligibilityService.evaluate (reason matrix, server-side)", () => {
  it("INVALID_TOKEN when the resolution is undefined", async () => {
    const result = await EligibilityService.evaluate(undefined, now);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("INVALID_TOKEN");
    expect(result.message).toBe("This invitation is invalid.");
  });

  it("eligible when Active, in window, capacity free, not confirmed", async () => {
    const { invitation } = await seedInvitationFlow();
    const result = await EligibilityService.evaluate(
      await resolve(invitation.token),
      now,
    );
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeNull();
  });

  it("ALREADY_CONFIRMED takes precedence over everything else", async () => {
    const { invitation } = await seedInvitationFlow(
      { status: EventStatus.PAUSED },
      { confirmedAt: new Date("2026-01-01T00:00:00.000Z") },
    );
    const result = await EligibilityService.evaluate(
      await resolve(invitation.token),
      now,
    );
    expect(result.reason).toBe("ALREADY_CONFIRMED");
  });

  it("EVENT_PAUSED when the event is paused", async () => {
    const { invitation } = await seedInvitationFlow({
      status: EventStatus.PAUSED,
    });
    const result = await EligibilityService.evaluate(
      await resolve(invitation.token),
      now,
    );
    expect(result.reason).toBe("EVENT_PAUSED");
  });

  it("REGISTRATION_NOT_STARTED before the window opens", async () => {
    const { invitation } = await seedInvitationFlow({
      registrationStartDate: new Date("2026-09-01T00:00:00.000Z"),
      registrationEndDate: new Date("2026-09-15T00:00:00.000Z"),
    });
    const result = await EligibilityService.evaluate(
      await resolve(invitation.token),
      now,
    );
    expect(result.reason).toBe("REGISTRATION_NOT_STARTED");
  });

  it("REGISTRATION_CLOSED after the window ends", async () => {
    const { invitation } = await seedInvitationFlow({
      registrationStartDate: new Date("2026-07-01T00:00:00.000Z"),
      registrationEndDate: new Date("2026-07-15T00:00:00.000Z"),
    });
    const result = await EligibilityService.evaluate(
      await resolve(invitation.token),
      now,
    );
    expect(result.reason).toBe("REGISTRATION_CLOSED");
  });

  it("REGISTRATION_CLOSED when the event is in a non-active, non-paused status (draft)", async () => {
    const { invitation } = await seedInvitationFlow({
      status: EventStatus.DRAFT,
    });
    const result = await EligibilityService.evaluate(
      await resolve(invitation.token),
      now,
    );
    expect(result.reason).toBe("REGISTRATION_CLOSED");
  });

  it("CAPACITY_REACHED when confirmed seats fill the event", async () => {
    const { event, invitation, client } = await seedInvitationFlow({
      capacity: 1,
    });
    await makeAttendanceConfirmation(event.id, invitation.id, client.id);
    const result = await EligibilityService.evaluate(
      await resolve(invitation.token),
      now,
    );
    expect(result.reason).toBe("CAPACITY_REACHED");
  });

  it("CAPACITY_REACHED when active reservations fill the event", async () => {
    const { event, invitation } = await seedInvitationFlow({ capacity: 1 });
    await makeSeatReservation(event.id, invitation.id, {
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    });
    const result = await EligibilityService.evaluate(
      await resolve(invitation.token),
      now,
    );
    expect(result.reason).toBe("CAPACITY_REACHED");
  });
});

describe("EligibilityService.assertEligible (throwing guard)", () => {
  it("returns the resolution when eligible", async () => {
    const { invitation, event } = await seedInvitationFlow();
    const resolution = await EligibilityService.assertEligible(
      await resolve(invitation.token),
      now,
    );
    expect(resolution.event.id).toBe(event.id);
  });

  it("throws the mapped 409 error for a denied reason", async () => {
    const { invitation } = await seedInvitationFlow({
      status: EventStatus.PAUSED,
    });
    await expect(
      EligibilityService.assertEligible(await resolve(invitation.token), now),
    ).rejects.toMatchObject({ code: "EVENT_PAUSED", httpStatusCode: 409 });
  });

  it("throws 404 INVALID_TOKEN for an undefined resolution", async () => {
    await expect(
      EligibilityService.assertEligible(undefined, now),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN", httpStatusCode: 404 });
  });
});

describe("CapacityService.snapshot (capacity math)", () => {
  it("available = capacity - confirmed - active reservations", async () => {
    const { event, invitation, client } = await seedInvitationFlow({
      capacity: 10,
    });
    await makeAttendanceConfirmation(event.id, invitation.id, client.id);
    await makeSeatReservation(event.id, invitation.id, {
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    });

    const snapshot = await CapacityService.snapshot(event.id, 10, now);

    expect(snapshot.capacity).toBe(10);
    expect(snapshot.confirmedSeats).toBe(1);
    expect(snapshot.reservedSeats).toBe(1);
    expect(snapshot.availableSeats).toBe(8);
    expect(CapacityService.hasAvailability(snapshot)).toBe(true);
  });

  it("expired and elapsed reservations are NOT counted (lazy read)", async () => {
    const { event, invitation } = await seedInvitationFlow({ capacity: 10 });
    await makeSeatReservation(event.id, invitation.id, {
      status: "expired",
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    });
    await makeSeatReservation(event.id, invitation.id, {
      status: "active",
      expiresAt: new Date(now.getTime() - 60 * 1000),
    });

    const snapshot = await CapacityService.snapshot(event.id, 10, now);

    expect(snapshot.reservedSeats).toBe(0);
    expect(snapshot.availableSeats).toBe(10);
  });

  it("hasAvailability is false when seats are exhausted", async () => {
    const { event, invitation, client } = await seedInvitationFlow({
      capacity: 1,
    });
    await makeAttendanceConfirmation(event.id, invitation.id, client.id);

    const snapshot = await CapacityService.snapshot(event.id, 1, now);

    expect(snapshot.availableSeats).toBe(0);
    expect(CapacityService.hasAvailability(snapshot)).toBe(false);
  });
});
