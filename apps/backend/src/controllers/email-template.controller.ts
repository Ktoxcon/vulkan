import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { EmailTemplateService } from "@vulkan/lib/services/email-template.service";
import type { Actor } from "@vulkan/lib/services/sales-events.service.types";
import {
  CreateEmailTemplateBodySchema,
  UpdateEmailTemplateBodySchema,
} from "@vulkan/lib/validators/email-template.schemas";
import type { Request, Response } from "express";

export const EmailTemplateController = {
  create: withErrorHandling(async (request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;
    const actor = response.locals.actor as Actor;
    const body = CreateEmailTemplateBodySchema.parse(request.body);

    const template = await EmailTemplateService.create(event, actor.id, body);

    response.status(201).send({ success: true, data: template });
  }),

  get: withErrorHandling(async (_request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;

    const template = await EmailTemplateService.get(event.id);

    response.status(200).send({ success: true, data: template });
  }),

  update: withErrorHandling(async (request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;
    const body = UpdateEmailTemplateBodySchema.parse(request.body);

    const template = await EmailTemplateService.update(event, body);

    response.status(200).send({ success: true, data: template });
  }),

  preview: withErrorHandling(async (_request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;

    const rendered = await EmailTemplateService.preview(event);

    response.status(200).send({ success: true, data: rendered });
  }),
};
