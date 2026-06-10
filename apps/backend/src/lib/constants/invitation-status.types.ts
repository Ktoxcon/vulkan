import type { InvitationStatus as InvitationStatusConst } from "@vulkan/lib/constants/invitation-status";

export type InvitationStatus =
  (typeof InvitationStatusConst)[keyof typeof InvitationStatusConst];
