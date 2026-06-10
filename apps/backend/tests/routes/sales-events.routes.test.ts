import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { makeAttendanceConfirmation } from "@tests/fixtures/attendance-confirmations";
import { makeInvitation } from "@tests/fixtures/invitations";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeSalesEvent, validSalesEventBody } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { signIn } from "@tests/helpers/sign-in";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;
let app: Express;

async function seedConfirmedSeats(
  eventId: string,
  uploadedBy: string,
  seats: number,
): Promise<void> {
  const { clients } = await makeRosterWithClients(eventId, uploadedBy, seats);
  for (const client of clients) {
    const invitation = await makeInvitation(eventId, client.id);
    await makeAttendanceConfirmation(eventId, invitation.id, client.id);
  }
}

beforeEach(async () => {
  testDb = await createTestDb();
  app = createTestApp();
});

afterEach(async () => {
  await testDb.close();
});

describe("sales-events routes", () => {
  describe("POST /events", () => {
    it("401 when unauthenticated", async () => {
      const res = await request(app).post(`${API_PREFIX}/events`).send(validSalesEventBody);
      expect(res.status).toBe(401);
    });

    it("400 VALIDATION_ERROR for an invalid body", async () => {
      await makeUser({ email: "owner@vulkan.com" });
      const cookie = await signIn(app, "owner@vulkan.com");

      const res = await request(app)
        .post(`${API_PREFIX}/events`)
        .set("Cookie", cookie)
        .send({ ...validSalesEventBody, capacity: -1 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("400 when ownerId is in the body (strict)", async () => {
      await makeUser({ email: "owner@vulkan.com" });
      const cookie = await signIn(app, "owner@vulkan.com");

      const res = await request(app)
        .post(`${API_PREFIX}/events`)
        .set("Cookie", cookie)
        .send({
          ...validSalesEventBody,
          ownerId: "11111111-1111-1111-1111-111111111111",
        });

      expect(res.status).toBe(400);
    });

    it("201 creates a Draft event owned by the caller", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const cookie = await signIn(app, "owner@vulkan.com");

      const res = await request(app)
        .post(`${API_PREFIX}/events`)
        .set("Cookie", cookie)
        .send(validSalesEventBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("draft");
      expect(res.body.data.ownerId).toBe(owner.id);
    });
  });

  describe("GET /events", () => {
    it("returns only the caller's events (owner-scoped)", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const other = await makeUser({ email: "other@vulkan.com" });
      await makeSalesEvent(owner.id);
      await makeSalesEvent(other.id);

      const cookie = await signIn(app, "owner@vulkan.com");
      const res = await request(app).get(`${API_PREFIX}/events`).set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
      expect(res.body.data.items[0].ownerId).toBe(owner.id);
    });

    it("admin sees all events", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      await makeUser({ email: "admin@vulkan.com", role: "admin" });
      await makeSalesEvent(owner.id);

      const cookie = await signIn(app, "admin@vulkan.com");
      const res = await request(app).get(`${API_PREFIX}/events`).set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
    });
  });

  describe("GET /events/:eventId", () => {
    it("404 when the event does not exist", async () => {
      await makeUser({ email: "owner@vulkan.com" });
      const cookie = await signIn(app, "owner@vulkan.com");

      const res = await request(app)
        .get(`${API_PREFIX}/events/11111111-1111-1111-1111-111111111111`)
        .set("Cookie", cookie);
      expect(res.status).toBe(404);
    });

    it("403 EVENT_FORBIDDEN when accessing another user's event", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      await makeUser({ email: "other@vulkan.com" });
      const event = await makeSalesEvent(owner.id);

      const cookie = await signIn(app, "other@vulkan.com");
      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("EVENT_FORBIDDEN");
    });

    it("200 for the owner", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const event = await makeSalesEvent(owner.id);

      const cookie = await signIn(app, "owner@vulkan.com");
      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(event.id);
    });
  });

  describe("PATCH /events/:eventId", () => {
    it("200 updates a Draft event for the owner", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const event = await makeSalesEvent(owner.id);
      const cookie = await signIn(app, "owner@vulkan.com");

      const res = await request(app)
        .patch(`${API_PREFIX}/events/${event.id}`)
        .set("Cookie", cookie)
        .send({ name: "Updated" });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated");
    });

    it("400 for an empty patch", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const event = await makeSalesEvent(owner.id);
      const cookie = await signIn(app, "owner@vulkan.com");

      const res = await request(app)
        .patch(`${API_PREFIX}/events/${event.id}`)
        .set("Cookie", cookie)
        .send({});
      expect(res.status).toBe(400);
    });

    it("403 EVENT_FORBIDDEN when patching another user's event", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      await makeUser({ email: "other@vulkan.com" });
      const event = await makeSalesEvent(owner.id);
      const cookie = await signIn(app, "other@vulkan.com");

      const res = await request(app)
        .patch(`${API_PREFIX}/events/${event.id}`)
        .set("Cookie", cookie)
        .send({ name: "Hax" });
      expect(res.status).toBe(403);
    });

    it("409 CAPACITY_BELOW_CONFIRMED when reducing capacity below confirmed seats", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const event = await makeSalesEvent(owner.id);
      await seedConfirmedSeats(event.id, owner.id, 25);
      const cookie = await signIn(app, "owner@vulkan.com");

      const res = await request(app)
        .patch(`${API_PREFIX}/events/${event.id}`)
        .set("Cookie", cookie)
        .send({ capacity: 10 });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CAPACITY_BELOW_CONFIRMED");
    });

    it("409 ILLEGAL_EVENT_TRANSITION for an illegal status patch (draft -> closed)", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const event = await makeSalesEvent(owner.id);
      const cookie = await signIn(app, "owner@vulkan.com");

      const res = await request(app)
        .patch(`${API_PREFIX}/events/${event.id}`)
        .set("Cookie", cookie)
        .send({ status: "closed" });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("ILLEGAL_EVENT_TRANSITION");
    });

    it("409 EVENT_NOT_READY when launching (status=active) a not-ready Draft", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const event = await makeSalesEvent(owner.id);
      const cookie = await signIn(app, "owner@vulkan.com");

      const res = await request(app)
        .patch(`${API_PREFIX}/events/${event.id}`)
        .set("Cookie", cookie)
        .send({ status: "active" });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EVENT_NOT_READY");
      expect(res.body.details.offeringsAssigned).toBe(false);
    });
  });

  describe("GET /events/:eventId/readiness", () => {
    it("200 reports not-ready with gap-reporting stubs", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      const event = await makeSalesEvent(owner.id);
      const cookie = await signIn(app, "owner@vulkan.com");

      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/readiness`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.ready).toBe(false);
      expect(res.body.data.checks.detailsConfigured).toBe(true);
      expect(res.body.data.checks.offeringsAssigned).toBe(false);
    });

    it("403 when reading another user's readiness", async () => {
      const owner = await makeUser({ email: "owner@vulkan.com" });
      await makeUser({ email: "other@vulkan.com" });
      const event = await makeSalesEvent(owner.id);
      const cookie = await signIn(app, "other@vulkan.com");

      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/readiness`)
        .set("Cookie", cookie);
      expect(res.status).toBe(403);
    });
  });
});
