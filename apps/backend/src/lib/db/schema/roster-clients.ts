import { sql } from "drizzle-orm";
import { pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { rosters } from "./rosters";

export const rosterClients = pgTable(
  "roster_clients",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    rosterId: uuid("roster_id")
      .notNull()
      .references(() => rosters.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    name: varchar("name", { length: 255 }).notNull(),
    company: varchar("company", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("roster_clients_roster_client_uq").on(table.rosterId, table.clientId),
  ],
);
