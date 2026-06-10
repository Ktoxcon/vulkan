import { OfferingsRepository } from "@vulkan/lib/repositories/offerings.repo";
import { OfferingCsvService } from "@vulkan/lib/services/offering-csv.service";
import { OfferingImportService } from "@vulkan/lib/services/offering-import.service";
import { makeOffering } from "@tests/fixtures/offerings";
import { makeUser } from "@tests/fixtures/users";
import { buildOfferingCsv } from "@tests/helpers/csv-buffer";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("OfferingCsvService.classify", () => {
  it("classifies valid rows and stores basePrice as a 2-decimal string", async () => {
    const csv = buildOfferingCsv([
      { name: "Alpha", type: "product", description: "first", basePrice: "10" },
      { name: "Beta", type: "service", basePrice: "5.5" },
    ]);
    const result = await OfferingCsvService.classify(csv);
    expect(result.processedCount).toBe(2);
    expect(result.validCount).toBe(2);
    expect(result.validRows[0]).toEqual({
      name: "Alpha",
      type: "product",
      description: "first",
      basePrice: "10.00",
    });
    expect(result.validRows[1]!.basePrice).toBe("5.50");
    expect(result.validRows[1]!.description).toBeNull();
  });

  it("flags invalid rows (bad type / empty name / negative price) with row numbers", async () => {
    const csv = buildOfferingCsv([
      { name: "", type: "product", basePrice: "10" },
      { name: "BadType", type: "widget", basePrice: "10" },
      { name: "BadPrice", type: "service", basePrice: "-1" },
    ]);
    const result = await OfferingCsvService.classify(csv);
    expect(result.validCount).toBe(0);
    expect(result.invalidCount).toBe(3);
    expect(result.invalidRows.map((r) => r.rowNumber).sort()).toEqual([
      1, 2, 3,
    ]);
    expect(result.invalidRows[0]!.errors.length).toBeGreaterThan(0);
  });

  it("flags in-file duplicates (name+type) and only keeps the first occurrence", async () => {
    const csv = buildOfferingCsv([
      { name: "Dup", type: "product", basePrice: "10" },
      { name: "Dup", type: "product", basePrice: "20" },
      { name: "Dup", type: "service", basePrice: "30" },
    ]);
    const result = await OfferingCsvService.classify(csv);
    expect(result.validCount).toBe(2);
    expect(result.duplicateCount).toBe(1);
    expect(result.duplicateRows[0]).toMatchObject({
      rowNumber: 2,
      name: "Dup",
      type: "product",
    });
  });

  it("flags duplicates against the existing catalog", async () => {
    await makeOffering({ type: "product", name: "InCatalog" });
    const csv = buildOfferingCsv([
      { name: "InCatalog", type: "product", basePrice: "10" },
      { name: "FreshOne", type: "product", basePrice: "10" },
    ]);
    const result = await OfferingCsvService.classify(csv);
    expect(result.validCount).toBe(1);
    expect(result.duplicateCount).toBe(1);
    expect(result.validRows[0]!.name).toBe("FreshOne");
  });
});

describe("OfferingImportService", () => {
  it("createImport persists a pending record with importedCount 0", async () => {
    const admin = await makeUser({ role: "admin" });
    const csv = buildOfferingCsv([
      { name: "One", type: "product", basePrice: "10" },
    ]);
    const record = await OfferingImportService.createImport(admin.id, {
      fileName: "offerings.csv",
      buffer: csv,
    });
    expect(record.status).toBe("pending");
    expect(record.importedCount).toBe(0);
    expect(record.validRows).toHaveLength(1);
    expect(record.createdBy).toBe(admin.id);
  });

  it("confirmImport inserts valid rows and marks confirmed", async () => {
    const admin = await makeUser({ role: "admin" });
    const csv = buildOfferingCsv([
      { name: "Confirmed A", type: "product", basePrice: "10" },
      { name: "Confirmed B", type: "service", basePrice: "20" },
    ]);
    const record = await OfferingImportService.createImport(admin.id, {
      fileName: "offerings.csv",
      buffer: csv,
    });

    const confirmed = await OfferingImportService.confirmImport(record.id);
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.importedCount).toBe(2);

    const list = await OfferingsRepository.list({ search: "Confirmed" });
    expect(list.count).toBe(2);
  });

  it("confirmImport skips a row that became a catalog duplicate (partial import)", async () => {
    const admin = await makeUser({ role: "admin" });
    const csv = buildOfferingCsv([
      { name: "Partial A", type: "product", basePrice: "10" },
      { name: "Partial B", type: "product", basePrice: "20" },
    ]);
    const record = await OfferingImportService.createImport(admin.id, {
      fileName: "offerings.csv",
      buffer: csv,
    });

    await makeOffering({ type: "product", name: "Partial A" });

    const confirmed = await OfferingImportService.confirmImport(record.id);
    expect(confirmed.importedCount).toBe(1);
    expect(confirmed.duplicateCount).toBe(1);
  });

  it("rejects confirming twice (OFFERING_IMPORT_ALREADY_CONFIRMED)", async () => {
    const admin = await makeUser({ role: "admin" });
    const csv = buildOfferingCsv([
      { name: "Solo", type: "product", basePrice: "10" },
    ]);
    const record = await OfferingImportService.createImport(admin.id, {
      fileName: "offerings.csv",
      buffer: csv,
    });
    await OfferingImportService.confirmImport(record.id);
    await expect(
      OfferingImportService.confirmImport(record.id),
    ).rejects.toMatchObject({
      code: "OFFERING_IMPORT_ALREADY_CONFIRMED",
      httpStatusCode: 409,
    });
  });

  it("rejects confirming an import with no valid rows (OFFERING_IMPORT_NO_VALID_ROWS)", async () => {
    const admin = await makeUser({ role: "admin" });
    const csv = buildOfferingCsv([
      { name: "", type: "product", basePrice: "10" },
    ]);
    const record = await OfferingImportService.createImport(admin.id, {
      fileName: "offerings.csv",
      buffer: csv,
    });
    await expect(
      OfferingImportService.confirmImport(record.id),
    ).rejects.toMatchObject({ code: "OFFERING_IMPORT_NO_VALID_ROWS" });
  });

  it("getImport throws OFFERING_IMPORT_NOT_FOUND for an unknown id", async () => {
    await expect(
      OfferingImportService.getImport(
        "22222222-2222-4222-8222-222222222222",
      ),
    ).rejects.toMatchObject({ code: "OFFERING_IMPORT_NOT_FOUND" });
  });
});
