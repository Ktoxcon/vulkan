import { importRecords } from "@vulkan/lib/db/schema/import-records";

export type ImportRecordValidRow = {
  name: string;
  email: string;
  company: string | null;
};

export type ImportRecordInvalidRow = {
  rowNumber: number;
  raw: Record<string, string>;
  errors: string[];
};

export type ImportRecordDuplicateRow = {
  rowNumber: number;
  email: string;
};

export type ImportRecord = typeof importRecords.$inferSelect;
export type NewImportRecord = typeof importRecords.$inferInsert;
