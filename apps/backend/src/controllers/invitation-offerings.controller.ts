import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { InvitationOfferingsService } from "@vulkan/lib/services/invitation-offerings.service";
import { InvitationTokenParamSchema } from "@vulkan/lib/validators/invitation.schemas";
import type { Request, Response } from "express";

export const InvitationOfferingsController = {
  listByToken: withErrorHandling(
    async (request: Request, response: Response) => {
      const token = InvitationTokenParamSchema.parse(request.params.token);

      const data = await InvitationOfferingsService.listByToken(token);

      response.status(200).send({ success: true, data });
    },
  ),
};
