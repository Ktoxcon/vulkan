import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { InvitationDispatchService } from "@vulkan/lib/services/invitation-dispatch.service";
import { InvitationDispatchIdParamSchema } from "@vulkan/lib/validators/invitation-dispatch.schemas";
import type { Request, Response } from "express";

export const InvitationDispatchesController = {
  create: withErrorHandling(async (_request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;

    const result = await InvitationDispatchService.dispatch(event);

    response.status(202).send({ success: true, data: result });
  }),

  get: withErrorHandling(async (request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;
    InvitationDispatchIdParamSchema.parse(request.params.id);

    const progress = await InvitationDispatchService.getProgress(event.id);

    response.status(200).send({ success: true, data: progress });
  }),
};
