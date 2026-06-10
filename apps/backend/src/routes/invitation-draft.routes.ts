import { InvitationDraftController } from "@vulkan/controllers/invitation-draft.controller";
import { Router } from "express";

export const InvitationDraftRoutes = Router({ mergeParams: true });

InvitationDraftRoutes.get(
  "/:token/draft",
  InvitationDraftController.getDraft,
);

InvitationDraftRoutes.put(
  "/:token/draft",
  InvitationDraftController.saveDraft,
);
