import { portfolios } from "@vulkan/lib/db/schema/portfolios";

export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;
