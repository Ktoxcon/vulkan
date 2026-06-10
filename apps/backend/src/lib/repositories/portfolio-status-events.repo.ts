import { db } from "@vulkan/lib/db/index";
import { portfolioStatusEvents } from "@vulkan/lib/db/schema/portfolio-status-events";
import type { PortfolioStatusEvent } from "@vulkan/lib/db/schema/portfolio-status-events.types";
import type { DbExecutor } from "@vulkan/lib/repositories/capacity.repo.types";
import type { NewPortfolioStatusEventInput } from "@vulkan/lib/repositories/portfolio-status-events.repo.types";

export const PortfolioStatusEventsRepository = {
  async create(
    input: NewPortfolioStatusEventInput,
    executor: DbExecutor = db,
  ): Promise<PortfolioStatusEvent> {
    const [row] = await executor
      .insert(portfolioStatusEvents)
      .values(input)
      .returning();
    return row as PortfolioStatusEvent;
  },
};
