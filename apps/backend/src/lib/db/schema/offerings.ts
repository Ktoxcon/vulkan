import { sql } from "drizzle-orm";
import {
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const offerings = pgTable("offerings", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 16 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  basePrice: numeric("base_price", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
