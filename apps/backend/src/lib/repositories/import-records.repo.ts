import { db } from "@vulkan/lib/db/index";
import { importRecords } from "@vulkan/lib/db/schema/import-records";
import type {
  ImportRecord,
  NewImportRecord,
} from "@vulkan/lib/db/schema/import-records.types";
import { and, eq } from "drizzle-orm";

export const ImportRecordsRepository = {
  async create(input: NewImportRecord): Promise<ImportRecord> {
    const [row] = await db.insert(importRecords).values(input).returning();
    return row as ImportRecord;
  },

  async findByIdForEvent(
    importId: string,
    eventId: string,
  ): Promise<ImportRecord | undefined> {
    const [row] = await db
      .select()
      .from(importRecords)
      .where(
        and(
          eq(importRecords.id, importId),
          eq(importRecords.eventId, eventId),
        ),
      )
      .limit(1);
    return row;
  },
};
