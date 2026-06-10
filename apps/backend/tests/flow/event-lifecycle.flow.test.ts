import { app } from "@vulkan/app/main";
import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import { UserRoles } from "@vulkan/lib/constants/roles";
import { makeEmailTemplate } from "@tests/fixtures/email-templates";
import { makeInvitation } from "@tests/fixtures/invitations";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { validSalesEventBody } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { signIn } from "@tests/helpers/sign-in";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("event lifecycle flow (wired main.ts)", () => {
  describe("create -> assign -> readiness -> launch -> pause -> resume -> close", () => {
    it("walks an event through its full lifecycle over the wired app", async () => {
      const rep = await makeUser({
        email: "rep@vulkan.com",
        role: UserRoles.ADMIN,
      });
      const cookie = await signIn(app, "rep@vulkan.com");

      const createRes = await request(app)
        .post(`${API_PREFIX}/events`)
        .set("Cookie", cookie)
        .send(validSalesEventBody);

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.status).toBe(EventStatus.DRAFT);
      const eventId: string = createRes.body.data.id;
      expect(eventId).toBeTruthy();

      const offeringRes = await request(app)
        .post(`${API_PREFIX}/offerings`)
        .set("Cookie", cookie)
        .send({ type: "product", name: "Cloud Migration", basePrice: 1000 });

      expect(offeringRes.status).toBe(201);
      const offeringId: string = offeringRes.body.data.id;
      expect(offeringId).toBeTruthy();

      const assignRes = await request(app)
        .post(`${API_PREFIX}/events/${eventId}/offerings`)
        .set("Cookie", cookie)
        .send({ offeringId });
      expect(assignRes.status).toBe(201);

      const listAssignedRes = await request(app)
        .get(`${API_PREFIX}/events/${eventId}/offerings`)
        .set("Cookie", cookie);
      expect(listAssignedRes.status).toBe(200);
      expect(listAssignedRes.body.data.items).toHaveLength(1);

      const gapRes = await request(app)
        .get(`${API_PREFIX}/events/${eventId}/readiness`)
        .set("Cookie", cookie);

      expect(gapRes.status).toBe(200);
      expect(gapRes.body.data.ready).toBe(false);
      expect(gapRes.body.data.checks.detailsConfigured).toBe(true);
      expect(gapRes.body.data.checks.capacityConfigured).toBe(true);
      expect(gapRes.body.data.checks.offeringsAssigned).toBe(true);
      expect(gapRes.body.data.checks.rosterUploaded).toBe(false);
      expect(gapRes.body.data.checks.inviteTokensReady).toBe(false);
      expect(gapRes.body.data.checks.emailTemplateConfigured).toBe(false);

      const blockedLaunch = await request(app)
        .patch(`${API_PREFIX}/events/${eventId}`)
        .set("Cookie", cookie)
        .send({ status: EventStatus.ACTIVE });
      expect(blockedLaunch.status).toBe(409);
      expect(blockedLaunch.body.code).toBe("EVENT_NOT_READY");
      expect(blockedLaunch.body.details.rosterUploaded).toBe(false);

      await makeEmailTemplate(eventId, rep.id);
      const { clients } = await makeRosterWithClients(eventId, rep.id, 5);
      for (const client of clients) {
        await makeInvitation(eventId, client.id);
      }

      const readyRes = await request(app)
        .get(`${API_PREFIX}/events/${eventId}/readiness`)
        .set("Cookie", cookie);
      expect(readyRes.status).toBe(200);
      expect(readyRes.body.data.ready).toBe(true);

      const launchRes = await request(app)
        .patch(`${API_PREFIX}/events/${eventId}`)
        .set("Cookie", cookie)
        .send({ status: EventStatus.ACTIVE });
      expect(launchRes.status).toBe(200);
      expect(launchRes.body.data.status).toBe(EventStatus.ACTIVE);

      const extraOfferingRes = await request(app)
        .post(`${API_PREFIX}/offerings`)
        .set("Cookie", cookie)
        .send({ type: "service", name: "Post-Launch Add", basePrice: 10 });
      expect(extraOfferingRes.status).toBe(201);

      const dynamicAssign = await request(app)
        .post(`${API_PREFIX}/events/${eventId}/offerings`)
        .set("Cookie", cookie)
        .send({ offeringId: extraOfferingRes.body.data.id });
      expect(dynamicAssign.status).toBe(201);

      const dynamicRemove = await request(app)
        .delete(`${API_PREFIX}/events/${eventId}/offerings/${dynamicAssign.body.data.id}`)
        .set("Cookie", cookie);
      expect(dynamicRemove.status).toBe(200);

      const metricsRes = await request(app)
        .get(`${API_PREFIX}/events/${eventId}/metrics`)
        .set("Cookie", cookie);
      expect(metricsRes.status).toBe(200);
      expect(metricsRes.body.data.status).toBe(EventStatus.ACTIVE);
      expect(metricsRes.body.data.capacity).toBe(30);
      expect(metricsRes.body.data.remainingCapacity).toBe(30);

      const pauseRes = await request(app)
        .patch(`${API_PREFIX}/events/${eventId}`)
        .set("Cookie", cookie)
        .send({ status: EventStatus.PAUSED });
      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.data.status).toBe(EventStatus.PAUSED);

      const resumeRes = await request(app)
        .patch(`${API_PREFIX}/events/${eventId}`)
        .set("Cookie", cookie)
        .send({ status: EventStatus.ACTIVE });
      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.data.status).toBe(EventStatus.ACTIVE);

      const closeRes = await request(app)
        .patch(`${API_PREFIX}/events/${eventId}`)
        .set("Cookie", cookie)
        .send({ status: EventStatus.CLOSED });
      expect(closeRes.status).toBe(200);
      expect(closeRes.body.data.status).toBe(EventStatus.CLOSED);

      const summaryRes = await request(app)
        .get(`${API_PREFIX}/events/${eventId}/summary`)
        .set("Cookie", cookie);
      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.data.status).toBe(EventStatus.CLOSED);

      const closedPause = await request(app)
        .patch(`${API_PREFIX}/events/${eventId}`)
        .set("Cookie", cookie)
        .send({ status: EventStatus.PAUSED });
      expect(closedPause.status).toBe(409);
      expect(closedPause.body.code).toBe("ILLEGAL_EVENT_TRANSITION");
    });
  });

  describe("ownership + auth across the wired surface", () => {
    it("enforces ownership (403 for a stranger)", async () => {
      await makeUser({ email: "owner@vulkan.com", role: UserRoles.SALES });
      await makeUser({ email: "stranger@vulkan.com", role: UserRoles.SALES });

      const ownerCookie = await signIn(app, "owner@vulkan.com");
      const strangerCookie = await signIn(app, "stranger@vulkan.com");

      const createRes = await request(app)
        .post(`${API_PREFIX}/events`)
        .set("Cookie", ownerCookie)
        .send({
          name: "Owned Event",
          capacity: 10,
          eventStartDate: "2099-08-30T00:00:00.000Z",
          registrationStartDate: "2026-08-01T00:00:00.000Z",
          registrationEndDate: "2026-08-15T00:00:00.000Z",
        });
      expect(createRes.status).toBe(201);
      const eventId: string = createRes.body.data.id;

      const readRes = await request(app)
        .get(`${API_PREFIX}/events/${eventId}`)
        .set("Cookie", strangerCookie);
      expect(readRes.status).toBe(403);

      const metricsRes = await request(app)
        .get(`${API_PREFIX}/events/${eventId}/metrics`)
        .set("Cookie", strangerCookie);
      expect(metricsRes.status).toBe(403);

      const patchRes = await request(app)
        .patch(`${API_PREFIX}/events/${eventId}`)
        .set("Cookie", strangerCookie)
        .send({ status: EventStatus.ACTIVE });
      expect(patchRes.status).toBe(403);
    });

    it("rejects the event surface without a session (401)", async () => {
      const res = await request(app).get(`${API_PREFIX}/events`);
      expect(res.status).toBe(401);
    });
  });
});
