import { sql } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { portfolios } from "./portfolios";
import { users } from "./users";

export const portfolioStatusEvents = pgTable("portfolio_status_events", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id),
  fromStatus: varchar("from_status", { length: 16 }),
  toStatus: varchar("to_status", { length: 16 }).notNull(),
  changedBy: uuid("changed_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
