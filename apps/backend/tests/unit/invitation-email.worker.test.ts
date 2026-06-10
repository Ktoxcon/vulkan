import { createFakeTransport } from "@tests/helpers/fake-transport";

const fakeTransport = createFakeTransport();

vi.mock("@vulkan/lib/email/transport", () => ({
  EmailTransport: {
    getTransporter: () => fakeTransport.getTransporter(),
    renderTemplate: (template: string, variables: never) =>
      fakeTransport.renderTemplate(template, variables),
  },
}));

import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { InvitationStatusEventsRepository } from "@vulkan/lib/repositories/invitation-status-events.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { InvitationEmailWorker } from "@vulkan/lib/queue/invitation-email.worker";
import type { InvitationEmailJobData } from "@vulkan/lib/queue/invitation-email.queue.types";
import { makeEmailTemplate } from "@tests/fixtures/email-templates";
import { makeInvitation } from "@tests/fixtures/invitations";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Job } from "bullmq";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDb: TestDb;

function fakeJob(data: InvitationEmailJobData): Job<InvitationEmailJobData> {
  return { data } as Job<InvitationEmailJobData>;
}

async function seedDispatchable() {
  const owner = await makeUser({ role: "sales" });
  const event = await makeSalesEvent(owner.id);
  await makeEmailTemplate(event.id, owner.id);
  const { clients } = await makeRosterWithClients(event.id, owner.id, 1);
  const invitation = await makeInvitation(event.id, clients[0]!.id, {
    status: InvitationStatus.QUEUED,
  });
  return { event, owner, client: clients[0]!, invitation };
}

beforeEach(async () => {
  testDb = await createTestDb();
  fakeTransport.reset();
});

afterEach(async () => {
  await testDb.close();
});

describe("InvitationEmailWorker", () => {
  describe("buildVariables / url helpers", () => {
    it("maps client/event into TemplateVariables with a null-safe company", async () => {
      const { event, client, invitation } = await seedDispatchable();
      const context = { event, client, invitation };

      const variables = InvitationEmailWorker.buildVariables(context);

      expect(variables.clientName).toBe(client.name);
      expect(variables.companyName).toBe(client.company ?? "");
      expect(variables.eventName).toBe(event.name);
      expect(variables.invitationUrl).toContain(invitation.token);
    });

    it("appends a hidden tracking pixel pointing at the token", () => {
      const html = InvitationEmailWorker.withTrackingPixel("<p>Hi</p>", "tok123");
      expect(html).toContain("<p>Hi</p>");
      expect(html).toContain("tok123/pixel");
      expect(html).toContain('width="1"');
    });
  });

  describe("process - success (story 3.6/3.7)", () => {
    it("renders, sends via the mocked transport, and transitions to SENT with history", async () => {
      const { event, invitation, client } = await seedDispatchable();

      await InvitationEmailWorker.process(fakeJob({
        invitationId: invitation.id,
        eventId: event.id,
      }));

      expect(fakeTransport.sendMail).toHaveBeenCalledTimes(1);
      const mail = fakeTransport.sent[0]!;
      expect(mail.to).toBe(client.email);
      expect(mail.subject).toContain(event.name);
      expect(mail.html).toContain(`${invitation.token}/pixel`);

      const reloaded = await InvitationsRepository.findByToken(invitation.token);
      expect(reloaded?.invitation.status).toBe(InvitationStatus.SENT);
      expect(reloaded?.invitation.sentAt).not.toBeNull();

      const history = await InvitationStatusEventsRepository.listByInvitationId(
        invitation.id,
      );
      const statuses = history.map((row) => row.status);
      expect(statuses).toContain(InvitationStatus.PROCESSING);
      expect(statuses).toContain(InvitationStatus.SENT);
    });
  });

  describe("process - failure + retry (story 3.7)", () => {
    it("transitions to FAILED and rethrows so BullMQ retries", async () => {
      const { event, invitation } = await seedDispatchable();
      fakeTransport.failNext = 1;

      await expect(
        InvitationEmailWorker.process(fakeJob({
          invitationId: invitation.id,
          eventId: event.id,
        })),
      ).rejects.toThrow();

      const reloaded = await InvitationsRepository.findByToken(invitation.token);
      expect(reloaded?.invitation.status).toBe(InvitationStatus.FAILED);

      const history = await InvitationStatusEventsRepository.listByInvitationId(
        invitation.id,
      );
      expect(history.map((row) => row.status)).toContain(InvitationStatus.FAILED);
    });

    it("succeeds on a retry once the transport recovers", async () => {
      const { event, invitation } = await seedDispatchable();
      fakeTransport.failNext = 1;
      const job = fakeJob({ invitationId: invitation.id, eventId: event.id });

      await expect(InvitationEmailWorker.process(job)).rejects.toThrow();
      await InvitationEmailWorker.process(job);

      expect(fakeTransport.sent).toHaveLength(1);
      const reloaded = await InvitationsRepository.findByToken(invitation.token);
      expect(reloaded?.invitation.status).toBe(InvitationStatus.SENT);
    });

    it("throws DISPATCH_INVITATION_NOT_FOUND for a missing invitation", async () => {
      await expect(
        InvitationEmailWorker.process(fakeJob({
          invitationId: "22222222-2222-4222-8222-222222222222",
          eventId: "11111111-1111-4111-8111-111111111111",
        })),
      ).rejects.toMatchObject({ code: "DISPATCH_INVITATION_NOT_FOUND" });
      expect(fakeTransport.sendMail).not.toHaveBeenCalled();
    });

    it("throws DISPATCH_TEMPLATE_NOT_FOUND when the event has no template", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const { clients } = await makeRosterWithClients(event.id, owner.id, 1);
      const invitation = await makeInvitation(event.id, clients[0]!.id, {
        status: InvitationStatus.QUEUED,
      });

      await expect(
        InvitationEmailWorker.process(fakeJob({
          invitationId: invitation.id,
          eventId: event.id,
        })),
      ).rejects.toMatchObject({ code: "DISPATCH_TEMPLATE_NOT_FOUND" });
    });
  });
});
