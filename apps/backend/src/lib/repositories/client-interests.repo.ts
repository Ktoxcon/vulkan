import { db } from "@vulkan/lib/db/index";
import { attendanceConfirmations } from "@vulkan/lib/db/schema/attendance-confirmations";
import { clientInterests } from "@vulkan/lib/db/schema/client-interests";
import { offerings } from "@vulkan/lib/db/schema/offerings";
import type { DbExecutor } from "@vulkan/lib/repositories/capacity.repo.types";
import type {
  ClientInterestOffering,
  InterestStats,
  OfferingInterest,
} from "@vulkan/lib/repositories/client-interests.repo.types";
import { OfferingType } from "@vulkan/lib/validators/offering.schemas";
import { count, countDistinct, desc, eq, inArray } from "drizzle-orm";

export const ClientInterestsRepository = {
  async createMany(
    confirmationId: string,
    offeringIds: string[],
    executor: DbExecutor = db,
  ): Promise<void> {
    if (offeringIds.length === 0) return;

    await executor
      .insert(clientInterests)
      .values(
        offeringIds.map((offeringId) => ({ confirmationId, offeringId })),
      );
  },

  async listOfferingsByIds(
    offeringIds: string[],
    executor: DbExecutor = db,
  ): Promise<ClientInterestOffering[]> {
    if (offeringIds.length === 0) return [];

    const rows = await executor
      .select({
        offeringId: offerings.id,
        name: offerings.name,
        type: offerings.type,
      })
      .from(offerings)
      .where(inArray(offerings.id, offeringIds));

    return rows;
  },

  async getInterestStats(eventId: string): Promise<InterestStats> {
    const rows = await db
      .select({
        offeringId: offerings.id,
        name: offerings.name,
        type: offerings.type,
        count: count(clientInterests.id),
      })
      .from(clientInterests)
      .innerJoin(
        attendanceConfirmations,
        eq(clientInterests.confirmationId, attendanceConfirmations.id),
      )
      .innerJoin(offerings, eq(clientInterests.offeringId, offerings.id))
      .where(eq(attendanceConfirmations.eventId, eventId))
      .groupBy(offerings.id, offerings.name, offerings.type)
      .orderBy(desc(count(clientInterests.id)));

    const topProducts: OfferingInterest[] = [];
    const topServices: OfferingInterest[] = [];

    for (const row of rows) {
      const interest: OfferingInterest = {
        offeringId: row.offeringId,
        name: row.name,
        count: row.count,
      };
      if (row.type === OfferingType.PRODUCT) {
        topProducts.push(interest);
      } else if (row.type === OfferingType.SERVICE) {
        topServices.push(interest);
      }
    }

    const [totalRow] = await db
      .select({
        total: countDistinct(clientInterests.confirmationId),
      })
      .from(clientInterests)
      .innerJoin(
        attendanceConfirmations,
        eq(clientInterests.confirmationId, attendanceConfirmations.id),
      )
      .where(eq(attendanceConfirmations.eventId, eventId));

    return {
      topProducts,
      topServices,
      total: totalRow?.total ?? 0,
    };
  },
};
