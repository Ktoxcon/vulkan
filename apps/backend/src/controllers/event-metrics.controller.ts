import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { EventMetricsService } from "@vulkan/lib/services/event-metrics.service";
import type { Request, Response } from "express";

export const EventMetricsController = {
  getMetrics: withErrorHandling(
    async (_request: Request, response: Response) => {
      const event = response.locals.event as SalesEvent;
      const metrics = await EventMetricsService.getMetrics(event);
      response.status(200).send({ success: true, data: metrics });
    },
  ),

  getSummary: withErrorHandling(
    async (_request: Request, response: Response) => {
      const event = response.locals.event as SalesEvent;
      const summary = await EventMetricsService.getSummary(event);
      response.status(200).send({ success: true, data: summary });
    },
  ),
};
