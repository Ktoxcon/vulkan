import { sql } from "drizzle-orm";
import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { ReservationStatus } from "@vulkan/lib/constants/reservation-status";
import { invitations } from "./invitations";
import { salesEvents } from "./sales-events";

export const seatReservations = pgTable(
  "seat_reservations",
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
    status: varchar("status", { length: 32 })
      .notNull()
      .default(ReservationStatus.ACTIVE),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("seat_reservations_event_status_idx").on(table.eventId, table.status),
  ],
);
