import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { salesEvents } from "./sales-events";
import { users } from "./users";

export const emailTemplates = pgTable(
  "email_templates",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => salesEvents.id),
    name: varchar("name", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 512 }).notNull(),
    htmlBody: text("html_body").notNull(),
    textBody: text("text_body").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("email_templates_event_uq").on(table.eventId)],
);
