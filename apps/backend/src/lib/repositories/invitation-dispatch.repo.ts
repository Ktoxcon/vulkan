import { db } from "@vulkan/lib/db/index";
import { clients } from "@vulkan/lib/db/schema/clients";
import { invitationStatusEvents } from "@vulkan/lib/db/schema/invitation-status-events";
import { invitations } from "@vulkan/lib/db/schema/invitations";
import type { Invitation } from "@vulkan/lib/db/schema/invitations.types";
import { rosterClients } from "@vulkan/lib/db/schema/roster-clients";
import { salesEvents } from "@vulkan/lib/db/schema/sales-events";
import type { DispatchInvitationContext } from "@vulkan/lib/repositories/invitation-dispatch.repo.types";
import { and, eq, inArray } from "drizzle-orm";

export const InvitationDispatchRepository = {
  async listIdsByStatus(eventId: string, status: string): Promise<string[]> {
    const rows = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(eq(invitations.eventId, eventId), eq(invitations.status, status)),
      );
    return rows.map((row) => row.id);
  },

  async markQueued(
    invitationIds: string[],
    status: string,
  ): Promise<number> {
    if (invitationIds.length === 0) return 0;
    return db.transaction(async (tx) => {
      const updated = await tx
        .update(invitations)
        .set({ status, updatedAt: new Date() })
        .where(inArray(invitations.id, invitationIds))
        .returning({ id: invitations.id });

      if (updated.length > 0) {
        await tx.insert(invitationStatusEvents).values(
          updated.map((row) => ({
            invitationId: row.id,
            status,
          })),
        );
      }

      return updated.length;
    });
  },

  async findContextById(
    invitationId: string,
  ): Promise<DispatchInvitationContext | undefined> {
    const [row] = await db
      .select({
        invitation: invitations,
        client: {
          id: clients.id,
          email: clients.email,
          name: rosterClients.name,
          company: rosterClients.company,
        },
        event: salesEvents,
      })
      .from(invitations)
      .innerJoin(rosterClients, eq(invitations.rosterClientId, rosterClients.id))
      .innerJoin(clients, eq(rosterClients.clientId, clients.id))
      .innerJoin(salesEvents, eq(invitations.eventId, salesEvents.id))
      .where(eq(invitations.id, invitationId))
      .limit(1);
    return row;
  },

  async markProcessing(invitationId: string, status: string): Promise<void> {
    await InvitationDispatchRepository.transition(invitationId, { status });
  },

  async markSent(
    invitationId: string,
    status: string,
    sentAt: Date,
  ): Promise<void> {
    await InvitationDispatchRepository.transition(invitationId, {
      status,
      sentAt,
    });
  },

  async markFailed(invitationId: string, status: string): Promise<void> {
    await InvitationDispatchRepository.transition(invitationId, { status });
  },

  async transition(
    invitationId: string,
    changes: { status: string; sentAt?: Date },
  ): Promise<void> {
    await db.transaction(async (tx) => {
      const set: Partial<Invitation> = {
        status: changes.status,
        updatedAt: new Date(),
      };
      if (changes.sentAt !== undefined) {
        set.sentAt = changes.sentAt;
      }
      await tx
        .update(invitations)
        .set(set)
        .where(eq(invitations.id, invitationId));
      await tx
        .insert(invitationStatusEvents)
        .values({ invitationId, status: changes.status });
    });
  },
};
