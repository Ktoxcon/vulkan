import { SalesEventsController } from "@vulkan/controllers/sales-events.controller";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { EventOwnerMiddleware } from "@vulkan/middleware/event-owner.middleware";
import { Router } from "express";

export const SalesEventRoutes = Router({ mergeParams: true });

SalesEventRoutes.post("/", AuthMiddleware, SalesEventsController.createEvent);

SalesEventRoutes.get("/", AuthMiddleware, SalesEventsController.listEvents);

SalesEventRoutes.get(
  "/:eventId",
  AuthMiddleware,
  EventOwnerMiddleware,
  SalesEventsController.getEvent,
);

SalesEventRoutes.patch(
  "/:eventId",
  AuthMiddleware,
  EventOwnerMiddleware,
  SalesEventsController.updateEvent,
);

SalesEventRoutes.get(
  "/:eventId/readiness",
  AuthMiddleware,
  EventOwnerMiddleware,
  SalesEventsController.getReadiness,
);
