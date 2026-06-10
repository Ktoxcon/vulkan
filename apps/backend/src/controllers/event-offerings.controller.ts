import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { EventOfferingsService } from "@vulkan/lib/services/event-offerings.service";
import type { Actor } from "@vulkan/lib/services/sales-events.service.types";
import {
  AssignOfferingBodySchema,
  OfferingIdParamSchema,
} from "@vulkan/lib/validators/offering.schemas";
import type { Request, Response } from "express";

export const EventOfferingsController = {
  listEventOfferings: withErrorHandling(
    async (_request: Request, response: Response) => {
      const event = response.locals.event as SalesEvent;

      const offerings = await EventOfferingsService.list(event.id);

      response.status(200).send({ success: true, data: { items: offerings } });
    },
  ),

  assignOffering: withErrorHandling(
    async (request: Request, response: Response) => {
      const event = response.locals.event as SalesEvent;
      const actor = response.locals.actor as Actor;
      const { offeringId } = AssignOfferingBodySchema.parse(request.body);

      const assignment = await EventOfferingsService.assign(
        event.id,
        offeringId,
        actor.id,
      );

      response.status(201).send({ success: true, data: assignment });
    },
  ),

  removeOffering: withErrorHandling(
    async (request: Request, response: Response) => {
      const event = response.locals.event as SalesEvent;
      const actor = response.locals.actor as Actor;
      const eventOfferingId = OfferingIdParamSchema.parse(
        request.params.eventOfferingId,
      );

      await EventOfferingsService.remove(event.id, eventOfferingId, actor.id);

      response.status(200).send({ success: true, data: null });
    },
  ),
};
