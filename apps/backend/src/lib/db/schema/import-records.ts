import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { salesEvents } from "./sales-events";
import { users } from "./users";
import type {
  ImportRecordDuplicateRow,
  ImportRecordInvalidRow,
  ImportRecordValidRow,
} from "./import-records.types";

export const importRecords = pgTable("import_records", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  eventId: uuid("event_id")
    .notNull()
    .references(() => salesEvents.id),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  fileName: varchar("file_name", { length: 512 }).notNull(),
  importedCount: integer("imported_count").notNull().default(0),
  invalidCount: integer("invalid_count").notNull().default(0),
  duplicateCount: integer("duplicate_count").notNull().default(0),
  acceptedCount: integer("accepted_count").notNull().default(0),
  validRows: jsonb("valid_rows")
    .$type<ImportRecordValidRow[]>()
    .notNull()
    .default([]),
  invalidRows: jsonb("invalid_rows")
    .$type<ImportRecordInvalidRow[]>()
    .notNull()
    .default([]),
  duplicateRows: jsonb("duplicate_rows")
    .$type<ImportRecordDuplicateRow[]>()
    .notNull()
    .default([]),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
