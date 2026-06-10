import { PortfoliosController } from "@vulkan/controllers/portfolios.controller";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { EventOwnerMiddleware } from "@vulkan/middleware/event-owner.middleware";
import { PortfolioOwnerMiddleware } from "@vulkan/middleware/portfolio-owner.middleware";
import { Router } from "express";

export const PortfolioListRoutes = Router({ mergeParams: true });

PortfolioListRoutes.get(
  "/:eventId/portfolios",
  AuthMiddleware,
  EventOwnerMiddleware,
  PortfoliosController.list,
);

export const PortfolioRoutes = Router({ mergeParams: true });

PortfolioRoutes.get(
  "/:portfolioId",
  AuthMiddleware,
  PortfolioOwnerMiddleware,
  PortfoliosController.detail,
);

PortfolioRoutes.patch(
  "/:portfolioId/status",
  AuthMiddleware,
  PortfolioOwnerMiddleware,
  PortfoliosController.updateStatus,
);

PortfolioRoutes.get(
  "/:portfolioId/export",
  AuthMiddleware,
  PortfolioOwnerMiddleware,
  PortfoliosController.export,
);
