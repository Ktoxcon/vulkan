import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import type {
  OfferingImportRecordDuplicateRow,
  OfferingImportRecordInvalidRow,
  OfferingImportRecordValidRow,
} from "./offering-import-records.types";

export const offeringImportRecords = pgTable("offering_import_records", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  fileName: varchar("file_name", { length: 512 }).notNull(),
  processedCount: integer("processed_count").notNull().default(0),
  importedCount: integer("imported_count").notNull().default(0),
  duplicateCount: integer("duplicate_count").notNull().default(0),
  invalidCount: integer("invalid_count").notNull().default(0),
  validRows: jsonb("valid_rows")
    .$type<OfferingImportRecordValidRow[]>()
    .notNull()
    .default([]),
  invalidRows: jsonb("invalid_rows")
    .$type<OfferingImportRecordInvalidRow[]>()
    .notNull()
    .default([]),
  duplicateRows: jsonb("duplicate_rows")
    .$type<OfferingImportRecordDuplicateRow[]>()
    .notNull()
    .default([]),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
