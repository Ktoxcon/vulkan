import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events";
import { EventOfferingsRepository } from "@vulkan/lib/repositories/event-offerings.repo";
import { EventMetricsService } from "@vulkan/lib/services/event-metrics.service";
import {
  addClientInterests,
  makeAttendanceConfirmation,
} from "@tests/fixtures/attendance-confirmations";
import { makeInvitation } from "@tests/fixtures/invitations";
import {
  makeEventOffering,
  makeOffering,
} from "@tests/fixtures/offerings";
import { makeRosterWithClients, type RosterMemberFixture } from "@tests/fixtures/rosters";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeSeatReservation } from "@tests/fixtures/seat-reservations";
import { makeUser } from "@tests/fixtures/users";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;

async function seedEvent(
  overrides: Partial<{ capacity: number }> = {},
): Promise<SalesEvent> {
  const owner = await makeUser({ role: "sales" });
  return makeSalesEvent(owner.id, {
    capacity: overrides.capacity ?? 30,
  });
}

async function seedRoster(
  event: SalesEvent,
  count: number,
): Promise<RosterMemberFixture[]> {
  const { clients } = await makeRosterWithClients(event.id, event.ownerId, count);
  return clients;
}

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("EventMetricsService", () => {
  describe("getMetrics", () => {
    it("reports honest zeros over empty data", async () => {
      const event = await seedEvent();
      const metrics = await EventMetricsService.getMetrics(event);

      expect(metrics.totalInvites).toBe(0);
      expect(metrics.openedInvites).toBe(0);
      expect(metrics.registrationsStarted).toBe(0);
      expect(metrics.registrationsSubmitted).toBe(0);
      expect(metrics.clientsWithInterestsSubmitted).toBe(0);
      expect(metrics.seatsReserved).toBe(0);
      expect(metrics.seatsConfirmed).toBe(0);
      expect(metrics.remainingCapacity).toBe(30);
      expect(metrics.mostSelectedProducts).toEqual([]);
      expect(metrics.mostSelectedServices).toEqual([]);
      expect(metrics.capacity).toBe(30);
    });

    it("surfaces seeded data and computes remaining capacity", async () => {
      const event = await seedEvent({ capacity: 30 });
      const clients = await seedRoster(event, 5);

      await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.OPENED,
      });
      await makeInvitation(event.id, clients[1]!.id, {
        status: InvitationStatus.STARTED,
      });
      const inv2 = await makeInvitation(event.id, clients[2]!.id, {
        status: InvitationStatus.CONFIRMED,
      });
      const inv3 = await makeInvitation(event.id, clients[3]!.id, {
        status: InvitationStatus.CONFIRMED,
      });

      const product = await makeEventOffering(event.id, event.ownerId, {
        type: "product",
        name: "Cloud Migration",
      });
      const service = await makeEventOffering(event.id, event.ownerId, {
        type: "service",
        name: "Managed Support",
      });

      const c2 = await makeAttendanceConfirmation(
        event.id,
        inv2.id,
        clients[2]!.id,
      );
      const c3 = await makeAttendanceConfirmation(
        event.id,
        inv3.id,
        clients[3]!.id,
      );
      await addClientInterests(c2.id, [product.offeringId, service.offeringId]);
      await addClientInterests(c3.id, [product.offeringId]);

      const invRes = await makeInvitation(event.id, clients[4]!.id);
      await makeSeatReservation(event.id, invRes.id, {
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const metrics = await EventMetricsService.getMetrics(event);

      expect(metrics.totalInvites).toBe(5);
      expect(metrics.openedInvites).toBe(1);
      expect(metrics.registrationsStarted).toBe(3);
      expect(metrics.registrationsSubmitted).toBe(2);
      expect(metrics.clientsWithInterestsSubmitted).toBe(2);
      expect(metrics.seatsReserved).toBe(1);
      expect(metrics.seatsConfirmed).toBe(2);
      expect(metrics.remainingCapacity).toBe(28);
      expect(metrics.mostSelectedProducts[0]?.name).toBe("Cloud Migration");
      expect(metrics.mostSelectedServices[0]?.name).toBe("Managed Support");
    });

    it("floors remaining capacity at 0 when over-subscribed", async () => {
      const event = await seedEvent({ capacity: 2 });
      const clients = await seedRoster(event, 3);
      for (const client of clients) {
        const invitation = await makeInvitation(event.id, client.id);
        await makeAttendanceConfirmation(event.id, invitation.id, client.id);
      }

      const metrics = await EventMetricsService.getMetrics(event);
      expect(metrics.seatsConfirmed).toBe(3);
      expect(metrics.remainingCapacity).toBe(0);
    });
  });

  describe("getSummary", () => {
    it("guards all rate calcs against divide-by-zero over empty data", async () => {
      const event = await seedEvent();
      const summary = await EventMetricsService.getSummary(event);

      expect(summary.totalInvited).toBe(0);
      expect(summary.totalRegistered).toBe(0);
      expect(summary.registrationRate).toBe(0);
      expect(summary.confirmedAttendanceRate).toBe(0);
      expect(summary.portfoliosGenerated).toBe(0);
      expect(summary.portfolioGenerationCompletionRate).toBe(0);
      expect(summary.portfoliosAccepted).toBe(0);
      expect(summary.conversionRate).toBe(0);
      expect(summary.offeringsConfigured).toBe(0);
    });

    it("computes registration + confirmed rates from seeded data", async () => {
      const event = await seedEvent({ capacity: 100 });
      const clients = await seedRoster(event, 10);

      const productA = await makeEventOffering(event.id, event.ownerId, {
        type: "product",
        name: "A",
      });
      const serviceB = await makeEventOffering(event.id, event.ownerId, {
        type: "service",
        name: "B",
      });

      // 10 invited total: 2 CONFIRMED with seats+interests, 2 CONFIRMED without
      // seats, 6 OPENED. registered = 4, confirmed seats = 2.
      const seatConfirmations = [];
      for (let index = 0; index < clients.length; index += 1) {
        const client = clients[index]!;
        if (index < 2) {
          const invitation = await makeInvitation(event.id, client.id, {
            status: InvitationStatus.CONFIRMED,
          });
          seatConfirmations.push(
            await makeAttendanceConfirmation(
              event.id,
              invitation.id,
              client.id,
            ),
          );
        } else if (index < 4) {
          await makeInvitation(event.id, client.id, {
            status: InvitationStatus.CONFIRMED,
          });
        } else {
          await makeInvitation(event.id, client.id, {
            status: InvitationStatus.OPENED,
          });
        }
      }

      await addClientInterests(seatConfirmations[0]!.id, [
        productA.offeringId,
        serviceB.offeringId,
      ]);
      await addClientInterests(seatConfirmations[1]!.id, [
        serviceB.offeringId,
      ]);

      const summary = await EventMetricsService.getSummary(event);

      expect(summary.totalInvited).toBe(10);
      expect(summary.totalRegistered).toBe(4);
      expect(summary.registrationRate).toBe(
        Math.round((4 / 10) * 10000) / 10000,
      );
      expect(summary.confirmedAttendanceRate).toBe(
        Math.round((2 / 10) * 10000) / 10000,
      );
      expect(summary.interestDistribution.map((o) => o.name)).toEqual([
        "B",
        "A",
      ]);
      expect(summary.topRequestedOfferings[0]?.name).toBe("B");
      expect(summary.totalInterestSelections).toBe(2);
    });

    it("sources the offering count from the offerings repo", async () => {
      const user = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(user.id);
      const offering = await makeOffering({ name: "Cloud", basePrice: "0.00" });
      await EventOfferingsRepository.assign({
        eventId: event.id,
        offeringId: offering.id,
        actorId: user.id,
      });

      const summary = await EventMetricsService.getSummary(event);
      expect(summary.offeringsConfigured).toBe(1);
    });
  });
});
