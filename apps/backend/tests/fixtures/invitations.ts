import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { db } from "@vulkan/lib/db/index";
import { invitationStatusEvents } from "@vulkan/lib/db/schema/invitation-status-events";
import { invitations } from "@vulkan/lib/db/schema/invitations";
import type { Invitation } from "@vulkan/lib/db/schema/invitations.types";
import { rosterClients } from "@vulkan/lib/db/schema/roster-clients";
import { rosters } from "@vulkan/lib/db/schema/rosters";
import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

export async function makeInvitation(
  eventId: string,
  clientId: string,
  overrides: Partial<{
    token: string;
    status: string;
    sentAt: Date | null;
    openedAt: Date | null;
    confirmedAt: Date | null;
  }> = {},
): Promise<Invitation> {
  const [membership] = await db
    .select({ id: rosterClients.id })
    .from(rosterClients)
    .innerJoin(rosters, eq(rosterClients.rosterId, rosters.id))
    .where(
      and(eq(rosters.eventId, eventId), eq(rosterClients.clientId, clientId)),
    )
    .limit(1);

  const status = overrides.status ?? InvitationStatus.PENDING;
  const [row] = await db
    .insert(invitations)
    .values({
      eventId,
      rosterClientId: membership!.id,
      token: overrides.token ?? randomBytes(32).toString("base64url"),
      status,
      ...(overrides.sentAt !== undefined ? { sentAt: overrides.sentAt } : {}),
      ...(overrides.openedAt !== undefined
        ? { openedAt: overrides.openedAt }
        : {}),
      ...(overrides.confirmedAt !== undefined
        ? { confirmedAt: overrides.confirmedAt }
        : {}),
    })
    .returning();
  const invitation = row as Invitation;

  await db
    .insert(invitationStatusEvents)
    .values({ invitationId: invitation.id, status });

  return invitation;
}
