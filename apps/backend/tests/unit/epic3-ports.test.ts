import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { EmailTemplatesRepository } from "@vulkan/lib/repositories/email-templates.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { RosterClientsRepository } from "@vulkan/lib/repositories/roster-clients.repo";
import { RostersRepository } from "@vulkan/lib/repositories/rosters.repo";
import { makeEmailTemplate } from "@tests/fixtures/email-templates";
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

describe("epic-3 reads feeding epic-1 readiness/metrics", () => {
  describe("roster summary (RostersRepository + RosterClientsRepository)", () => {
    it("reports no roster when none exists", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);

      const roster = await RostersRepository.findByEventId(event.id);

      expect(roster).toBeUndefined();
    });

    it("reports the roster client count when a roster exists", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      await makeRosterWithClients(event.id, owner.id, 4);

      const roster = await RostersRepository.findByEventId(event.id);
      expect(roster).toBeDefined();
      const validClientCount = await RosterClientsRepository.countByRosterId(
        roster!.id,
      );

      expect(validClientCount).toBe(4);
    });
  });

  describe("EmailTemplatesRepository.findByEventId", () => {
    it("is undefined with no template and present once one exists", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);

      expect(
        await EmailTemplatesRepository.findByEventId(event.id),
      ).toBeUndefined();

      await makeEmailTemplate(event.id, owner.id);

      expect(
        await EmailTemplatesRepository.findByEventId(event.id),
      ).toBeDefined();
    });
  });

  describe("InvitationsRepository.getStats", () => {
    it("counts invited (all) and opened invitations", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 3);
      await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.SENT,
      });
      await makeInvitation(event.id, clients[1]!.id, {
        status: InvitationStatus.OPENED,
      });
      await makeInvitation(event.id, clients[2]!.id, {
        status: InvitationStatus.OPENED,
      });

      const stats = await InvitationsRepository.getStats(event.id);

      expect(stats).toEqual({
        invited: 3,
        opened: 2,
        started: 0,
        confirmed: 0,
      });
    });
  });

  describe("InvitationsRepository.tokensReady", () => {
    it("is false without a roster", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);

      expect(await InvitationsRepository.tokensReady(event.id)).toBe(false);
    });

    it("is false when not every roster client has an invitation", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 3);
      await makeInvitation(event.id, clients[0]!.id);

      expect(await InvitationsRepository.tokensReady(event.id)).toBe(false);
    });

    it("is true when every roster client has an invitation", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 3);
      for (const client of clients) {
        await makeInvitation(event.id, client.id);
      }

      expect(await InvitationsRepository.tokensReady(event.id)).toBe(true);
    });
  });
});
