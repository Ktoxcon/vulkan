import { EmailTemplateController } from "@vulkan/controllers/email-template.controller";
import { AuthMiddleware } from "@vulkan/middleware/auth.middleware";
import { EventOwnerMiddleware } from "@vulkan/middleware/event-owner.middleware";
import { Router } from "express";

export const EmailTemplateRoutes = Router({ mergeParams: true });

EmailTemplateRoutes.post(
  "/:eventId/email-template",
  AuthMiddleware,
  EventOwnerMiddleware,
  EmailTemplateController.create,
);

EmailTemplateRoutes.get(
  "/:eventId/email-template/preview",
  AuthMiddleware,
  EventOwnerMiddleware,
  EmailTemplateController.preview,
);

EmailTemplateRoutes.get(
  "/:eventId/email-template",
  AuthMiddleware,
  EventOwnerMiddleware,
  EmailTemplateController.get,
);

EmailTemplateRoutes.patch(
  "/:eventId/email-template",
  AuthMiddleware,
  EventOwnerMiddleware,
  EmailTemplateController.update,
);
