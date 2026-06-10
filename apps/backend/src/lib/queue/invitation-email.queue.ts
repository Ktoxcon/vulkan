import { getQueueConnection } from "@vulkan/lib/queue/connection";
import type { InvitationEmailJobData } from "@vulkan/lib/queue/invitation-email.queue.types";
import {
  InvitationEmailAttempts,
  InvitationEmailBackoff,
  InvitationEmailQueueName,
} from "@vulkan/lib/queue/queues.constants";
import { Queue } from "bullmq";

let queueSingleton: Queue<InvitationEmailJobData> | null = null;

export function getInvitationEmailQueue(): Queue<InvitationEmailJobData> {
  if (!queueSingleton) {
    queueSingleton = new Queue<InvitationEmailJobData>(
      InvitationEmailQueueName,
      {
        connection: getQueueConnection(),
        defaultJobOptions: {
          attempts: InvitationEmailAttempts,
          backoff: InvitationEmailBackoff,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    );
  }

  return queueSingleton;
}
