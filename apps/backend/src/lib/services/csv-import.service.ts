import { RosterCsvMalformedError } from "@vulkan/errors/roster.errors";
import { RosterCsvMaxRows } from "@vulkan/lib/constants/roster.constants";
import type {
  ImportRecordDuplicateRow,
  ImportRecordInvalidRow,
  ImportRecordValidRow,
} from "@vulkan/lib/db/schema/import-records.types";
import { ClientsRepository } from "@vulkan/lib/repositories/clients.repo";
import type { CsvClassification } from "@vulkan/lib/services/csv-import.service.types";
import { RosterCsvRowSchema } from "@vulkan/lib/validators/roster.schemas";
import { parse } from "csv-parse";
import { Readable } from "node:stream";
import { ZodError } from "zod";

export const CsvImportService = {
  async parseRows(file: Buffer): Promise<Record<string, string>[]> {
    const parser = parse({
      columns: true,
      trim: true,
      skip_empty_lines: true,
      bom: true,
      relax_column_count: true,
    });

    const rows: Record<string, string>[] = [];

    try {
      for await (const record of Readable.from(file).pipe(parser)) {
        rows.push(record as Record<string, string>);
        if (rows.length > RosterCsvMaxRows) break;
      }
    } catch (error: unknown) {
      throw new RosterCsvMalformedError(
        error instanceof Error ? error.message : "The CSV file is malformed.",
      );
    }

    return rows;
  },

  async classify(file: Buffer): Promise<CsvClassification> {
    const rawRows = await CsvImportService.parseRows(file);

    const validRows: ImportRecordValidRow[] = [];
    const invalidRows: ImportRecordInvalidRow[] = [];
    const duplicateRows: ImportRecordDuplicateRow[] = [];
    const candidates: { rowNumber: number; row: ImportRecordValidRow }[] = [];

    rawRows.forEach((raw, index) => {
      const rowNumber = index + 1;
      const parsed = RosterCsvRowSchema.safeParse(raw);
      if (!parsed.success) {
        invalidRows.push({
          rowNumber,
          raw,
          errors: (parsed.error as ZodError).issues.map(
            (issue) => `${issue.path.join(".") || "row"}: ${issue.message}`,
          ),
        });
        return;
      }
      candidates.push({ rowNumber, row: parsed.data });
    });

    const candidateEmails = candidates.map((candidate) => candidate.row.email);
    const existing = await ClientsRepository.findByEmails(candidateEmails);
    const existingEmails = new Set(existing.map((client) => client.email));

    const seenEmails = new Set<string>();

    for (const candidate of candidates) {
      const email = candidate.row.email;

      if (seenEmails.has(email) || existingEmails.has(email)) {
        duplicateRows.push({ rowNumber: candidate.rowNumber, email });
        continue;
      }

      seenEmails.add(email);
      validRows.push(candidate.row);
    }

    return {
      importedCount: rawRows.length,
      acceptedCount: validRows.length,
      invalidCount: invalidRows.length,
      duplicateCount: duplicateRows.length,
      validRows,
      invalidRows,
      duplicateRows,
    };
  },
};
