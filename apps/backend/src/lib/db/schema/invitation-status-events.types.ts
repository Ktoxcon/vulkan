import { invitationStatusEvents } from "@vulkan/lib/db/schema/invitation-status-events";

export type InvitationStatusEvent = typeof invitationStatusEvents.$inferSelect;
export type NewInvitationStatusEvent =
  typeof invitationStatusEvents.$inferInsert;
