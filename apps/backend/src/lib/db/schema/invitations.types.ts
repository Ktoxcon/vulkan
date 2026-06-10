import { invitations } from "@vulkan/lib/db/schema/invitations";

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
