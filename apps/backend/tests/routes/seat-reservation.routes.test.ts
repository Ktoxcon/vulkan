import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { createFakeReservationQueue } from "@tests/helpers/fake-reservation-queue";

const fakeQueue = createFakeReservationQueue();

vi.mock("@vulkan/lib/queue/reservation-expiration.queue", () => ({
  getReservationExpirationQueue: () => fakeQueue,
}));

import { EventStatus } from "@vulkan/lib/constants/event-status";
import { ReservationStatus } from "@vulkan/lib/constants/reservation-status";
import { makeAttendanceConfirmation } from "@tests/fixtures/attendance-confirmations";
import { seedInvitationFlow } from "@tests/helpers/seed-invitation-flow";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDb: TestDb;
let app: Express;

beforeEach(async () => {
  testDb = await createTestDb();
  app = createTestApp();
  fakeQueue.reset();
});

afterEach(async () => {
  await testDb.close();
});

describe("public seat-reservation route (story 4.3, NO AuthMiddleware)", () => {
  it("201 creates a reservation and enqueues the expiration job, no session required", async () => {
    const { invitation } = await seedInvitationFlow();

    const res = await request(app).post(
      `${API_PREFIX}/invitations/${invitation.token}/reservation`,
    );

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(ReservationStatus.ACTIVE);
    expect(res.body.data.expiresAt).toBeTruthy();
    expect(fakeQueue.jobs).toHaveLength(1);
  });

  it("200 is idempotent: a second call returns the same live reservation", async () => {
    const { invitation } = await seedInvitationFlow();

    const first = await request(app).post(
      `${API_PREFIX}/invitations/${invitation.token}/reservation`,
    );
    const second = await request(app).post(
      `${API_PREFIX}/invitations/${invitation.token}/reservation`,
    );

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(fakeQueue.jobs).toHaveLength(1);
  });

  it("409 CAPACITY_REACHED when the event is full (oversell prevention)", async () => {
    const { event, invitation, client } = await seedInvitationFlow({
      capacity: 1,
    });
    await makeAttendanceConfirmation(event.id, invitation.id, client.id);

    const res = await request(app).post(
      `${API_PREFIX}/invitations/${invitation.token}/reservation`,
    );
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CAPACITY_REACHED");
    expect(fakeQueue.jobs).toHaveLength(0);
  });

  it("409 EVENT_PAUSED when the event is paused", async () => {
    const { invitation } = await seedInvitationFlow({
      status: EventStatus.PAUSED,
    });

    const res = await request(app).post(
      `${API_PREFIX}/invitations/${invitation.token}/reservation`,
    );
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("EVENT_PAUSED");
  });

  it("404 INVALID_TOKEN for an unknown token", async () => {
    const res = await request(app).post(`${API_PREFIX}/invitations/unknown-token/reservation`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });
});
