import type { OfferingCsvService } from "@vulkan/lib/services/offering-csv.service";
import type {
  OfferingImportRecordDuplicateRow,
  OfferingImportRecordInvalidRow,
  OfferingImportRecordValidRow,
} from "@vulkan/lib/db/schema/offering-import-records.types";

export type OfferingCsvClassification = {
  processedCount: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  validRows: OfferingImportRecordValidRow[];
  invalidRows: OfferingImportRecordInvalidRow[];
  duplicateRows: OfferingImportRecordDuplicateRow[];
};

export type OfferingCsvServiceType = typeof OfferingCsvService;
