import { db } from "@vulkan/lib/db/index";
import { portfolioItems } from "@vulkan/lib/db/schema/portfolio-items";
import type { PortfolioItem } from "@vulkan/lib/db/schema/portfolio-items.types";
import type { DbExecutor } from "@vulkan/lib/repositories/capacity.repo.types";
import type { NewPortfolioItemValues } from "@vulkan/lib/repositories/portfolio-items.repo.types";
import { eq } from "drizzle-orm";

export const PortfolioItemsRepository = {
  async createMany(
    portfolioId: string,
    items: NewPortfolioItemValues[],
    executor: DbExecutor = db,
  ): Promise<void> {
    if (items.length === 0) return;
    await executor
      .insert(portfolioItems)
      .values(items.map((item) => ({ ...item, portfolioId })));
  },

  async listByPortfolio(
    portfolioId: string,
    executor: DbExecutor = db,
  ): Promise<PortfolioItem[]> {
    return executor
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.portfolioId, portfolioId));
  },
};
