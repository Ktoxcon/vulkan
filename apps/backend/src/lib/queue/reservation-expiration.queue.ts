import {
  ReservationExpirationAttempts,
  ReservationExpirationBackoff,
  ReservationExpirationQueueName,
} from "@vulkan/lib/queue/queues.constants";
import { getQueueConnection } from "@vulkan/lib/queue/connection";
import type { ReservationExpirationJobData } from "@vulkan/lib/queue/reservation-expiration.queue.types";
import { Queue } from "bullmq";

let queueSingleton: Queue<ReservationExpirationJobData> | null = null;

export function getReservationExpirationQueue(): Queue<ReservationExpirationJobData> {
  if (!queueSingleton) {
    queueSingleton = new Queue<ReservationExpirationJobData>(
      ReservationExpirationQueueName,
      {
        connection: getQueueConnection(),
        defaultJobOptions: {
          attempts: ReservationExpirationAttempts,
          backoff: ReservationExpirationBackoff,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    );
  }
  return queueSingleton;
}
