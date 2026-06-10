import { sql } from "drizzle-orm";
import {
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { offerings } from "./offerings";
import { portfolios } from "./portfolios";

export const portfolioItems = pgTable("portfolio_items", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id),
  offeringId: uuid("offering_id")
    .notNull()
    .references(() => offerings.id),
  offeringName: varchar("offering_name", { length: 255 }).notNull(),
  offeringType: varchar("offering_type", { length: 16 }).notNull(),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  discountPercentage: integer("discount_percentage").notNull(),
  discountAmount: numeric("discount_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  finalPrice: numeric("final_price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
