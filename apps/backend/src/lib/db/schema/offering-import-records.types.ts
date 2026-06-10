import { offeringImportRecords } from "@vulkan/lib/db/schema/offering-import-records";

export type OfferingImportRecordValidRow = {
  name: string;
  type: string;
  description: string | null;
  basePrice: string;
};

export type OfferingImportRecordInvalidRow = {
  rowNumber: number;
  raw: Record<string, string>;
  errors: string[];
};

export type OfferingImportRecordDuplicateRow = {
  rowNumber: number;
  name: string;
  type: string;
};

export type OfferingImportRecord = typeof offeringImportRecords.$inferSelect;
export type NewOfferingImportRecord = typeof offeringImportRecords.$inferInsert;
