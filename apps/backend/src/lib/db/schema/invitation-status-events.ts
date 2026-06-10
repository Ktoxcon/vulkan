import { sql } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { invitations } from "./invitations";

export const invitationStatusEvents = pgTable("invitation_status_events", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  invitationId: uuid("invitation_id")
    .notNull()
    .references(() => invitations.id),
  status: varchar("status", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
