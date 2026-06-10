import type { InvitationStatus as InvitationStatusType } from "@vulkan/lib/constants/invitation-status.types";

export const InvitationStatus = {
  PENDING: "pending",
  QUEUED: "queued",
  PROCESSING: "processing",
  SENT: "sent",
  OPENED: "opened",
  STARTED: "started",
  CONFIRMED: "confirmed",
  FAILED: "failed",
  EXPIRED: "expired",
} as const;

export const InvitationStatusValues = Object.values(InvitationStatus) as [
  InvitationStatusType,
  ...InvitationStatusType[],
];
