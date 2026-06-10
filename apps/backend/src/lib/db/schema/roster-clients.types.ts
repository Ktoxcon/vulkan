import { rosterClients } from "@vulkan/lib/db/schema/roster-clients";

export type RosterClient = typeof rosterClients.$inferSelect;
export type NewRosterClient = typeof rosterClients.$inferInsert;
