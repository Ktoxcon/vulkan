import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { makeEventOffering } from "@tests/fixtures/offerings";
import { makeSeatReservation } from "@tests/fixtures/seat-reservations";
import { seedInvitationFlow } from "@tests/helpers/seed-invitation-flow";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vulkan/lib/queue/owner-notification.queue", () => ({
  getOwnerNotificationQueue: () => ({ add: async () => undefined }),
}));

let testDb: TestDb;
let app: Express;

const SingleDayStart = "2099-08-30T00:00:00.000Z";

beforeEach(async () => {
  testDb = await createTestDb();
  app = createTestApp();
});

afterEach(async () => {
  await testDb.close();
});

describe("public attendance-confirmation route (stories 4.6/4.7/4.8, NO AuthMiddleware)", () => {
  it("201 confirms attendance and returns the success payload, no session required", async () => {
    const { event, invitation, client } = await seedInvitationFlow();
    await makeSeatReservation(event.id, invitation.id);
    const product = await makeEventOffering(event.id, event.ownerId, {
      type: "product",
      name: "Cloud Migration",
    });

    const res = await request(app)
      .post(`${API_PREFIX}/invitations/${invitation.token}/confirmation`)
      .send({
        firstName: "Grace",
        lastName: "Hopper",
        email: client.email,
        attendanceDate: SingleDayStart,
        offeringIds: [product.offeringId],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.confirmationId).toBeTruthy();
    expect(res.body.data.message).toBeTruthy();
    expect(res.body.data.interests.products[0].name).toBe("Cloud Migration");

    const reloaded = await InvitationsRepository.findByToken(invitation.token);
    expect(reloaded?.invitation.status).toBe(InvitationStatus.CONFIRMED);
  });

  it("400 EMAIL_MISMATCH when the email differs from the invitation", async () => {
    const { event, invitation } = await seedInvitationFlow();
    await makeSeatReservation(event.id, invitation.id);

    const res = await request(app)
      .post(`${API_PREFIX}/invitations/${invitation.token}/confirmation`)
      .send({
        firstName: "Grace",
        lastName: "Hopper",
        email: "wrong@email.com",
        attendanceDate: SingleDayStart,
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("EMAIL_MISMATCH");
  });

  it("409 ALREADY_CONFIRMED on a second confirmation", async () => {
    const { event, invitation, client } = await seedInvitationFlow();
    await makeSeatReservation(event.id, invitation.id);

    const first = await request(app)
      .post(`${API_PREFIX}/invitations/${invitation.token}/confirmation`)
      .send({
        firstName: "Grace",
        lastName: "Hopper",
        email: client.email,
        attendanceDate: SingleDayStart,
      });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`${API_PREFIX}/invitations/${invitation.token}/confirmation`)
      .send({
        firstName: "Grace",
        lastName: "Hopper",
        email: client.email,
        attendanceDate: SingleDayStart,
      });
    expect(second.status).toBe(409);
    expect(second.body.code).toBe("ALREADY_CONFIRMED");
  });

  it("409 RESERVATION_EXPIRED without an active reservation", async () => {
    const { invitation, client } = await seedInvitationFlow();

    const res = await request(app)
      .post(`${API_PREFIX}/invitations/${invitation.token}/confirmation`)
      .send({
        firstName: "Grace",
        lastName: "Hopper",
        email: client.email,
        attendanceDate: SingleDayStart,
      });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("RESERVATION_EXPIRED");
  });

  it("400 VALIDATION_ERROR when required fields are missing", async () => {
    const { event, invitation } = await seedInvitationFlow();
    await makeSeatReservation(event.id, invitation.id);

    const res = await request(app)
      .post(`${API_PREFIX}/invitations/${invitation.token}/confirmation`)
      .send({ firstName: "Grace" });
    expect(res.status).toBe(400);
  });
});
