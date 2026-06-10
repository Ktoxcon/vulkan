import { EventStatus } from "@vulkan/lib/constants/event-status";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { InvitationStatusEventsRepository } from "@vulkan/lib/repositories/invitation-status-events.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { InvitationsService } from "@vulkan/lib/services/invitations.service";
import { TrackingPixelGif } from "@vulkan/lib/services/invitations.service.constants";
import { makeInvitation } from "@tests/fixtures/invitations";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("InvitationsService", () => {
  describe("generateToken (story 3.4 security)", () => {
    it("produces unique, non-sequential, url-safe tokens", () => {
      const tokens = new Set<string>();
      for (let index = 0; index < 500; index += 1) {
        const token = InvitationsService.generateToken();
        expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(token.length).toBeGreaterThanOrEqual(40);
        tokens.add(token);
      }
      expect(tokens.size).toBe(500);
    });
  });

  describe("generate (idempotent - story 3.4)", () => {
    it("creates one PENDING invitation per roster client with a history row", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 3);

      const result = await InvitationsService.generate(event);

      expect(result.createdCount).toBe(3);
      expect(result.totalRosterClients).toBe(3);
      expect(result.created.every((row) => row.status === InvitationStatus.PENDING)).toBe(
        true,
      );

      const history = await InvitationStatusEventsRepository.listByInvitationId(
        result.created[0]!.id,
      );
      expect(history).toHaveLength(1);
      expect(history[0]?.status).toBe(InvitationStatus.PENDING);
      expect(new Set(result.created.map((row) => row.rosterClientId)).size).toBe(
        clients.length,
      );
    });

    it("is idempotent: a second call creates nothing more", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      await makeRosterWithClients(event.id, owner.id, 4);

      const first = await InvitationsService.generate(event);
      expect(first.createdCount).toBe(4);

      const second = await InvitationsService.generate(event);
      expect(second.createdCount).toBe(0);
      expect(second.alreadyExistingCount).toBe(4);

      const counts = await InvitationsRepository.countByStatus(event.id);
      const total = counts.reduce((sum, row) => sum + row.total, 0);
      expect(total).toBe(4);
    });

    it("only generates for clients that lack an invitation", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 3);
      await makeInvitation(event.id, clients[0]!.id);

      const result = await InvitationsService.generate(event);

      expect(result.createdCount).toBe(2);
      expect(result.alreadyExistingCount).toBe(1);
    });

    it("throws INVITATIONS_ROSTER_MISSING when there is no roster", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);

      await expect(InvitationsService.generate(event)).rejects.toMatchObject({
        code: "INVITATIONS_ROSTER_MISSING",
      });
    });

    it("throws INVITATIONS_ROSTER_MISSING when the roster has zero clients", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      await makeRosterWithClients(event.id, owner.id, 0);

      await expect(InvitationsService.generate(event)).rejects.toMatchObject({
        code: "INVITATIONS_ROSTER_MISSING",
      });
    });
  });

  describe("buildMonitoring (story 3.8/3.9 dashboard)", () => {
    it("counts invitations by status", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 4);
      await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.SENT,
      });
      await makeInvitation(event.id, clients[1]!.id, {
        status: InvitationStatus.SENT,
      });
      await makeInvitation(event.id, clients[2]!.id, {
        status: InvitationStatus.OPENED,
      });
      await makeInvitation(event.id, clients[3]!.id, {
        status: InvitationStatus.FAILED,
      });

      const monitoring = await InvitationsService.buildMonitoring(event.id);

      expect(monitoring).toMatchObject({
        total: 4,
        sent: 2,
        opened: 1,
        failed: 1,
        pending: 0,
      });
    });
  });

  describe("report (story 3.10 CSV export)", () => {
    it("emits the email,status,sentAt,openedAt,confirmedAt columns", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 1);
      const sentAt = new Date("2026-01-02T03:04:05.000Z");
      await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.SENT,
        sentAt,
      });

      const csv = await InvitationsService.report(event.id);
      const lines = csv.split("\n");

      expect(lines[0]).toBe("email,status,sentAt,openedAt,confirmedAt");
      expect(lines[1]).toContain(clients[0]!.email);
      expect(lines[1]).toContain(InvitationStatus.SENT);
      expect(lines[1]).toContain(sentAt.toISOString());
    });

    it("quotes values containing commas per RFC-4180", () => {
      expect(InvitationsService.escapeCsv("a,b")).toBe('"a,b"');
      expect(InvitationsService.escapeCsv('a"b')).toBe('"a""b"');
      expect(InvitationsService.escapeCsv("plain")).toBe("plain");
    });

    it("formats null timestamps as empty strings", () => {
      expect(InvitationsService.formatTimestamp(null)).toBe("");
      const date = new Date("2026-05-05T00:00:00.000Z");
      expect(InvitationsService.formatTimestamp(date)).toBe(date.toISOString());
    });
  });

  describe("resolveToken (flow context + eligibility, post epic-4 Access)", () => {
    async function activeEvent() {
      const owner = await makeUser({ role: "sales" });
      return makeSalesEvent(owner.id, {
        status: EventStatus.ACTIVE,
        capacity: 10,
        registrationStartDate: new Date("2000-01-01T00:00:00.000Z"),
        registrationEndDate: new Date("2999-01-01T00:00:00.000Z"),
      });
    }

    it("throws INVALID_TOKEN when the token does not resolve", async () => {
      await expect(
        InvitationsService.resolveToken("does-not-exist"),
      ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
    });

    it("eligible when Active, in window, capacity available, not confirmed", async () => {
      const event = await activeEvent();
      const { clients } = await makeRosterWithClients(event.id, event.ownerId, 1);
      const invitation = await makeInvitation(event.id, clients[0]!.id);

      const view = await InvitationsService.resolveToken(invitation.token);

      expect(view.eligible).toBe(true);
      expect(view.reason).toBeNull();
      expect(view.event.id).toBe(event.id);
      expect(view.client.id).toBe(clients[0]!.id);
      expect(view.confirmation.confirmed).toBe(false);
      expect(view.hasDraft).toBe(false);
    });

    it("returns flow context: availableAttendanceDates + isMultiDay (single-day)", async () => {
      const event = await activeEvent();
      const { clients } = await makeRosterWithClients(event.id, event.ownerId, 1);
      const invitation = await makeInvitation(event.id, clients[0]!.id);

      const view = await InvitationsService.resolveToken(invitation.token);

      expect(view.event.isMultiDay).toBe(false);
      expect(view.event.availableAttendanceDates).toHaveLength(1);
    });

    it("ineligible EVENT_PAUSED when the event is paused", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id, {
        status: EventStatus.PAUSED,
        registrationStartDate: new Date("2000-01-01T00:00:00.000Z"),
        registrationEndDate: new Date("2999-01-01T00:00:00.000Z"),
      });
      const { clients } = await makeRosterWithClients(event.id, owner.id, 1);
      const invitation = await makeInvitation(event.id, clients[0]!.id);

      const view = await InvitationsService.resolveToken(invitation.token);

      expect(view.eligible).toBe(false);
      expect(view.reason).toBe("EVENT_PAUSED");
    });

    it("ineligible REGISTRATION_CLOSED when outside the window", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id, {
        status: EventStatus.ACTIVE,
        registrationStartDate: new Date("2000-01-01T00:00:00.000Z"),
        registrationEndDate: new Date("2000-02-01T00:00:00.000Z"),
      });
      const { clients } = await makeRosterWithClients(event.id, owner.id, 1);
      const invitation = await makeInvitation(event.id, clients[0]!.id);

      const view = await InvitationsService.resolveToken(invitation.token);

      expect(view.eligible).toBe(false);
      expect(view.reason).toBe("REGISTRATION_CLOSED");
    });

    it("ineligible ALREADY_CONFIRMED when the invitation is confirmed", async () => {
      const event = await activeEvent();
      const { clients } = await makeRosterWithClients(event.id, event.ownerId, 1);
      const invitation = await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.CONFIRMED,
        confirmedAt: new Date("2026-01-01T00:00:00.000Z"),
      });

      const view = await InvitationsService.resolveToken(invitation.token);

      expect(view.eligible).toBe(false);
      expect(view.reason).toBe("ALREADY_CONFIRMED");
      expect(view.confirmation.confirmed).toBe(true);
    });
  });

  describe("trackOpen (open-tracking pixel)", () => {
    it("flips PENDING -> OPENED, sets openedAt, writes history, returns the gif", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 1);
      const invitation = await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.SENT,
      });

      const result = await InvitationsService.trackOpen(invitation.token);

      expect(result.contentType).toBe("image/gif");
      expect(result.body.equals(TrackingPixelGif)).toBe(true);

      const reloaded = await InvitationsRepository.findByToken(invitation.token);
      expect(reloaded?.invitation.status).toBe(InvitationStatus.OPENED);
      expect(reloaded?.invitation.openedAt).not.toBeNull();

      const history = await InvitationStatusEventsRepository.listByInvitationId(
        invitation.id,
      );
      expect(history.map((row) => row.status)).toContain(InvitationStatus.OPENED);
    });

    it("is idempotent: a second open does not overwrite openedAt", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 1);
      const invitation = await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.SENT,
      });

      await InvitationsService.trackOpen(invitation.token);
      const afterFirst = await InvitationsRepository.findByToken(invitation.token);
      const firstOpenedAt = afterFirst?.invitation.openedAt;

      await InvitationsService.trackOpen(invitation.token);
      const afterSecond = await InvitationsRepository.findByToken(invitation.token);

      expect(afterSecond?.invitation.openedAt?.toISOString()).toBe(
        firstOpenedAt?.toISOString(),
      );
    });

    it("returns the gif for an unknown token without throwing", async () => {
      const result = await InvitationsService.trackOpen("unknown-token");
      expect(result.body.equals(TrackingPixelGif)).toBe(true);
    });
  });
});
