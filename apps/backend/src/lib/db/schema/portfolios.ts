import { sql } from "drizzle-orm";
import {
  integer,
  numeric,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { PortfolioStatus } from "@vulkan/lib/constants/portfolio-status";
import { attendanceConfirmations } from "./attendance-confirmations";
import { clients } from "./clients";
import { salesEvents } from "./sales-events";
import { users } from "./users";

export const portfolios = pgTable(
  "portfolios",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => salesEvents.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    attendanceConfirmationId: uuid("attendance_confirmation_id")
      .notNull()
      .references(() => attendanceConfirmations.id),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    status: varchar("status", { length: 16 })
      .notNull()
      .default(PortfolioStatus.DRAFT),
    serviceSubtotal: numeric("service_subtotal", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    serviceDiscountPercentage: integer("service_discount_percentage")
      .notNull()
      .default(0),
    serviceDiscountAmount: numeric("service_discount_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    serviceTotalAfterDiscount: numeric("service_total_after_discount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    productSubtotal: numeric("product_subtotal", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    productDiscountPercentage: integer("product_discount_percentage")
      .notNull()
      .default(0),
    productDiscountAmount: numeric("product_discount_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    productTotalAfterDiscount: numeric("product_total_after_discount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    totalBeforeDiscount: numeric("total_before_discount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    totalDiscountAmount: numeric("total_discount_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    totalAfterDiscount: numeric("total_after_discount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("portfolios_attendance_confirmation_uq").on(
      table.attendanceConfirmationId,
    ),
  ],
);
