import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { makeAttendanceConfirmation } from "@tests/fixtures/attendance-confirmations";
import { makeDraft } from "@tests/fixtures/draft-confirmations";
import { makeInvitation } from "@tests/fixtures/invitations";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;
let app: Express;

async function seedToken(
  status: string,
  overrides: Parameters<typeof makeSalesEvent>[1] = {},
  invitationOverrides: Parameters<typeof makeInvitation>[2] = {},
) {
  const owner = await makeUser({ role: "sales" });
  const event = await makeSalesEvent(owner.id, { status, ...overrides });
  const { clients } = await makeRosterWithClients(event.id, owner.id, 1);
  const invitation = await makeInvitation(
    event.id,
    clients[0]!.id,
    invitationOverrides,
  );
  return { event, invitation, client: clients[0]! };
}

beforeEach(async () => {
  testDb = await createTestDb();
  app = createTestApp();
});

afterEach(async () => {
  await testDb.close();
});

describe("public invitation-token routes", () => {
  describe("GET /invitations/:token (resolution + eligibility matrix)", () => {
    it("is public: no session required", async () => {
      const { invitation } = await seedToken(EventStatus.ACTIVE, {
        registrationStartDate: new Date("2000-01-01T00:00:00.000Z"),
        registrationEndDate: new Date("2999-01-01T00:00:00.000Z"),
      });

      const res = await request(app).get(`${API_PREFIX}/invitations/${invitation.token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.eligible).toBe(true);
      expect(res.body.data.reason).toBeNull();
      expect(res.body.data.event).toBeDefined();
      expect(res.body.data.client).toBeDefined();
      expect(res.body.data.confirmation.confirmed).toBe(false);
      expect(res.body.data.hasDraft).toBe(false);
    });

    it("404 INVALID_TOKEN for an unknown token", async () => {
      const res = await request(app).get(`${API_PREFIX}/invitations/does-not-exist`);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("INVALID_TOKEN");
    });

    it("blocks Paused events with EVENT_PAUSED", async () => {
      const { invitation } = await seedToken(EventStatus.PAUSED, {
        registrationStartDate: new Date("2000-01-01T00:00:00.000Z"),
        registrationEndDate: new Date("2999-01-01T00:00:00.000Z"),
      });

      const res = await request(app).get(`${API_PREFIX}/invitations/${invitation.token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.eligible).toBe(false);
      expect(res.body.data.reason).toBe("EVENT_PAUSED");
    });

    it("blocks outside the registration window with REGISTRATION_CLOSED", async () => {
      const { invitation } = await seedToken(EventStatus.ACTIVE, {
        registrationStartDate: new Date("2000-01-01T00:00:00.000Z"),
        registrationEndDate: new Date("2000-02-01T00:00:00.000Z"),
      });

      const res = await request(app).get(`${API_PREFIX}/invitations/${invitation.token}`);
      expect(res.body.data.eligible).toBe(false);
      expect(res.body.data.reason).toBe("REGISTRATION_CLOSED");
    });

    it("blocks before the registration window with REGISTRATION_NOT_STARTED", async () => {
      const { invitation } = await seedToken(EventStatus.ACTIVE, {
        registrationStartDate: new Date("2999-01-01T00:00:00.000Z"),
        registrationEndDate: new Date("2999-02-01T00:00:00.000Z"),
      });

      const res = await request(app).get(`${API_PREFIX}/invitations/${invitation.token}`);
      expect(res.body.data.eligible).toBe(false);
      expect(res.body.data.reason).toBe("REGISTRATION_NOT_STARTED");
    });

    it("blocks at capacity with CAPACITY_REACHED (real confirmations fill it)", async () => {
      const { invitation, event, client } = await seedToken(EventStatus.ACTIVE, {
        capacity: 1,
        registrationStartDate: new Date("2000-01-01T00:00:00.000Z"),
        registrationEndDate: new Date("2999-01-01T00:00:00.000Z"),
      });
      await makeAttendanceConfirmation(event.id, invitation.id, client.id);

      const res = await request(app).get(`${API_PREFIX}/invitations/${invitation.token}`);
      expect(res.body.data.eligible).toBe(false);
      expect(res.body.data.reason).toBe("CAPACITY_REACHED");
    });

    it("blocks an already-confirmed invitation with ALREADY_CONFIRMED", async () => {
      const { invitation } = await seedToken(
        EventStatus.ACTIVE,
        {
          registrationStartDate: new Date("2000-01-01T00:00:00.000Z"),
          registrationEndDate: new Date("2999-01-01T00:00:00.000Z"),
        },
        {
          status: InvitationStatus.CONFIRMED,
          confirmedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      );

      const res = await request(app).get(`${API_PREFIX}/invitations/${invitation.token}`);
      expect(res.body.data.eligible).toBe(false);
      expect(res.body.data.reason).toBe("ALREADY_CONFIRMED");
    });

    it("reflects hasDraft once a draft is saved", async () => {
      const { invitation } = await seedToken(EventStatus.ACTIVE, {
        registrationStartDate: new Date("2000-01-01T00:00:00.000Z"),
        registrationEndDate: new Date("2999-01-01T00:00:00.000Z"),
      });
      await makeDraft(invitation.id, { firstName: "Jo" });

      const res = await request(app).get(`${API_PREFIX}/invitations/${invitation.token}`);
      expect(res.body.data.hasDraft).toBe(true);
    });
  });

  describe("GET /invitations/:token/pixel (open-tracking)", () => {
    it("returns a 1x1 gif and flips the invitation to OPENED", async () => {
      const { invitation } = await seedToken(EventStatus.ACTIVE, {}, {
        status: InvitationStatus.SENT,
      });

      const res = await request(app).get(
        `${API_PREFIX}/invitations/${invitation.token}/pixel`,
      );
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("image/gif");
      expect(res.headers["cache-control"]).toContain("no-store");

      const reloaded = await InvitationsRepository.findByToken(invitation.token);
      expect(reloaded?.invitation.status).toBe(InvitationStatus.OPENED);
      expect(reloaded?.invitation.openedAt).not.toBeNull();
    });

    it("returns the gif for an unknown token without error", async () => {
      const res = await request(app).get(`${API_PREFIX}/invitations/nope/pixel`);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("image/gif");
    });
  });
});
