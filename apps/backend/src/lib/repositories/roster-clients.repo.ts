import { db } from "@vulkan/lib/db/index";
import { rosterClients } from "@vulkan/lib/db/schema/roster-clients";
import { eq } from "drizzle-orm";

export const RosterClientsRepository = {
  async countByRosterId(rosterId: string): Promise<number> {
    const rows = await db
      .select({ id: rosterClients.id })
      .from(rosterClients)
      .where(eq(rosterClients.rosterId, rosterId));
    return rows.length;
  },
};
