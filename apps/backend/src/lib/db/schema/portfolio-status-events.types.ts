import { portfolioStatusEvents } from "@vulkan/lib/db/schema/portfolio-status-events";

export type PortfolioStatusEvent = typeof portfolioStatusEvents.$inferSelect;
export type NewPortfolioStatusEvent =
  typeof portfolioStatusEvents.$inferInsert;
