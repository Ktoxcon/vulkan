import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const salesEvents = pgTable("sales_events", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  capacity: integer("capacity").notNull(),
  eventStartDate: timestamp("event_start_date", {
    withTimezone: true,
  }).notNull(),
  eventEndDate: timestamp("event_end_date", { withTimezone: true }),
  registrationStartDate: timestamp("registration_start_date", {
    withTimezone: true,
  }).notNull(),
  registrationEndDate: timestamp("registration_end_date", {
    withTimezone: true,
  }).notNull(),
  reservationTimeoutMinutes: integer("reservation_timeout_minutes")
    .notNull()
    .default(0),
  requireConfirmation: boolean("require_confirmation").notNull().default(false),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
