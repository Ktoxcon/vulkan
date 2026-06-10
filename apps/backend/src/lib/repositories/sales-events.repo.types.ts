import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import type { SalesEventsRepository } from "@vulkan/lib/repositories/sales-events.repo";

export type ListSalesEventsParams = {
  ownerId?: string;
  limit?: number;
  offset?: number;
};

export type ListSalesEventsResult = {
  count: number;
  items: SalesEvent[];
};

export type SalesEventsRepositoryType = typeof SalesEventsRepository;
