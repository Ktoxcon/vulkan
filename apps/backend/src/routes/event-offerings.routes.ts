import { EventOfferingsController } from "@vulkan/controllers/event-offerings.controller";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { EventOwnerMiddleware } from "@vulkan/middleware/event-owner.middleware";
import { Router } from "express";

export const EventOfferingsRoutes = Router({ mergeParams: true });

EventOfferingsRoutes.get(
  "/:eventId/offerings",
  AuthMiddleware,
  EventOwnerMiddleware,
  EventOfferingsController.listEventOfferings,
);
EventOfferingsRoutes.post(
  "/:eventId/offerings",
  AuthMiddleware,
  EventOwnerMiddleware,
  EventOfferingsController.assignOffering,
);
EventOfferingsRoutes.delete(
  "/:eventId/offerings/:eventOfferingId",
  AuthMiddleware,
  EventOwnerMiddleware,
  EventOfferingsController.removeOffering,
);
