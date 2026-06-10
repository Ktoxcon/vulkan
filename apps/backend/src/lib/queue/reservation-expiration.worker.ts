import { ReservationStatus } from "@vulkan/lib/constants/reservation-status";
import { getQueueConnection } from "@vulkan/lib/queue/connection";
import { ReservationExpirationQueueName } from "@vulkan/lib/queue/queues.constants";
import type { ReservationExpirationJobData } from "@vulkan/lib/queue/reservation-expiration.queue.types";
import { ReservationExpirationConcurrency } from "@vulkan/lib/queue/reservation-expiration.worker.constants";
import { SeatReservationsRepository } from "@vulkan/lib/repositories/seat-reservations.repo";
import type { Job } from "bullmq";
import { Worker } from "bullmq";

export const ReservationExpirationWorker = {
  create(): Worker<ReservationExpirationJobData> {
    return new Worker<ReservationExpirationJobData>(
      ReservationExpirationQueueName,
      ReservationExpirationWorker.process,
      {
        connection: getQueueConnection(),
        concurrency: ReservationExpirationConcurrency,
      },
    );
  },

  async process(job: Job<ReservationExpirationJobData>): Promise<void> {
    const reservation = await SeatReservationsRepository.findById(
      job.data.reservationId,
    );

    if (!reservation) {
      return;
    }

    const now = new Date();

    if (
      reservation.status !== ReservationStatus.ACTIVE ||
      reservation.expiresAt.getTime() > now.getTime()
    ) {
      return;
    }

    await SeatReservationsRepository.markExpired(reservation.id, now);

    console.info(
      `Reservation ${reservation.id} expired for event ${reservation.eventId}; seat released`,
    );
  },
};
