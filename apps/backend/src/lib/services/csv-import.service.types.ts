import type {
  ImportRecordDuplicateRow,
  ImportRecordInvalidRow,
  ImportRecordValidRow,
} from "@vulkan/lib/db/schema/import-records.types";

export type CsvClassification = {
  importedCount: number;
  acceptedCount: number;
  invalidCount: number;
  duplicateCount: number;
  validRows: ImportRecordValidRow[];
  invalidRows: ImportRecordInvalidRow[];
  duplicateRows: ImportRecordDuplicateRow[];
};
