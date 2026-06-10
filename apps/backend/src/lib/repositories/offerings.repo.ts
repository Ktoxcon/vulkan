import { db } from "@vulkan/lib/db/index";
import { offerings } from "@vulkan/lib/db/schema/offerings";
import type {
  NewOffering,
  Offering,
} from "@vulkan/lib/db/schema/offerings.types";
import type { DbExecutor } from "@vulkan/lib/repositories/capacity.repo.types";
import type {
  FindByNameAndTypeParams,
  ListOfferingsParams,
  ListOfferingsResult,
  OfferingWithPrice,
} from "@vulkan/lib/repositories/offerings.repo.types";
import { and, count, eq, ilike, inArray, or } from "drizzle-orm";

export const OfferingsRepository = {
  async findById(id: string): Promise<Offering | undefined> {
    const [row] = await db
      .select()
      .from(offerings)
      .where(eq(offerings.id, id))
      .limit(1);
    return row;
  },

  async findByNameAndType(
    params: FindByNameAndTypeParams,
  ): Promise<Offering | undefined> {
    const [row] = await db
      .select()
      .from(offerings)
      .where(
        and(eq(offerings.name, params.name), eq(offerings.type, params.type)),
      )
      .limit(1);
    return row;
  },

  async create(input: NewOffering): Promise<Offering> {
    const [row] = await db.insert(offerings).values(input).returning();
    return row as Offering;
  },

  async update(
    id: string,
    patch: Partial<NewOffering>,
  ): Promise<Offering | undefined> {
    const [row] = await db
      .update(offerings)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(offerings.id, id))
      .returning();
    return row;
  },

  async softDelete(id: string): Promise<Offering | undefined> {
    const [row] = await db
      .update(offerings)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(offerings.id, id))
      .returning();
    return row;
  },

  async listByIdsWithPrice(
    offeringIds: string[],
    executor: DbExecutor = db,
  ): Promise<OfferingWithPrice[]> {
    if (offeringIds.length === 0) return [];
    return executor
      .select({
        offeringId: offerings.id,
        name: offerings.name,
        type: offerings.type,
        basePrice: offerings.basePrice,
      })
      .from(offerings)
      .where(inArray(offerings.id, offeringIds));
  },

  async list(params: ListOfferingsParams = {}): Promise<ListOfferingsResult> {
    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;

    const filters = [];
    if (params.type !== undefined) {
      filters.push(eq(offerings.type, params.type));
    }
    if (params.isActive !== undefined) {
      filters.push(eq(offerings.isActive, params.isActive));
    }
    if (params.search !== undefined) {
      const term = `%${params.search}%`;
      filters.push(
        or(ilike(offerings.name, term), ilike(offerings.description, term)),
      );
    }
    const where = filters.length > 0 ? and(...filters) : undefined;

    const items = await db
      .select()
      .from(offerings)
      .where(where)
      .limit(limit)
      .offset(offset);

    const [totals] = await db
      .select({ value: count() })
      .from(offerings)
      .where(where);

    return { count: totals?.value ?? 0, items };
  },
};
