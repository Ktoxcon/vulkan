import { PortfolioStatusValues } from "@vulkan/lib/constants/portfolio-status";
import { z } from "zod";

export const PortfolioIdParamSchema = z.string().uuid();

export const PortfolioStatusBodySchema = z.object({
  status: z.enum(PortfolioStatusValues),
});

export const PortfolioStatusFilterQuerySchema = z.object({
  status: z
    .union([
      z.enum(PortfolioStatusValues),
      z.array(z.enum(PortfolioStatusValues)),
    ])
    .optional(),
});
