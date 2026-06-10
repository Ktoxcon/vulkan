import { db } from "@vulkan/lib/db/index";
import { offeringImportRecords } from "@vulkan/lib/db/schema/offering-import-records";
import type {
  NewOfferingImportRecord,
  OfferingImportRecord,
} from "@vulkan/lib/db/schema/offering-import-records.types";
import { eq } from "drizzle-orm";

export const OfferingImportRecordsRepository = {
  async create(
    input: NewOfferingImportRecord,
  ): Promise<OfferingImportRecord> {
    const [row] = await db
      .insert(offeringImportRecords)
      .values(input)
      .returning();
    return row as OfferingImportRecord;
  },

  async findById(id: string): Promise<OfferingImportRecord | undefined> {
    const [row] = await db
      .select()
      .from(offeringImportRecords)
      .where(eq(offeringImportRecords.id, id))
      .limit(1);
    return row;
  },

  async update(
    id: string,
    patch: Partial<NewOfferingImportRecord>,
  ): Promise<OfferingImportRecord | undefined> {
    const [row] = await db
      .update(offeringImportRecords)
      .set(patch)
      .where(eq(offeringImportRecords.id, id))
      .returning();
    return row;
  },
};
