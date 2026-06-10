import { sql } from "drizzle-orm";
import { jsonb, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { invitations } from "./invitations";

export const draftConfirmations = pgTable(
  "draft_confirmations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("draft_confirmations_invitation_uq").on(table.invitationId),
  ],
);
