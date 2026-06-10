import {
  OfferingImportAlreadyConfirmedError,
  OfferingImportEmptyValidError,
  OfferingImportNotFoundError,
} from "@vulkan/errors/offering-import.errors";
import { OfferingImportStatus } from "@vulkan/lib/constants/offering-import.constants";
import type {
  OfferingImportRecord,
  OfferingImportRecordDuplicateRow,
  OfferingImportRecordValidRow,
} from "@vulkan/lib/db/schema/offering-import-records.types";
import { OfferingImportRecordsRepository } from "@vulkan/lib/repositories/offering-import-records.repo";
import { OfferingsRepository } from "@vulkan/lib/repositories/offerings.repo";
import { OfferingCsvService } from "@vulkan/lib/services/offering-csv.service";
import type { OfferingImportUpload } from "@vulkan/lib/services/offering-import.service.types";

export const OfferingImportService = {
  async createImport(
    actorId: string,
    upload: OfferingImportUpload,
  ): Promise<OfferingImportRecord> {
    const classification = await OfferingCsvService.classify(upload.buffer);

    return OfferingImportRecordsRepository.create({
      status: OfferingImportStatus.PENDING,
      fileName: upload.fileName,
      processedCount: classification.processedCount,
      importedCount: 0,
      duplicateCount: classification.duplicateCount,
      invalidCount: classification.invalidCount,
      validRows: classification.validRows,
      invalidRows: classification.invalidRows,
      duplicateRows: classification.duplicateRows,
      createdBy: actorId,
    });
  },

  async getImport(importId: string): Promise<OfferingImportRecord> {
    const record = await OfferingImportRecordsRepository.findById(importId);
    if (!record) {
      throw new OfferingImportNotFoundError();
    }
    return record;
  },

  async confirmImport(importId: string): Promise<OfferingImportRecord> {
    const record = await OfferingImportService.getImport(importId);
    if (record.status === OfferingImportStatus.CONFIRMED) {
      throw new OfferingImportAlreadyConfirmedError();
    }
    if (record.validRows.length === 0) {
      throw new OfferingImportEmptyValidError();
    }

    const importedRows: OfferingImportRecordValidRow[] = [];
    const skippedRows: OfferingImportRecordDuplicateRow[] = [];

    let rowNumber = 0;
    for (const row of record.validRows) {
      rowNumber += 1;
      const existing = await OfferingsRepository.findByNameAndType({
        name: row.name,
        type: row.type,
      });
      if (existing) {
        skippedRows.push({
          rowNumber,
          name: row.name,
          type: row.type,
        });
        continue;
      }
      await OfferingsRepository.create({
        type: row.type,
        name: row.name,
        basePrice: row.basePrice,
        description: row.description,
      });
      importedRows.push(row);
    }

    const updated = await OfferingImportRecordsRepository.update(record.id, {
      status: OfferingImportStatus.CONFIRMED,
      importedCount: importedRows.length,
      duplicateCount: record.duplicateCount + skippedRows.length,
      duplicateRows: [...record.duplicateRows, ...skippedRows],
    });
    if (!updated) {
      throw new OfferingImportNotFoundError();
    }
    return updated;
  },
};
