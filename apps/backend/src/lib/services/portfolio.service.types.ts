import type { PortfolioItem } from "@vulkan/lib/db/schema/portfolio-items.types";
import type { PortfolioDetail } from "@vulkan/lib/repositories/portfolios.repo.types";
import type { Actor } from "@vulkan/lib/services/sales-events.service.types";

export type PortfolioActor = Actor;

export type PortfolioDetailWithItems = PortfolioDetail & {
  items: PortfolioItem[];
};
