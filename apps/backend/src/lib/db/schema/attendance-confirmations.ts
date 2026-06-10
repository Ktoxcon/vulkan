import { sql } from "drizzle-orm";
import {
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { invitations } from "./invitations";
import { salesEvents } from "./sales-events";

export const attendanceConfirmations = pgTable(
  "attendance_confirmations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => salesEvents.id),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    attendanceDate: timestamp("attendance_date", {
      withTimezone: true,
    }).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("attendance_confirmations_invitation_uq").on(table.invitationId),
  ],
);
