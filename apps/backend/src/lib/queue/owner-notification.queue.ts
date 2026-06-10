import { getQueueConnection } from "@vulkan/lib/queue/connection";
import type { OwnerNotificationJobData } from "@vulkan/lib/queue/owner-notification.queue.types";
import {
  OwnerNotificationAttempts,
  OwnerNotificationBackoff,
  OwnerNotificationQueueName,
} from "@vulkan/lib/queue/queues.constants";
import { Queue } from "bullmq";

let queueSingleton: Queue<OwnerNotificationJobData> | null = null;

export function getOwnerNotificationQueue(): Queue<OwnerNotificationJobData> {
  if (!queueSingleton) {
    queueSingleton = new Queue<OwnerNotificationJobData>(
      OwnerNotificationQueueName,
      {
        connection: getQueueConnection(),
        defaultJobOptions: {
          attempts: OwnerNotificationAttempts,
          backoff: OwnerNotificationBackoff,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    );
  }
  return queueSingleton;
}
