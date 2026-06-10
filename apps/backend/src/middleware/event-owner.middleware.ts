import { EventNotFoundError } from "@vulkan/errors/sales-event.errors";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { SalesEventsRepository } from "@vulkan/lib/repositories/sales-events.repo";
import { SalesEventsService } from "@vulkan/lib/services/sales-events.service";
import type { Actor } from "@vulkan/lib/services/sales-events.service.types";
import { EventIdParamSchema } from "@vulkan/lib/validators/sales-event.schemas";
import type { NextFunction, Request, Response } from "express";

export const EventOwnerMiddleware = withErrorHandling(
  async (request: Request, response: Response, next: NextFunction) => {
    const { data } = response.locals.session as {
      data: { id: string; userRole: string };
    };
    const actor: Actor = { id: data.id, role: data.userRole };

    const eventId = EventIdParamSchema.parse(request.params.eventId);

    const event = await SalesEventsRepository.findById(eventId);

    if (!event) {
      throw new EventNotFoundError();
    }

    SalesEventsService.assertCanAccess(actor, event);

    response.locals.event = event;
    response.locals.actor = actor;

    next();
  },
);
