import { InvitationTokensController } from "@vulkan/controllers/invitation-tokens.controller";
import { Router } from "express";

export const InvitationTokensRoutes = Router({ mergeParams: true });

InvitationTokensRoutes.get("/:token/pixel", InvitationTokensController.pixel);

InvitationTokensRoutes.get("/:token", InvitationTokensController.resolve);
