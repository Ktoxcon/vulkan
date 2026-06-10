import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { makeInvitation } from "@tests/fixtures/invitations";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { signIn } from "@tests/helpers/sign-in";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;
let app: Express;

beforeEach(async () => {
  testDb = await createTestDb();
  app = createTestApp();
});

afterEach(async () => {
  await testDb.close();
});

describe("invitations routes", () => {
  describe("POST /events/:eventId/invitations (3.4 idempotent generate)", () => {
    it("401 when unauthenticated", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const res = await request(app).post(`${API_PREFIX}/events/${event.id}/invitations`);
      expect(res.status).toBe(401);
    });

    it("403 for a non-owner", async () => {
      const owner = await makeUser({ role: "sales" });
      const stranger = await makeUser({ role: "sales" });
      const cookie = await signIn(app, stranger.email);
      const event = await makeSalesEvent(owner.id);
      await makeRosterWithClients(event.id, owner.id, 2);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/invitations`)
        .set("Cookie", cookie);
      expect(res.status).toBe(403);
    });

    it("201 generates one invitation per roster client; a repeat creates none", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      await makeRosterWithClients(event.id, owner.id, 3);

      const first = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/invitations`)
        .set("Cookie", cookie);
      expect(first.status).toBe(201);
      expect(first.body.data.createdCount).toBe(3);

      const second = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/invitations`)
        .set("Cookie", cookie);
      expect(second.status).toBe(201);
      expect(second.body.data.createdCount).toBe(0);
      expect(second.body.data.alreadyExistingCount).toBe(3);
    });

    it("409 INVITATIONS_ROSTER_MISSING without a roster", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/invitations`)
        .set("Cookie", cookie);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("INVITATIONS_ROSTER_MISSING");
    });
  });

  describe("GET /events/:eventId/invitations (3.8/3.9 list + monitoring)", () => {
    it("returns invitations with the dashboard monitoring counts", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 3);
      await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.SENT,
      });
      await makeInvitation(event.id, clients[1]!.id, {
        status: InvitationStatus.OPENED,
      });
      await makeInvitation(event.id, clients[2]!.id, {
        status: InvitationStatus.FAILED,
      });

      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/invitations`)
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.invitations).toHaveLength(3);
      expect(res.body.data.monitoring).toMatchObject({
        total: 3,
        sent: 1,
        opened: 1,
        failed: 1,
      });
    });

    it("filters by a single status", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 2);
      await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.SENT,
      });
      await makeInvitation(event.id, clients[1]!.id, {
        status: InvitationStatus.FAILED,
      });

      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/invitations`)
        .query({ status: InvitationStatus.FAILED })
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.invitations).toHaveLength(1);
      expect(res.body.data.invitations[0].invitation.status).toBe(
        InvitationStatus.FAILED,
      );
    });

    it("400 VALIDATION_ERROR for an unknown status filter", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/invitations`)
        .query({ status: "bogus" })
        .set("Cookie", cookie);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /events/:eventId/invitations/report (3.10 CSV export)", () => {
    it("downloads a CSV attachment with the expected header", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 1);
      await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.SENT,
        sentAt: new Date("2026-02-02T00:00:00.000Z"),
      });

      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/invitations/report`)
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.headers["content-disposition"]).toContain("attachment");
      expect(res.text.split("\n")[0]).toBe(
        "email,status,sentAt,openedAt,confirmedAt",
      );
      expect(res.text).toContain(clients[0]!.email);
    });
  });
});
