import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { DiscountPreviewService } from "@vulkan/lib/services/discount-preview.service";
import { DiscountPreviewBodySchema } from "@vulkan/lib/validators/discount-preview.schemas";
import { InvitationTokenParamSchema } from "@vulkan/lib/validators/invitation.schemas";
import type { Request, Response } from "express";

export const DiscountPreviewController = {
  create: withErrorHandling(async (request: Request, response: Response) => {
    const token = InvitationTokenParamSchema.parse(request.params.token);
    const { offeringIds } = DiscountPreviewBodySchema.parse(request.body);

    const data = await DiscountPreviewService.preview(token, offeringIds);

    response.status(200).send({ success: true, data });
  }),
};
