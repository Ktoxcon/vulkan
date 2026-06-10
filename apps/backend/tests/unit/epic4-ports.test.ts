import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { CapacityRepository } from "@vulkan/lib/repositories/capacity.repo";
import { ClientInterestsRepository } from "@vulkan/lib/repositories/client-interests.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import {
  addClientInterests,
  makeAttendanceConfirmation,
} from "@tests/fixtures/attendance-confirmations";
import { makeInvitation } from "@tests/fixtures/invitations";
import { makeEventOffering } from "@tests/fixtures/offerings";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeSeatReservation } from "@tests/fixtures/seat-reservations";
import { makeUser } from "@tests/fixtures/users";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("epic-4 go-live reads feeding epic-1 /metrics + readiness", () => {
  describe("CapacityRepository.getSeatCounts", () => {
    it("returns zeros for an event with no confirmations or reservations", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);

      const stats = await CapacityRepository.getSeatCounts(event.id, new Date());

      expect(stats).toEqual({ confirmedSeats: 0, reservedSeats: 0 });
    });

    it("counts confirmed seats and active (live) reservations only", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 3);
      const inv0 = await makeInvitation(event.id, clients[0]!.id);
      const inv1 = await makeInvitation(event.id, clients[1]!.id);
      const inv2 = await makeInvitation(event.id, clients[2]!.id);

      await makeAttendanceConfirmation(event.id, inv0.id, clients[0]!.id);
      await makeSeatReservation(event.id, inv1.id, {
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      await makeSeatReservation(event.id, inv2.id, {
        status: "expired",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const stats = await CapacityRepository.getSeatCounts(event.id, new Date());

      expect(stats.confirmedSeats).toBe(1);
      expect(stats.reservedSeats).toBe(1);
    });
  });

  describe("ClientInterestsRepository.getInterestStats", () => {
    it("returns empty buckets and zero total when there are no interests", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);

      const stats = await ClientInterestsRepository.getInterestStats(event.id);

      expect(stats).toEqual({ topProducts: [], topServices: [], total: 0 });
    });

    it("groups interests by offering type and counts distinct confirmations", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 2);
      const inv0 = await makeInvitation(event.id, clients[0]!.id);
      const inv1 = await makeInvitation(event.id, clients[1]!.id);

      const product = await makeEventOffering(event.id, owner.id, {
        type: "product",
        name: "Cloud Migration",
      });
      const service = await makeEventOffering(event.id, owner.id, {
        type: "service",
        name: "Managed Support",
      });

      const c0 = await makeAttendanceConfirmation(event.id, inv0.id, clients[0]!.id);
      const c1 = await makeAttendanceConfirmation(event.id, inv1.id, clients[1]!.id);
      await addClientInterests(c0.id, [product.offeringId, service.offeringId]);
      await addClientInterests(c1.id, [product.offeringId]);

      const stats = await ClientInterestsRepository.getInterestStats(event.id);

      expect(stats.topProducts[0]!.name).toBe("Cloud Migration");
      expect(stats.topProducts[0]!.count).toBe(2);
      expect(stats.topServices[0]!.name).toBe("Managed Support");
      expect(stats.topServices[0]!.count).toBe(1);
      expect(stats.total).toBe(2);
    });
  });
});

describe("InvitationsRepository.getStats started/confirmed (epic-4 sets STARTED/CONFIRMED)", () => {
  it("counts STARTED+CONFIRMED as started, and CONFIRMED as confirmed", async () => {
    const owner = await makeUser({ role: "sales" });
    const event = await makeSalesEvent(owner.id);
    const { clients } = await makeRosterWithClients(event.id, owner.id, 4);
    await makeInvitation(event.id, clients[0]!.id, {
      status: InvitationStatus.OPENED,
    });
    await makeInvitation(event.id, clients[1]!.id, {
      status: InvitationStatus.STARTED,
    });
    await makeInvitation(event.id, clients[2]!.id, {
      status: InvitationStatus.CONFIRMED,
    });
    await makeInvitation(event.id, clients[3]!.id, {
      status: InvitationStatus.CONFIRMED,
    });

    const stats = await InvitationsRepository.getStats(event.id);

    expect(stats.invited).toBe(4);
    expect(stats.started).toBe(3);
    expect(stats.confirmed).toBe(2);
  });
});
