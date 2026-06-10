import { db } from "@vulkan/lib/db/index";
import { clients } from "@vulkan/lib/db/schema/clients";
import { invitationStatusEvents } from "@vulkan/lib/db/schema/invitation-status-events";
import { invitations } from "@vulkan/lib/db/schema/invitations";
import type { Invitation } from "@vulkan/lib/db/schema/invitations.types";
import { rosterClients } from "@vulkan/lib/db/schema/roster-clients";
import { salesEvents } from "@vulkan/lib/db/schema/sales-events";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import type { DbExecutor } from "@vulkan/lib/repositories/capacity.repo.types";
import type {
  InvitationListRow,
  InvitationStats,
  InvitationStatusCount,
  NewInvitationWithToken,
  TokenResolution,
} from "@vulkan/lib/repositories/invitations.repo.types";
import { RosterClientsRepository } from "@vulkan/lib/repositories/roster-clients.repo";
import { RostersRepository } from "@vulkan/lib/repositories/rosters.repo";
import { and, count, eq, inArray } from "drizzle-orm";

export const InvitationsRepository = {
  async findRosterClientIdsWithInvitation(eventId: string): Promise<string[]> {
    const rows = await db
      .select({ rosterClientId: invitations.rosterClientId })
      .from(invitations)
      .where(eq(invitations.eventId, eventId));
    return rows.map((row) => row.rosterClientId);
  },

  async createMany(
    eventId: string,
    rows: NewInvitationWithToken[],
    initialStatus: string,
  ): Promise<Invitation[]> {
    if (rows.length === 0) return [];
    return db.transaction(async (tx) => {
      const inserted = await tx
        .insert(invitations)
        .values(
          rows.map((row) => ({
            eventId,
            rosterClientId: row.rosterClientId,
            token: row.token,
            status: initialStatus,
          })),
        )
        .onConflictDoNothing({
          target: invitations.rosterClientId,
        })
        .returning();

      if (inserted.length > 0) {
        await tx.insert(invitationStatusEvents).values(
          inserted.map((row) => ({
            invitationId: row.id,
            status: row.status,
          })),
        );
      }

      return inserted;
    });
  },

  async listByEvent(
    eventId: string,
    statuses: string[],
  ): Promise<InvitationListRow[]> {
    const filters = [eq(invitations.eventId, eventId)];
    if (statuses.length > 0) {
      filters.push(inArray(invitations.status, statuses));
    }
    return db
      .select({
        invitation: invitations,
        client: {
          id: clients.id,
          email: clients.email,
          name: rosterClients.name,
          company: rosterClients.company,
        },
      })
      .from(invitations)
      .innerJoin(rosterClients, eq(invitations.rosterClientId, rosterClients.id))
      .innerJoin(clients, eq(rosterClients.clientId, clients.id))
      .where(and(...filters))
      .orderBy(invitations.createdAt);
  },

  async countByStatus(eventId: string): Promise<InvitationStatusCount[]> {
    return db
      .select({ status: invitations.status, total: count() })
      .from(invitations)
      .where(eq(invitations.eventId, eventId))
      .groupBy(invitations.status);
  },

  async getStats(eventId: string): Promise<InvitationStats> {
    const counts = await InvitationsRepository.countByStatus(eventId);
    const invited = counts.reduce((sum, row) => sum + row.total, 0);
    const opened = counts
      .filter((row) => row.status === InvitationStatus.OPENED)
      .reduce((sum, row) => sum + row.total, 0);
    const started = counts
      .filter(
        (row) =>
          row.status === InvitationStatus.STARTED ||
          row.status === InvitationStatus.CONFIRMED,
      )
      .reduce((sum, row) => sum + row.total, 0);
    const confirmed = counts
      .filter((row) => row.status === InvitationStatus.CONFIRMED)
      .reduce((sum, row) => sum + row.total, 0);
    return { invited, opened, started, confirmed };
  },

  async tokensReady(eventId: string): Promise<boolean> {
    const roster = await RostersRepository.findByEventId(eventId);
    if (!roster) return false;
    const rosterClientCount = await RosterClientsRepository.countByRosterId(
      roster.id,
    );
    if (rosterClientCount === 0) return false;
    const rosterClientIdsWithInvitation =
      await InvitationsRepository.findRosterClientIdsWithInvitation(eventId);
    return rosterClientIdsWithInvitation.length >= rosterClientCount;
  },

  async findByToken(
    token: string,
    executor: DbExecutor = db,
  ): Promise<TokenResolution | undefined> {
    const [row] = await executor
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
      .where(eq(invitations.token, token))
      .limit(1);
    return row;
  },

  async markOpened(
    invitationId: string,
    status: string,
    openedAt: Date,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(invitations)
        .set({ status, openedAt, updatedAt: openedAt })
        .where(eq(invitations.id, invitationId));
      await tx
        .insert(invitationStatusEvents)
        .values({ invitationId, status });
    });
  },
};
