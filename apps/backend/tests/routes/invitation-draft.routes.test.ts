import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { seedInvitationFlow } from "@tests/helpers/seed-invitation-flow";
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

describe("public invitation-draft routes (stories 4.5 / 4.9, NO AuthMiddleware)", () => {
  it("GET returns empty data when no draft exists, without a session", async () => {
    const { invitation } = await seedInvitationFlow();

    const res = await request(app).get(
      `${API_PREFIX}/invitations/${invitation.token}/draft`,
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data).toEqual({});
    expect(res.body.data.updatedAt).toBeNull();
  });

  it("PUT upserts draft data and GET restores it", async () => {
    const { invitation } = await seedInvitationFlow();

    const put = await request(app)
      .put(`${API_PREFIX}/invitations/${invitation.token}/draft`)
      .send({ data: { firstName: "Ada", productIds: [] } });
    expect(put.status).toBe(200);
    expect(put.body.data.data.firstName).toBe("Ada");

    const get = await request(app).get(
      `${API_PREFIX}/invitations/${invitation.token}/draft`,
    );
    expect(get.body.data.data.firstName).toBe("Ada");
    expect(get.body.data.updatedAt).not.toBeNull();
  });

  it("404 INVITATION_TOKEN_NOT_FOUND for an unknown token", async () => {
    const res = await request(app).get(`${API_PREFIX}/invitations/unknown-token/draft`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("INVITATION_TOKEN_NOT_FOUND");
  });

  it("409 DRAFT_CONFIRMATION_ALREADY_CONFIRMED for a confirmed invitation", async () => {
    const { invitation } = await seedInvitationFlow(
      {},
      { confirmedAt: new Date("2026-01-01T00:00:00.000Z") },
    );

    const res = await request(app).get(
      `${API_PREFIX}/invitations/${invitation.token}/draft`,
    );
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("DRAFT_CONFIRMATION_ALREADY_CONFIRMED");
  });

  it("400 VALIDATION_ERROR for an invalid draft body", async () => {
    const { invitation } = await seedInvitationFlow();

    const res = await request(app)
      .put(`${API_PREFIX}/invitations/${invitation.token}/draft`)
      .send({ data: { email: "not-an-email" } });
    expect(res.status).toBe(400);
  });
});
