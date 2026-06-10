import { sql } from "drizzle-orm";
import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { salesEvents } from "./sales-events";
import { users } from "./users";

export const rosters = pgTable("rosters", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  eventId: uuid("event_id")
    .notNull()
    .references(() => salesEvents.id)
    .unique(),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id),
  totalClients: integer("total_clients").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
