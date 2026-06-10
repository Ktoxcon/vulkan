export const InvitationEmailQueueName = "invitation-email-send";

export const InvitationEmailBatchSize = 100;

export const InvitationEmailConcurrency = 5;

export const InvitationEmailAttempts = 3;

export const InvitationEmailBackoff = {
  type: "exponential",
  delay: 5000,
} as const;

export const ReservationExpirationQueueName = "reservation-expiration";

export const ReservationExpirationAttempts = 3;

export const ReservationExpirationBackoff = {
  type: "exponential",
  delay: 5000,
} as const;

export const OwnerNotificationQueueName = "owner-confirmation-notification";

export const OwnerNotificationAttempts = 3;

export const OwnerNotificationBackoff = {
  type: "exponential",
  delay: 5000,
} as const;
