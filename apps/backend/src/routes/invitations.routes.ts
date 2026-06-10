import { InvitationsController } from "@vulkan/controllers/invitations.controller";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { EventOwnerMiddleware } from "@vulkan/middleware/event-owner.middleware";
import { Router } from "express";

export const InvitationsRoutes = Router({ mergeParams: true });

InvitationsRoutes.post(
  "/:eventId/invitations",
  AuthMiddleware,
  EventOwnerMiddleware,
  InvitationsController.generate,
);

InvitationsRoutes.get(
  "/:eventId/invitations/report",
  AuthMiddleware,
  EventOwnerMiddleware,
  InvitationsController.report,
);

InvitationsRoutes.get(
  "/:eventId/invitations",
  AuthMiddleware,
  EventOwnerMiddleware,
  InvitationsController.list,
);
