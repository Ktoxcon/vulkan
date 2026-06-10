import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { createFakeQueue } from "@tests/helpers/fake-queue";

const fakeQueue = createFakeQueue();

vi.mock("@vulkan/lib/queue/invitation-email.queue", () => ({
  getInvitationEmailQueue: () => fakeQueue,
}));

import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { makeEmailTemplate } from "@tests/fixtures/email-templates";
import { makeInvitation } from "@tests/fixtures/invitations";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { signIn } from "@tests/helpers/sign-in";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDb: TestDb;
let app: Express;

async function seedDispatchable(count: number) {
  const owner = await makeUser({ role: "sales" });
  const event = await makeSalesEvent(owner.id);
  await makeEmailTemplate(event.id, owner.id);
  const { clients } = await makeRosterWithClients(event.id, owner.id, count);
  for (const client of clients) {
    await makeInvitation(event.id, client.id, {
      status: InvitationStatus.PENDING,
    });
  }
  return { owner, event };
}

beforeEach(async () => {
  testDb = await createTestDb();
  app = createTestApp();
  fakeQueue.reset();
});

afterEach(async () => {
  await testDb.close();
});

describe("invitation-dispatch routes (3.6/3.7)", () => {
  describe("POST /events/:eventId/invitation-dispatches", () => {
    it("401 when unauthenticated", async () => {
      const { event } = await seedDispatchable(1);
      const res = await request(app).post(
        `${API_PREFIX}/events/${event.id}/invitation-dispatches`,
      );
      expect(res.status).toBe(401);
    });

    it("403 for a non-owner", async () => {
      const { event } = await seedDispatchable(1);
      const stranger = await makeUser({ role: "sales" });
      const cookie = await signIn(app, stranger.email);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/invitation-dispatches`)
        .set("Cookie", cookie);
      expect(res.status).toBe(403);
    });

    it("202 enqueues pending invitations onto the (fake) queue", async () => {
      const { owner, event } = await seedDispatchable(2);
      const cookie = await signIn(app, owner.email);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/invitation-dispatches`)
        .set("Cookie", cookie);
      expect(res.status).toBe(202);
      expect(res.body.data.queuedCount).toBe(2);
      expect(fakeQueue.jobs).toHaveLength(2);
      expect(res.body.data.progress.queued).toBe(2);
    });

    it("409 DISPATCH_TEMPLATE_MISSING without a template", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 1);
      await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.PENDING,
      });

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/invitation-dispatches`)
        .set("Cookie", cookie);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("DISPATCH_TEMPLATE_MISSING");
    });

    it("409 DISPATCH_NO_PENDING_INVITATIONS when nothing is pending", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      await makeEmailTemplate(event.id, owner.id);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/invitation-dispatches`)
        .set("Cookie", cookie);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("DISPATCH_NO_PENDING_INVITATIONS");
    });
  });

  describe("GET /events/:eventId/invitation-dispatches/:id", () => {
    it("returns progress for the owner", async () => {
      const { owner, event } = await seedDispatchable(2);
      const cookie = await signIn(app, owner.email);

      const res = await request(app)
        .get(
          `${API_PREFIX}/events/${event.id}/invitation-dispatches/${event.id}`,
        )
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ eventId: event.id, total: 2 });
    });

    it("400 VALIDATION_ERROR for a non-uuid id", async () => {
      const { owner, event } = await seedDispatchable(1);
      const cookie = await signIn(app, owner.email);

      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/invitation-dispatches/not-a-uuid`)
        .set("Cookie", cookie);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });
});
