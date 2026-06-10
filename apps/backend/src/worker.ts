import { InvitationEmailWorker } from "@vulkan/lib/queue/invitation-email.worker";
import { OwnerNotificationWorker } from "@vulkan/lib/queue/owner-notification.worker";
import { ReservationExpirationWorker } from "@vulkan/lib/queue/reservation-expiration.worker";

const worker = InvitationEmailWorker.create();

worker.on("ready", () => {
  console.info("Invitation email worker ready");
});

worker.on("failed", (job, error) => {
  console.error(`Invitation email job ${job?.id} failed: ${error.message}`);
});

const ownerNotificationWorker = OwnerNotificationWorker.create();

ownerNotificationWorker.on("ready", () => {
  console.info("Owner notification worker ready");
});

ownerNotificationWorker.on("failed", (job, error) => {
  console.error(
    `Owner notification job ${job?.id} failed: ${error.message}`,
  );
});

const reservationExpirationWorker = ReservationExpirationWorker.create();

reservationExpirationWorker.on("ready", () => {
  console.info("Reservation expiration worker ready");
});

reservationExpirationWorker.on("failed", (job, error) => {
  console.error(
    `Reservation expiration job ${job?.id} failed: ${error.message}`,
  );
});
