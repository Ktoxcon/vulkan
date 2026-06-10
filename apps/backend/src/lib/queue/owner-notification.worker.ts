import { AppConfig } from "@vulkan/config/app.config";
import { EmailTransport } from "@vulkan/lib/email/transport";
import { getQueueConnection } from "@vulkan/lib/queue/connection";
import type { OwnerNotificationJobData } from "@vulkan/lib/queue/owner-notification.queue.types";
import {
  OwnerNotificationConcurrency,
  OwnerNotificationSubjectPrefix,
} from "@vulkan/lib/queue/owner-notification.worker.constants";
import { OwnerNotificationQueueName } from "@vulkan/lib/queue/queues.constants";
import { AttendanceConfirmationsRepository } from "@vulkan/lib/repositories/attendance-confirmations.repo";
import type { OwnerNotificationContext } from "@vulkan/lib/repositories/attendance-confirmations.repo.types";
import { Worker } from "bullmq";
import type { Job } from "bullmq";

export const OwnerNotificationWorker = {
  create(): Worker<OwnerNotificationJobData> {
    return new Worker<OwnerNotificationJobData>(
      OwnerNotificationQueueName,
      OwnerNotificationWorker.process,
      {
        connection: getQueueConnection(),
        concurrency: OwnerNotificationConcurrency,
      },
    );
  },

  async process(job: Job<OwnerNotificationJobData>): Promise<void> {
    const context =
      await AttendanceConfirmationsRepository.findOwnerNotificationContext(
        job.data.confirmationId,
      );
    if (!context) {
      return;
    }

    await EmailTransport.getTransporter().sendMail({
      from: AppConfig.smtp.from,
      to: context.ownerEmail,
      subject: `${OwnerNotificationSubjectPrefix} — ${context.eventName}`,
      text: OwnerNotificationWorker.buildText(context),
      html: OwnerNotificationWorker.buildHtml(context),
    });
  },

  buildText(context: OwnerNotificationContext): string {
    const date = context.attendanceDate.toISOString().slice(0, 10);
    return `${context.clientName} (${context.clientEmail}) confirmed attendance for ${context.eventName} on ${date}.`;
  },

  buildHtml(context: OwnerNotificationContext): string {
    const date = context.attendanceDate.toISOString().slice(0, 10);
    return `<p><strong>${context.clientName}</strong> (${context.clientEmail}) confirmed attendance for <strong>${context.eventName}</strong> on ${date}.</p>`;
  },
};
