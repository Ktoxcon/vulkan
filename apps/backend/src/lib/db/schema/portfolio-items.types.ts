import { portfolioItems } from "@vulkan/lib/db/schema/portfolio-items";

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type NewPortfolioItem = typeof portfolioItems.$inferInsert;
