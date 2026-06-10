import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
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
import { signIn } from "@tests/helpers/sign-in";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;
let app: Express;

async function seedMetrics(
  event: SalesEvent,
  options: {
    invited: number;
    opened: number;
    confirmedNoSeat?: number;
    confirmedSeats: number;
    reservedSeats: number;
    products: string[];
    services: string[];
  },
): Promise<void> {
  const confirmedNoSeat = options.confirmedNoSeat ?? 0;
  const total =
    options.invited +
    confirmedNoSeat +
    options.confirmedSeats +
    options.reservedSeats;
  const { clients } = await makeRosterWithClients(
    event.id,
    event.ownerId,
    total,
  );
  let cursor = 0;

  for (let index = 0; index < options.invited; index += 1) {
    const status =
      index < options.opened
        ? InvitationStatus.OPENED
        : InvitationStatus.SENT;
    await makeInvitation(event.id, clients[cursor]!.id, { status });
    cursor += 1;
  }

  for (let index = 0; index < confirmedNoSeat; index += 1) {
    await makeInvitation(event.id, clients[cursor]!.id, {
      status: InvitationStatus.CONFIRMED,
    });
    cursor += 1;
  }

  const productOfferings = [];
  for (const name of options.products) {
    productOfferings.push(
      await makeEventOffering(event.id, event.ownerId, {
        type: "product",
        name,
      }),
    );
  }
  const serviceOfferings = [];
  for (const name of options.services) {
    serviceOfferings.push(
      await makeEventOffering(event.id, event.ownerId, {
        type: "service",
        name,
      }),
    );
  }

  for (let index = 0; index < options.confirmedSeats; index += 1) {
    const client = clients[cursor]!;
    cursor += 1;
    const invitation = await makeInvitation(event.id, client.id, {
      status: InvitationStatus.CONFIRMED,
    });
    const confirmation = await makeAttendanceConfirmation(
      event.id,
      invitation.id,
      client.id,
    );
    if (index === 0) {
      await addClientInterests(confirmation.id, [
        ...productOfferings.map((o) => o.offeringId),
        ...serviceOfferings.map((o) => o.offeringId),
      ]);
    }
  }

  for (let index = 0; index < options.reservedSeats; index += 1) {
    const client = clients[cursor]!;
    cursor += 1;
    const invitation = await makeInvitation(event.id, client.id);
    await makeSeatReservation(event.id, invitation.id, {
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
  }
}

beforeEach(async () => {
  testDb = await createTestDb();
  app = createTestApp();
});

afterEach(async () => {
  await testDb.close();
});

describe("event-metrics routes", () => {
  describe("GET /events/:eventId/metrics", () => {
    it("401 when unauthenticated", async () => {
      const res = await request(app).get(`${API_PREFIX}/events/11111111-1111-1111-1111-111111111111/metrics`,
      );
      expect(res.status).toBe(401);
    });

    it("404 EVENT_NOT_FOUND when the event does not exist", async () => {
      await makeUser({ email: "owner@vulkan.com" });
      const cookie = await signIn(app, "owner@vulkan.com");

      const res = await request(app)
        .get(`${API_PREFIX}/events/11111111-1111-1111-1111-111111111111/metrics`)
        .set("Cookie", cookie);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("EVENT_NOT_FOUND");
    });

    it("403 EVENT_FORBIDDEN when reading another user's event", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      await makeUser({ email: "other@vulkan.com" });
      const event = await makeSalesEvent(owner.id);

      const cookie = await signIn(app, "other@vulkan.com");
      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/metrics`)
        .set("Cookie", cookie);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("EVENT_FORBIDDEN");
    });

    it("200 returns the dashboard fields for the owner (stub zeros)", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const event = await makeSalesEvent(owner.id);

      const cookie = await signIn(app, "owner@vulkan.com");
      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/metrics`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        eventId: event.id,
        capacity: 30,
        totalInvites: 0,
        openedInvites: 0,
        registrationsStarted: 0,
        registrationsSubmitted: 0,
        clientsWithInterestsSubmitted: 0,
        seatsReserved: 0,
        seatsConfirmed: 0,
        remainingCapacity: 30,
        mostSelectedProducts: [],
        mostSelectedServices: [],
      });
    });

    it("200 reflects seeded data (remaining = capacity - confirmed)", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const event = await makeSalesEvent(owner.id, { capacity: 30 });
      await seedMetrics(event, {
        invited: 5,
        opened: 3,
        confirmedSeats: 25,
        reservedSeats: 2,
        products: ["Cloud Migration"],
        services: ["Managed Support"],
      });

      const cookie = await signIn(app, "owner@vulkan.com");
      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/metrics`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.totalInvites).toBe(32);
      expect(res.body.data.seatsConfirmed).toBe(25);
      expect(res.body.data.seatsReserved).toBe(2);
      expect(res.body.data.remainingCapacity).toBe(5);
      expect(res.body.data.mostSelectedProducts[0].name).toBe(
        "Cloud Migration",
      );
    });

    it("admin can read metrics for any event", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      await makeUser({ email: "admin@vulkan.com", role: "admin" });
      const event = await makeSalesEvent(owner.id);

      const cookie = await signIn(app, "admin@vulkan.com");
      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/metrics`)
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /events/:eventId/summary", () => {
    it("401 when unauthenticated", async () => {
      const res = await request(app).get(`${API_PREFIX}/events/11111111-1111-1111-1111-111111111111/summary`,
      );
      expect(res.status).toBe(401);
    });

    it("403 EVENT_FORBIDDEN when summarizing another user's event", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      await makeUser({ email: "other@vulkan.com" });
      const event = await makeSalesEvent(owner.id);

      const cookie = await signIn(app, "other@vulkan.com");
      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/summary`)
        .set("Cookie", cookie);
      expect(res.status).toBe(403);
    });

    it("200 returns outcome fields with guarded rates (stub zeros)", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const event = await makeSalesEvent(owner.id);

      const cookie = await signIn(app, "owner@vulkan.com");
      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/summary`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        eventId: event.id,
        totalInvited: 0,
        totalRegistered: 0,
        registrationRate: 0,
        confirmedAttendanceRate: 0,
        portfoliosGenerated: 0,
        portfolioGenerationCompletionRate: 0,
        portfoliosAccepted: 0,
        conversionRate: 0,
      });
    });

    it("200 computes rates from seeded data", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const event = await makeSalesEvent(owner.id, { capacity: 30 });
      // total invited = 12 + 3 + 5 = 20; registered (CONFIRMED) = 8; seats = 5
      await seedMetrics(event, {
        invited: 12,
        opened: 0,
        confirmedNoSeat: 3,
        confirmedSeats: 5,
        reservedSeats: 0,
        products: [],
        services: [],
      });

      const cookie = await signIn(app, "owner@vulkan.com");
      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/summary`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.totalInvited).toBe(20);
      expect(res.body.data.totalRegistered).toBe(8);
      expect(res.body.data.registrationRate).toBe(0.4);
      expect(res.body.data.confirmedAttendanceRate).toBe(0.25);
    });
  });
});
