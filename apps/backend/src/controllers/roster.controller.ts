import {
  RosterFileEmptyError,
  RosterFileMissingError,
  RosterFileTypeError,
} from "@vulkan/errors/roster.errors";
import { RosterCsvAcceptedMimeTypes } from "@vulkan/lib/constants/roster.constants";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { RosterService } from "@vulkan/lib/services/roster.service";
import type { Actor } from "@vulkan/lib/services/sales-events.service.types";
import {
  AddRosterClientBodySchema,
  ConfirmImportBodySchema,
  ImportIdParamSchema,
} from "@vulkan/lib/validators/roster.schemas";
import type { Request, Response } from "express";

export const RosterController = {
  createImport: withErrorHandling(
    async (request: Request, response: Response) => {
      const event = response.locals.event as SalesEvent;
      const actor = response.locals.actor as Actor;

      const file = request.file;

      if (!file) {
        throw new RosterFileMissingError();
      }

      if (
        !RosterCsvAcceptedMimeTypes.includes(
          file.mimetype as (typeof RosterCsvAcceptedMimeTypes)[number],
        )
      ) {
        throw new RosterFileTypeError();
      }

      if (file.size === 0) {
        throw new RosterFileEmptyError();
      }

      const record = await RosterService.createImport(event, actor.id, {
        fileName: file.originalname,
        buffer: file.buffer,
      });

      response.status(201).send({ success: true, data: record });
    },
  ),

  getImport: withErrorHandling(async (request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;
    const importId = ImportIdParamSchema.parse(request.params.importId);

    const record = await RosterService.getImport(event.id, importId);

    response.status(200).send({ success: true, data: record });
  }),

  confirmImport: withErrorHandling(
    async (request: Request, response: Response) => {
      const event = response.locals.event as SalesEvent;
      const actor = response.locals.actor as Actor;
      const importId = ImportIdParamSchema.parse(request.params.importId);

      ConfirmImportBodySchema.parse(request.body);

      const roster = await RosterService.confirmImport(
        event,
        actor.id,
        importId,
      );

      response.status(200).send({ success: true, data: roster });
    },
  ),

  getRoster: withErrorHandling(
    async (_request: Request, response: Response) => {
      const event = response.locals.event as SalesEvent;

      const view = await RosterService.getRoster(event.id);

      response.status(200).send({ success: true, data: view });
    },
  ),

  addClient: withErrorHandling(async (request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;
    const actor = response.locals.actor as Actor;
    const body = AddRosterClientBodySchema.parse(request.body);

    const member = await RosterService.addClient(event, actor.id, body);

    response.status(201).send({ success: true, data: member });
  }),
};
