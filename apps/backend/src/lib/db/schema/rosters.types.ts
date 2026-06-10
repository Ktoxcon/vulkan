import { rosters } from "@vulkan/lib/db/schema/rosters";

export type Roster = typeof rosters.$inferSelect;
export type NewRoster = typeof rosters.$inferInsert;
