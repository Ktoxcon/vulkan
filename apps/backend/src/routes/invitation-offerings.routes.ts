import { InvitationOfferingsController } from "@vulkan/controllers/invitation-offerings.controller";
import { Router } from "express";

export const InvitationOfferingsRoutes = Router({ mergeParams: true });

InvitationOfferingsRoutes.get(
  "/:token/offerings",
  InvitationOfferingsController.listByToken,
);
