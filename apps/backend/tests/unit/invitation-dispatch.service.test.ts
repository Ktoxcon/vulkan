import { createFakeQueue } from "@tests/helpers/fake-queue";

const fakeQueue = createFakeQueue();

vi.mock("@vulkan/lib/queue/invitation-email.queue", () => ({
  getInvitationEmailQueue: () => fakeQueue,
}));

import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { InvitationStatusEventsRepository } from "@vulkan/lib/repositories/invitation-status-events.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { InvitationDispatchService } from "@vulkan/lib/services/invitation-dispatch.service";
import { makeEmailTemplate } from "@tests/fixtures/email-templates";
import { makeInvitation } from "@tests/fixtures/invitations";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDb: TestDb;

async function seedPending(count: number) {
  const owner = await makeUser({ role: "sales" });
  const event = await makeSalesEvent(owner.id);
  await makeEmailTemplate(event.id, owner.id);
  const { clients } = await makeRosterWithClients(event.id, owner.id, count);
  const invitations = [];
  for (const client of clients) {
    invitations.push(
      await makeInvitation(event.id, client.id, {
        status: InvitationStatus.PENDING,
      }),
    );
  }
  return { event, owner, invitations };
}

beforeEach(async () => {
  testDb = await createTestDb();
  fakeQueue.reset();
});

afterEach(async () => {
  await testDb.close();
});

describe("InvitationDispatchService", () => {
  describe("dispatch (story 3.6/3.7 enqueue)", () => {
    it("enqueues every pending invitation onto the fake queue and flips them to QUEUED", async () => {
      const { event, invitations } = await seedPending(3);

      const result = await InvitationDispatchService.dispatch(event);

      expect(fakeQueue.addBulk).toHaveBeenCalled();
      expect(fakeQueue.jobs).toHaveLength(3);
      expect(fakeQueue.jobs.map((job) => job.data.invitationId).sort()).toEqual(
        invitations.map((row) => row.id).sort(),
      );
      expect(fakeQueue.jobs.every((job) => job.data.eventId === event.id)).toBe(
        true,
      );

      expect(result.queuedCount).toBe(3);
      expect(result.progress.queued).toBe(3);
      expect(result.progress.pending).toBe(0);
    });

    it("writes a QUEUED history row for each invitation", async () => {
      const { event, invitations } = await seedPending(1);

      await InvitationDispatchService.dispatch(event);

      const history = await InvitationStatusEventsRepository.listByInvitationId(
        invitations[0]!.id,
      );
      expect(history.map((row) => row.status)).toContain(InvitationStatus.QUEUED);
    });

    it("throws DISPATCH_TEMPLATE_MISSING when the event has no template", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 1);
      await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.PENDING,
      });

      await expect(InvitationDispatchService.dispatch(event)).rejects.toMatchObject({
        code: "DISPATCH_TEMPLATE_MISSING",
      });
      expect(fakeQueue.addBulk).not.toHaveBeenCalled();
    });

    it("throws DISPATCH_NO_PENDING_INVITATIONS when nothing is pending", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      await makeEmailTemplate(event.id, owner.id);

      await expect(InvitationDispatchService.dispatch(event)).rejects.toMatchObject({
        code: "DISPATCH_NO_PENDING_INVITATIONS",
      });
    });

    it("only enqueues PENDING invitations, leaving already-sent ones alone", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      await makeEmailTemplate(event.id, owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 2);
      await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.PENDING,
      });
      await makeInvitation(event.id, clients[1]!.id, {
        status: InvitationStatus.SENT,
        sentAt: new Date(),
      });

      const result = await InvitationDispatchService.dispatch(event);

      expect(fakeQueue.jobs).toHaveLength(1);
      expect(result.queuedCount).toBe(1);
      expect(result.progress.sent).toBe(1);
    });
  });

  describe("getProgress (story 3.9 dashboard)", () => {
    it("aggregates counts across statuses", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 3);
      await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.SENT,
      });
      await makeInvitation(event.id, clients[1]!.id, {
        status: InvitationStatus.FAILED,
      });
      await makeInvitation(event.id, clients[2]!.id, {
        status: InvitationStatus.QUEUED,
      });

      const progress = await InvitationDispatchService.getProgress(event.id);

      expect(progress).toMatchObject({
        eventId: event.id,
        total: 3,
        sent: 1,
        failed: 1,
        queued: 1,
      });
    });
  });
});
