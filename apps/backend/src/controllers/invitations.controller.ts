import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { InvitationsService } from "@vulkan/lib/services/invitations.service";
import { InvitationStatusFilterQuerySchema } from "@vulkan/lib/validators/invitation.schemas";
import type { Request, Response } from "express";

export const InvitationsController = {
  generate: withErrorHandling(async (_request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;

    const result = await InvitationsService.generate(event);

    response.status(201).send({ success: true, data: result });
  }),

  list: withErrorHandling(async (request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;
    const { status } = InvitationStatusFilterQuerySchema.parse(request.query);
    const statuses =
      status === undefined ? [] : Array.isArray(status) ? status : [status];

    const view = await InvitationsService.list(event.id, statuses);

    response.status(200).send({ success: true, data: view });
  }),

  report: withErrorHandling(async (_request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;

    const csv = await InvitationsService.report(event.id);

    response.status(200);
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="invitations-${event.id}.csv"`,
    );
    response.send(csv);
  }),
};
