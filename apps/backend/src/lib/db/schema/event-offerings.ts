import { sql } from "drizzle-orm";
import { pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { offerings } from "./offerings";
import { salesEvents } from "./sales-events";
import { users } from "./users";

export const eventOfferings = pgTable(
  "event_offerings",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => salesEvents.id),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => users.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("event_offerings_event_offering_uq").on(table.eventId, table.offeringId)],
);
