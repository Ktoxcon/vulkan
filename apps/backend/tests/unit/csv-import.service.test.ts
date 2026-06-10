import { CsvImportService } from "@vulkan/lib/services/csv-import.service";
import { buildRawCsv, buildRosterCsv } from "@tests/helpers/csv-buffer";
import { makeClient } from "@tests/fixtures/clients";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("CsvImportService", () => {
  describe("parseRows", () => {
    it("parses a header + data rows into keyed records", async () => {
      const buffer = buildRosterCsv([
        { name: "John Doe", email: "john@email.com", company: "Acme" },
        { name: "Jane Doe", email: "jane@email.com", company: "Globex" },
      ]);

      const rows = await CsvImportService.parseRows(buffer);

      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ name: "John Doe", email: "john@email.com" });
    });

    it("throws ROSTER_CSV_MALFORMED on broken quoting", async () => {
      const buffer = buildRawCsv('name,email,company\n"unterminated,john@email.com,Acme');

      await expect(CsvImportService.parseRows(buffer)).rejects.toMatchObject({
        code: "ROSTER_CSV_MALFORMED",
      });
    });
  });

  describe("classify - validation (story 3.2)", () => {
    it("accepts valid rows and normalizes email casing + blank company", async () => {
      const buffer = buildRosterCsv([
        { name: "John Doe", email: "JOHN@Email.com", company: "" },
      ]);

      const result = await CsvImportService.classify(buffer);

      expect(result.importedCount).toBe(1);
      expect(result.acceptedCount).toBe(1);
      expect(result.validRows[0]).toEqual({
        name: "John Doe",
        email: "john@email.com",
        company: null,
      });
    });

    it("flags rows missing required fields and invalid emails as invalid", async () => {
      const buffer = buildRosterCsv([
        { name: "", email: "noname@email.com", company: "Acme" },
        { name: "Bad Email", email: "not-an-email", company: "Acme" },
        { name: "Good", email: "good@email.com", company: "Acme" },
      ]);

      const result = await CsvImportService.classify(buffer);

      expect(result.invalidCount).toBe(2);
      expect(result.acceptedCount).toBe(1);
      expect(result.invalidRows[0]).toMatchObject({ rowNumber: 1 });
      expect(result.invalidRows[0]?.errors.length).toBeGreaterThan(0);
      expect(result.invalidRows[1]).toMatchObject({ rowNumber: 2 });
    });
  });

  describe("classify - deduplication (story 3.2)", () => {
    it("detects duplicate emails within the same file (case-insensitive)", async () => {
      const buffer = buildRosterCsv([
        { name: "First", email: "dup@email.com", company: "Acme" },
        { name: "Second", email: "DUP@email.com", company: "Globex" },
      ]);

      const result = await CsvImportService.classify(buffer);

      expect(result.acceptedCount).toBe(1);
      expect(result.duplicateCount).toBe(1);
      expect(result.duplicateRows[0]).toMatchObject({
        rowNumber: 2,
        email: "dup@email.com",
      });
    });

    it("detects rows matching an existing client email as duplicates", async () => {
      await makeClient({ email: "existing@email.com" });
      const buffer = buildRosterCsv([
        { name: "New", email: "new@email.com", company: "Acme" },
        { name: "Existing", email: "existing@email.com", company: "Acme" },
      ]);

      const result = await CsvImportService.classify(buffer);

      expect(result.acceptedCount).toBe(1);
      expect(result.duplicateCount).toBe(1);
      expect(result.duplicateRows[0]?.email).toBe("existing@email.com");
    });

    it("produces the full validation report counts", async () => {
      await makeClient({ email: "known@email.com" });
      const buffer = buildRosterCsv([
        { name: "Valid", email: "valid@email.com", company: "Acme" },
        { name: "", email: "invalid@email.com", company: "Acme" },
        { name: "Dup", email: "valid@email.com", company: "Acme" },
        { name: "Known", email: "known@email.com", company: "Acme" },
      ]);

      const result = await CsvImportService.classify(buffer);

      expect(result).toMatchObject({
        importedCount: 4,
        acceptedCount: 1,
        invalidCount: 1,
        duplicateCount: 2,
      });
    });
  });
});
