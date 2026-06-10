import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { InvitationsService } from "@vulkan/lib/services/invitations.service";
import { InvitationTokenParamSchema } from "@vulkan/lib/validators/invitation.schemas";
import type { Request, Response } from "express";

export const InvitationTokensController = {
  resolve: withErrorHandling(async (request: Request, response: Response) => {
    const token = InvitationTokenParamSchema.parse(request.params.token);

    const view = await InvitationsService.resolveToken(token);

    response.status(200).send({ success: true, data: view });
  }),

  pixel: withErrorHandling(async (request: Request, response: Response) => {
    const token = InvitationTokenParamSchema.parse(request.params.token);

    const result = await InvitationsService.trackOpen(token);

    response.status(200);
    response.setHeader("Content-Type", result.contentType);
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    response.send(result.body);
  }),
};
