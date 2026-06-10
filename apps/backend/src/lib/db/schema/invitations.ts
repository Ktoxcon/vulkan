import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { InvitationStatus } from "@vulkan/lib/constants/invitation-status";
import { rosterClients } from "./roster-clients";
import { salesEvents } from "./sales-events";

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => salesEvents.id),
    rosterClientId: uuid("roster_client_id")
      .notNull()
      .references(() => rosterClients.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 128 }).notNull().unique(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default(InvitationStatus.PENDING),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("invitations_roster_client_uq").on(table.rosterClientId),
    index("invitations_token_idx").on(table.token),
  ],
);
