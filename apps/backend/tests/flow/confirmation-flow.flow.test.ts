import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { createFakeQueue } from "@tests/helpers/fake-queue";
import { createFakeReservationQueue } from "@tests/helpers/fake-reservation-queue";

const fakeEmailQueue = createFakeQueue();
const fakeReservationQueue = createFakeReservationQueue();
const fakeOwnerQueue = createFakeQueue();

vi.mock("@vulkan/lib/queue/invitation-email.queue", () => ({
  getInvitationEmailQueue: () => fakeEmailQueue,
}));

vi.mock("@vulkan/lib/queue/reservation-expiration.queue", () => ({
  getReservationExpirationQueue: () => fakeReservationQueue,
}));

vi.mock("@vulkan/lib/queue/owner-notification.queue", () => ({
  getOwnerNotificationQueue: () => fakeOwnerQueue,
}));

import { app } from "@vulkan/app/main";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { makeEventOffering } from "@tests/fixtures/offerings";
import { seedInvitationFlow } from "@tests/helpers/seed-invitation-flow";
import { signIn } from "@tests/helpers/sign-in";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
  fakeEmailQueue.reset();
  fakeReservationQueue.reset();
  fakeOwnerQueue.reset();
});

afterEach(async () => {
  await testDb.close();
});

describe("epic-4 confirmation flow (wired main.ts + real ConfirmationPort)", () => {
  it("resolve -> reserve -> draft -> confirm -> success -> epic-1 /metrics reflects it", async () => {
    const { owner, event, invitation, client } = await seedInvitationFlow(
      { capacity: 10, status: EventStatus.ACTIVE },
      { status: InvitationStatus.OPENED },
    );
    const product = await makeEventOffering(event.id, owner.id, {
      type: "product",
      name: "Cloud Migration",
    });
    const service = await makeEventOffering(event.id, owner.id, {
      type: "service",
      name: "Managed Support",
    });

    const resolveRes = await request(app).get(`${API_PREFIX}/invitations/${invitation.token}`);
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.eligible).toBe(true);

    const reserveRes = await request(app).post(
      `${API_PREFIX}/invitations/${invitation.token}/reservation`,
    );
    expect(reserveRes.status).toBe(201);
    expect(fakeReservationQueue.jobs).toHaveLength(1);

    const draftRes = await request(app)
      .put(`${API_PREFIX}/invitations/${invitation.token}/draft`)
      .send({
        data: {
          firstName: "Grace",
          lastName: "Hopper",
          email: client.email,
          productIds: [product.offeringId],
        },
      });
    expect(draftRes.status).toBe(200);

    const confirmRes = await request(app)
      .post(`${API_PREFIX}/invitations/${invitation.token}/confirmation`)
      .send({
        firstName: "Grace",
        lastName: "Hopper",
        email: client.email,
        attendanceDate: event.eventStartDate.toISOString(),
        offeringIds: [product.offeringId, service.offeringId],
      });
    expect(confirmRes.status).toBe(201);
    expect(confirmRes.body.data.confirmationId).toBeTruthy();
    expect(fakeOwnerQueue.jobs).toHaveLength(1);
    expect(fakeOwnerQueue.jobs[0]!.data.confirmationId).toBe(
      confirmRes.body.data.confirmationId,
    );
    expect(confirmRes.body.data.interests.products[0].name).toBe(
      "Cloud Migration",
    );

    const afterConfirm = await request(app).get(
      `${API_PREFIX}/invitations/${invitation.token}`,
    );
    expect(afterConfirm.body.data.confirmation.confirmed).toBe(true);
    expect(afterConfirm.body.data.eligible).toBe(false);
    expect(afterConfirm.body.data.reason).toBe("ALREADY_CONFIRMED");

    const draftAfter = await request(app).get(
      `${API_PREFIX}/invitations/${invitation.token}/draft`,
    );
    expect(draftAfter.status).toBe(409);

    const cookie = await signIn(app, owner.email);
    const metricsRes = await request(app)
      .get(`${API_PREFIX}/events/${event.id}/metrics`)
      .set("Cookie", cookie);
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.data.seatsConfirmed).toBe(1);
    expect(metricsRes.body.data.registrationsSubmitted).toBe(1);
    expect(metricsRes.body.data.registrationsStarted).toBe(1);
    expect(metricsRes.body.data.remainingCapacity).toBe(9);
    expect(metricsRes.body.data.clientsWithInterestsSubmitted).toBe(1);
    expect(metricsRes.body.data.mostSelectedProducts[0].name).toBe(
      "Cloud Migration",
    );
  });
});
