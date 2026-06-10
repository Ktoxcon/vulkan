import { OfferingsController } from "@vulkan/controllers/offerings.controller";
import { AdminMiddleware } from "@vulkan/middleware/admin.middleware";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { Router } from "express";

export const OfferingsRoutes = Router();

OfferingsRoutes.get("/", AuthMiddleware, OfferingsController.listOfferings);
OfferingsRoutes.get(
  "/:offeringId",
  AuthMiddleware,
  OfferingsController.getOffering,
);
OfferingsRoutes.post(
  "/",
  AuthMiddleware,
  AdminMiddleware,
  OfferingsController.createOffering,
);
OfferingsRoutes.patch(
  "/:offeringId",
  AuthMiddleware,
  AdminMiddleware,
  OfferingsController.updateOffering,
);
OfferingsRoutes.delete(
  "/:offeringId",
  AuthMiddleware,
  AdminMiddleware,
  OfferingsController.deleteOffering,
);
