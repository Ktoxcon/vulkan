import type { PortfolioStatus as PortfolioStatusConst } from "@vulkan/lib/constants/portfolio-status";

export type PortfolioStatus =
  (typeof PortfolioStatusConst)[keyof typeof PortfolioStatusConst];
