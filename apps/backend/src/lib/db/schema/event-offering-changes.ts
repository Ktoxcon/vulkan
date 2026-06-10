import { sql } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { offerings } from "./offerings";
import { salesEvents } from "./sales-events";
import { users } from "./users";

export const eventOfferingChanges = pgTable("event_offering_changes", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  eventId: uuid("event_id")
    .notNull()
    .references(() => salesEvents.id),
  offeringId: uuid("offering_id")
    .notNull()
    .references(() => offerings.id),
  action: varchar("action", { length: 16 }).notNull(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
