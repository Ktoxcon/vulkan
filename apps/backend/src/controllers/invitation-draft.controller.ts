import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { DraftConfirmationService } from "@vulkan/lib/services/draft-confirmation.service";
import { DraftConfirmationUpsertBodySchema } from "@vulkan/lib/validators/draft-confirmation.schemas";
import { InvitationTokenParamSchema } from "@vulkan/lib/validators/invitation.schemas";
import type { Request, Response } from "express";

export const InvitationDraftController = {
  getDraft: withErrorHandling(async (request: Request, response: Response) => {
    const token = InvitationTokenParamSchema.parse(request.params.token);

    const data = await DraftConfirmationService.getByToken(token);

    response.status(200).send({ success: true, data });
  }),

  saveDraft: withErrorHandling(async (request: Request, response: Response) => {
    const token = InvitationTokenParamSchema.parse(request.params.token);
    const body = DraftConfirmationUpsertBodySchema.parse(request.body);

    const data = await DraftConfirmationService.saveByToken(token, body.data);

    response.status(200).send({ success: true, data });
  }),
};
