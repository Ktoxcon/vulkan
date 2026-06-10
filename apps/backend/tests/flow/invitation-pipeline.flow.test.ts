import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { createFakeQueue } from "@tests/helpers/fake-queue";

const fakeQueue = createFakeQueue();

vi.mock("@vulkan/lib/queue/invitation-email.queue", () => ({
  getInvitationEmailQueue: () => fakeQueue,
}));

import { app } from "@vulkan/app/main";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import { UserRoles } from "@vulkan/lib/constants/roles";
import { validEmailTemplateBody } from "@tests/fixtures/email-templates";
import { buildRosterCsv } from "@tests/helpers/csv-buffer";
import { makeUser } from "@tests/fixtures/users";
import { signIn } from "@tests/helpers/sign-in";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
  fakeQueue.reset();
});

afterEach(async () => {
  await testDb.close();
});

describe("invitation pipeline flow (wired main.ts + real ports)", () => {
  it("walks roster -> template -> invitations -> dispatch -> monitor -> report -> token", async () => {
    await makeUser({ email: "rep@vulkan.com", role: UserRoles.ADMIN });
    const cookie = await signIn(app, "rep@vulkan.com");

    const createRes = await request(app)
      .post(`${API_PREFIX}/events`)
      .set("Cookie", cookie)
      .send({
        name: "Promo Pipeline",
        capacity: 50,
        eventStartDate: "2099-08-30T00:00:00.000Z",
        registrationStartDate: "2000-08-01T00:00:00.000Z",
        registrationEndDate: "2098-08-15T00:00:00.000Z",
      });
    expect(createRes.status).toBe(201);
    const eventId: string = createRes.body.data.id;

    const offeringRes = await request(app)
      .post(`${API_PREFIX}/offerings`)
      .set("Cookie", cookie)
      .send({ type: "product", name: "Cloud Migration", basePrice: 1000 });
    await request(app)
      .post(`${API_PREFIX}/events/${eventId}/offerings`)
      .set("Cookie", cookie)
      .send({ offeringId: offeringRes.body.data.id });

    const uploadRes = await request(app)
      .post(`${API_PREFIX}/events/${eventId}/roster-imports`)
      .set("Cookie", cookie)
      .attach(
        "file",
        buildRosterCsv([
          { name: "John", email: "john@email.com", company: "Acme" },
          { name: "Jane", email: "jane@email.com", company: "Globex" },
        ]),
        { filename: "roster.csv", contentType: "text/csv" },
      );
    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.data.acceptedCount).toBe(2);

    const confirmRes = await request(app)
      .patch(`${API_PREFIX}/events/${eventId}/roster-imports/${uploadRes.body.data.id}`)
      .set("Cookie", cookie)
      .send({ status: "confirmed" });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.totalClients).toBe(2);

    const templateRes = await request(app)
      .post(`${API_PREFIX}/events/${eventId}/email-template`)
      .set("Cookie", cookie)
      .send(validEmailTemplateBody);
    expect(templateRes.status).toBe(201);

    const generateRes = await request(app)
      .post(`${API_PREFIX}/events/${eventId}/invitations`)
      .set("Cookie", cookie);
    expect(generateRes.status).toBe(201);
    expect(generateRes.body.data.createdCount).toBe(2);

    const readinessRes = await request(app)
      .get(`${API_PREFIX}/events/${eventId}/readiness`)
      .set("Cookie", cookie);
    expect(readinessRes.status).toBe(200);
    expect(readinessRes.body.data.checks.rosterUploaded).toBe(true);
    expect(readinessRes.body.data.checks.rosterHasValidClient).toBe(true);
    expect(readinessRes.body.data.checks.inviteTokensReady).toBe(true);
    expect(readinessRes.body.data.checks.emailTemplateConfigured).toBe(true);
    expect(readinessRes.body.data.ready).toBe(true);

    const launchRes = await request(app)
      .patch(`${API_PREFIX}/events/${eventId}`)
      .set("Cookie", cookie)
      .send({ status: EventStatus.ACTIVE });
    expect(launchRes.status).toBe(200);

    const dispatchRes = await request(app)
      .post(`${API_PREFIX}/events/${eventId}/invitation-dispatches`)
      .set("Cookie", cookie);
    expect(dispatchRes.status).toBe(202);
    expect(dispatchRes.body.data.queuedCount).toBe(2);
    expect(fakeQueue.jobs).toHaveLength(2);

    const listRes = await request(app)
      .get(`${API_PREFIX}/events/${eventId}/invitations`)
      .set("Cookie", cookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.monitoring.total).toBe(2);
    expect(listRes.body.data.monitoring.queued).toBe(2);

    const metricsRes = await request(app)
      .get(`${API_PREFIX}/events/${eventId}/metrics`)
      .set("Cookie", cookie);
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.data.totalInvites).toBe(2);

    const reportRes = await request(app)
      .get(`${API_PREFIX}/events/${eventId}/invitations/report`)
      .set("Cookie", cookie);
    expect(reportRes.status).toBe(200);
    expect(reportRes.text).toContain("john@email.com");

    const token: string = generateRes.body.data.created[0].token;
    const resolveRes = await request(app).get(`${API_PREFIX}/invitations/${token}`);
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.eligible).toBe(true);

    const pixelRes = await request(app).get(`${API_PREFIX}/invitations/${token}/pixel`);
    expect(pixelRes.status).toBe(200);
    expect(pixelRes.headers["content-type"]).toBe("image/gif");

    const afterOpen = await request(app)
      .get(`${API_PREFIX}/events/${eventId}/invitations`)
      .query({ status: "opened" })
      .set("Cookie", cookie);
    expect(afterOpen.body.data.invitations).toHaveLength(1);
  });

  it("readiness reflects real ports: not ready before roster/template/tokens exist", async () => {
    await makeUser({ email: "rep2@vulkan.com", role: UserRoles.SALES });
    const cookie = await signIn(app, "rep2@vulkan.com");

    const createRes = await request(app)
      .post(`${API_PREFIX}/events`)
      .set("Cookie", cookie)
      .send({
        name: "Empty Event",
        capacity: 10,
        eventStartDate: "2099-08-30T00:00:00.000Z",
        registrationStartDate: "2026-08-01T00:00:00.000Z",
        registrationEndDate: "2026-08-15T00:00:00.000Z",
      });
    const eventId: string = createRes.body.data.id;

    const readinessRes = await request(app)
      .get(`${API_PREFIX}/events/${eventId}/readiness`)
      .set("Cookie", cookie);
    expect(readinessRes.body.data.checks.rosterUploaded).toBe(false);
    expect(readinessRes.body.data.checks.inviteTokensReady).toBe(false);
    expect(readinessRes.body.data.checks.emailTemplateConfigured).toBe(false);
    expect(readinessRes.body.data.ready).toBe(false);
  });
});
