import { InvitationDispatchesController } from "@vulkan/controllers/invitation-dispatches.controller";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { EventOwnerMiddleware } from "@vulkan/middleware/event-owner.middleware";
import { Router } from "express";

export const InvitationDispatchesRoutes = Router({ mergeParams: true });

InvitationDispatchesRoutes.post(
  "/:eventId/invitation-dispatches",
  AuthMiddleware,
  EventOwnerMiddleware,
  InvitationDispatchesController.create,
);

InvitationDispatchesRoutes.get(
  "/:eventId/invitation-dispatches/:id",
  AuthMiddleware,
  EventOwnerMiddleware,
  InvitationDispatchesController.get,
);
