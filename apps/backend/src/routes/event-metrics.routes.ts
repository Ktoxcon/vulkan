import { EventMetricsController } from "@vulkan/controllers/event-metrics.controller";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { EventOwnerMiddleware } from "@vulkan/middleware/event-owner.middleware";
import { Router } from "express";

export const EventMetricsRoutes = Router({ mergeParams: true });

EventMetricsRoutes.get(
  "/:eventId/metrics",
  AuthMiddleware,
  EventOwnerMiddleware,
  EventMetricsController.getMetrics,
);

EventMetricsRoutes.get(
  "/:eventId/summary",
  AuthMiddleware,
  EventOwnerMiddleware,
  EventMetricsController.getSummary,
);
