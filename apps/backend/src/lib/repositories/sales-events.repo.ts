import { db } from "@vulkan/lib/db";
import { salesEvents } from "@vulkan/lib/db/schema/sales-events";
import type {
  NewSalesEvent,
  SalesEvent,
} from "@vulkan/lib/db/schema/sales-events.types";
import type {
  ListSalesEventsParams,
  ListSalesEventsResult,
} from "@vulkan/lib/repositories/sales-events.repo.types";
import { count, desc, eq } from "drizzle-orm";

export const SalesEventsRepository = {
  async findById(id: string): Promise<SalesEvent | undefined> {
    const [row] = await db
      .select()
      .from(salesEvents)
      .where(eq(salesEvents.id, id))
      .limit(1);
    return row;
  },

  async create(input: NewSalesEvent): Promise<SalesEvent> {
    const [row] = await db.insert(salesEvents).values(input).returning();
    return row as SalesEvent;
  },

  async update(
    id: string,
    patch: Partial<NewSalesEvent>,
  ): Promise<SalesEvent | undefined> {
    const [row] = await db
      .update(salesEvents)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(salesEvents.id, id))
      .returning();
    return row;
  },

  async list(
    params: ListSalesEventsParams = {},
  ): Promise<ListSalesEventsResult> {
    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;

    const itemsQuery = db
      .select()
      .from(salesEvents)
      .orderBy(desc(salesEvents.createdAt))
      .limit(limit)
      .offset(offset);

    const countQuery = db.select({ value: count() }).from(salesEvents);

    if (params.ownerId !== undefined) {
      itemsQuery.where(eq(salesEvents.ownerId, params.ownerId));
      countQuery.where(eq(salesEvents.ownerId, params.ownerId));
    }

    const items = await itemsQuery;
    const [totals] = await countQuery;

    return { count: totals?.value ?? 0, items };
  },
};
