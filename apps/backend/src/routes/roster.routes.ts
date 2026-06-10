import { RosterController } from "@vulkan/controllers/roster.controller";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { EventOwnerMiddleware } from "@vulkan/middleware/event-owner.middleware";
import { FormDataMiddleware } from "@vulkan/middleware/form-data.middleware";
import { Router } from "express";

export const RosterRoutes = Router({ mergeParams: true });

RosterRoutes.post(
  "/:eventId/roster-imports",
  AuthMiddleware,
  EventOwnerMiddleware,
  FormDataMiddleware,
  RosterController.createImport,
);

RosterRoutes.get(
  "/:eventId/roster-imports/:importId",
  AuthMiddleware,
  EventOwnerMiddleware,
  RosterController.getImport,
);

RosterRoutes.patch(
  "/:eventId/roster-imports/:importId",
  AuthMiddleware,
  EventOwnerMiddleware,
  RosterController.confirmImport,
);

RosterRoutes.get(
  "/:eventId/roster",
  AuthMiddleware,
  EventOwnerMiddleware,
  RosterController.getRoster,
);

RosterRoutes.post(
  "/:eventId/roster-clients",
  AuthMiddleware,
  EventOwnerMiddleware,
  RosterController.addClient,
);
