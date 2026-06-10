import { db } from "@vulkan/lib/db/index";
import { clients } from "@vulkan/lib/db/schema/clients";
import { importRecords } from "@vulkan/lib/db/schema/import-records";
import type { ImportRecordValidRow } from "@vulkan/lib/db/schema/import-records.types";
import { rosterClients } from "@vulkan/lib/db/schema/roster-clients";
import { rosters } from "@vulkan/lib/db/schema/rosters";
import type { Roster } from "@vulkan/lib/db/schema/rosters.types";
import type { RosterMember } from "@vulkan/lib/repositories/rosters.repo.types";
import type { AddRosterClientBody } from "@vulkan/lib/validators/roster.schemas.types";
import { ImportRecordStatus } from "@vulkan/lib/services/roster.service.constants";
import { and, eq, sql } from "drizzle-orm";

export const RostersRepository = {
  async findByEventId(eventId: string): Promise<Roster | undefined> {
    const [row] = await db
      .select()
      .from(rosters)
      .where(eq(rosters.eventId, eventId))
      .limit(1);
    return row;
  },

  async listRosterClients(rosterId: string): Promise<RosterMember[]> {
    return db
      .select({
        rosterClientId: rosterClients.id,
        clientId: clients.id,
        email: clients.email,
        name: rosterClients.name,
        company: rosterClients.company,
        createdAt: rosterClients.createdAt,
      })
      .from(rosterClients)
      .innerJoin(clients, eq(rosterClients.clientId, clients.id))
      .where(eq(rosterClients.rosterId, rosterId));
  },

  async addClient(
    eventId: string,
    addedBy: string,
    row: AddRosterClientBody,
  ): Promise<RosterMember | null> {
    return db.transaction(async (tx) => {
      const now = new Date();

      const [created] = await tx
        .insert(rosters)
        .values({ eventId, uploadedBy: addedBy, totalClients: 0 })
        .onConflictDoNothing({ target: rosters.eventId })
        .returning();
      let roster = created as Roster | undefined;
      if (!roster) {
        [roster] = await tx
          .select()
          .from(rosters)
          .where(eq(rosters.eventId, eventId))
          .limit(1);
      }
      const target = roster as Roster;

      const [client] = await tx
        .insert(clients)
        .values({ email: row.email })
        .onConflictDoUpdate({ target: clients.email, set: { email: row.email } })
        .returning({ id: clients.id, email: clients.email });
      const persisted = client as { id: string; email: string };

      const [existing] = await tx
        .select({ id: rosterClients.id })
        .from(rosterClients)
        .where(
          and(
            eq(rosterClients.rosterId, target.id),
            eq(rosterClients.clientId, persisted.id),
          ),
        )
        .limit(1);
      if (existing) {
        return null;
      }

      const [membership] = await tx
        .insert(rosterClients)
        .values({
          rosterId: target.id,
          clientId: persisted.id,
          name: row.name,
          company: row.company,
        })
        .returning();
      const member = membership!;

      await tx
        .update(rosters)
        .set({ totalClients: sql`${rosters.totalClients} + 1`, updatedAt: now })
        .where(eq(rosters.id, target.id));

      return {
        rosterClientId: member.id,
        clientId: persisted.id,
        email: persisted.email,
        name: member.name,
        company: member.company,
        createdAt: member.createdAt,
      };
    });
  },

  async commitImport(
    eventId: string,
    importId: string,
    uploadedBy: string,
    validRows: ImportRecordValidRow[],
  ): Promise<Roster> {
    return db.transaction(async (tx) => {
      const now = new Date();

      const clientIdByEmail = new Map<string, string>();
      for (const row of validRows) {
        const [persisted] = await tx
          .insert(clients)
          .values({ email: row.email })
          .onConflictDoUpdate({
            target: clients.email,
            set: { email: row.email },
          })
          .returning({ id: clients.id, email: clients.email });
        clientIdByEmail.set(persisted!.email, persisted!.id);
      }

      const [roster] = await tx
        .insert(rosters)
        .values({
          eventId,
          uploadedBy,
          totalClients: validRows.length,
        })
        .onConflictDoUpdate({
          target: rosters.eventId,
          set: { uploadedBy, totalClients: validRows.length, updatedAt: now },
        })
        .returning();
      const committed = roster as Roster;

      await tx
        .delete(rosterClients)
        .where(eq(rosterClients.rosterId, committed.id));

      if (validRows.length > 0) {
        await tx.insert(rosterClients).values(
          validRows.map((row) => ({
            rosterId: committed.id,
            clientId: clientIdByEmail.get(row.email) as string,
            name: row.name,
            company: row.company,
          })),
        );
      }

      await tx
        .update(importRecords)
        .set({ status: ImportRecordStatus.CONFIRMED })
        .where(eq(importRecords.id, importId));

      return committed;
    });
  },
};
