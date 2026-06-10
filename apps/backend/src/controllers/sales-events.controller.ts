import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { EventReadinessService } from "@vulkan/lib/services/event-readiness.service";
import { SalesEventsService } from "@vulkan/lib/services/sales-events.service";
import type { Actor } from "@vulkan/lib/services/sales-events.service.types";
import {
  CreateSalesEventRequestBodySchema,
  ListSalesEventsQuerySchema,
  UpdateSalesEventRequestBodySchema,
} from "@vulkan/lib/validators/sales-event.schemas";
import type { Request, Response } from "express";

export const SalesEventsController = {
  createEvent: withErrorHandling(
    async (request: Request, response: Response) => {
      const { data } = response.locals.session as {
        data: { id: string; userRole: string };
      };
      const actor: Actor = { id: data.id, role: data.userRole };
      const input = CreateSalesEventRequestBodySchema.parse(request.body);

      const event = await SalesEventsService.create(actor, input);

      response.status(201).send({ success: true, data: event });
    },
  ),

  listEvents: withErrorHandling(async (request: Request, response: Response) => {
    const { data } = response.locals.session as {
      data: { id: string; userRole: string };
    };
    const actor: Actor = { id: data.id, role: data.userRole };
    const { limit, offset } = ListSalesEventsQuerySchema.parse(request.query);

    const result = await SalesEventsService.list(actor, {
      ...(limit !== undefined ? { limit } : {}),
      ...(offset !== undefined ? { offset } : {}),
    });

    response.status(200).send({ success: true, data: result });
  }),

  getEvent: withErrorHandling(async (_request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;
    response.status(200).send({ success: true, data: event });
  }),

  updateEvent: withErrorHandling(
    async (request: Request, response: Response) => {
      const actor = response.locals.actor as Actor;
      const event = response.locals.event as SalesEvent;
      const patch = UpdateSalesEventRequestBodySchema.parse(request.body);

      const updated = await SalesEventsService.update(actor, event, patch);

      response.status(200).send({ success: true, data: updated });
    },
  ),

  getReadiness: withErrorHandling(
    async (_request: Request, response: Response) => {
      const event = response.locals.event as SalesEvent;

      const report = await EventReadinessService.evaluate(event);

      response.status(200).send({ success: true, data: report });
    },
  ),
};
