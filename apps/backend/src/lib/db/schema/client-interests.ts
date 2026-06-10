import { sql } from "drizzle-orm";
import { pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { attendanceConfirmations } from "./attendance-confirmations";
import { offerings } from "./offerings";

export const clientInterests = pgTable(
  "client_interests",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    confirmationId: uuid("confirmation_id")
      .notNull()
      .references(() => attendanceConfirmations.id),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("client_interests_confirmation_offering_uq").on(
      table.confirmationId,
      table.offeringId,
    ),
  ],
);
