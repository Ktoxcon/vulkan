import { EmailTransport } from "@vulkan/lib/email/transport";
import { OwnerNotificationWorker } from "@vulkan/lib/queue/owner-notification.worker";
import type { OwnerNotificationJobData } from "@vulkan/lib/queue/owner-notification.queue.types";
import { makeAttendanceConfirmation } from "@tests/fixtures/attendance-confirmations";
import { seedInvitationFlow } from "@tests/helpers/seed-invitation-flow";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Job } from "bullmq";
import type { Transporter } from "nodemailer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await testDb.close();
});

function asJob(confirmationId: string): Job<OwnerNotificationJobData> {
  return { data: { confirmationId } } as Job<OwnerNotificationJobData>;
}

describe("OwnerNotificationWorker", () => {
  it("emails the event owner a generic confirmation notice", async () => {
    const { owner, event, invitation, client } = await seedInvitationFlow();
    const confirmation = await makeAttendanceConfirmation(
      event.id,
      invitation.id,
      client.id,
      {
        firstName: "Cassian",
        lastName: "Vaughn",
        email: "cassian@nocturne.test",
        attendanceDate: new Date("2099-09-15T00:00:00.000Z"),
      },
    );

    const sendMail = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(EmailTransport, "getTransporter").mockReturnValue({
      sendMail,
    } as unknown as Transporter);

    await OwnerNotificationWorker.process(asJob(confirmation.id));

    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0]![0];
    expect(mail.to).toBe(owner.email);
    expect(mail.subject).toContain(event.name);
    expect(mail.text).toContain("cassian@nocturne.test");
    expect(mail.text).toContain("Cassian Vaughn");
  });

  it("no-ops when the confirmation does not exist", async () => {
    const sendMail = vi.fn();
    vi.spyOn(EmailTransport, "getTransporter").mockReturnValue({
      sendMail,
    } as unknown as Transporter);

    await OwnerNotificationWorker.process(
      asJob("00000000-0000-4000-8000-000000000000"),
    );

    expect(sendMail).not.toHaveBeenCalled();
  });
});
