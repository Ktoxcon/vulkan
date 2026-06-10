import { db } from "@vulkan/lib/db/index";
import { invitationStatusEvents } from "@vulkan/lib/db/schema/invitation-status-events";
import type {
  InvitationStatusEvent,
  NewInvitationStatusEvent,
} from "@vulkan/lib/db/schema/invitation-status-events.types";
import { asc, eq } from "drizzle-orm";

export const InvitationStatusEventsRepository = {
  async listByInvitationId(
    invitationId: string,
  ): Promise<InvitationStatusEvent[]> {
    return db
      .select()
      .from(invitationStatusEvents)
      .where(eq(invitationStatusEvents.invitationId, invitationId))
      .orderBy(asc(invitationStatusEvents.createdAt));
  },

  async insert(
    values: NewInvitationStatusEvent,
  ): Promise<InvitationStatusEvent> {
    const [row] = await db
      .insert(invitationStatusEvents)
      .values(values)
      .returning();
    return row as InvitationStatusEvent;
  },
};
