import { MissingSessionError } from "@vulkan/errors/offering.errors";
import {
  OfferingImportFileEmptyError,
  OfferingImportFileMissingError,
  OfferingImportFileTypeError,
} from "@vulkan/errors/offering-import.errors";
import { OfferingImportCsvAcceptedMimeTypes } from "@vulkan/lib/constants/offering-import.constants";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { OfferingImportService } from "@vulkan/lib/services/offering-import.service";
import {
  ConfirmOfferingImportBodySchema,
  OfferingImportIdParamSchema,
} from "@vulkan/lib/validators/offering-import.schemas";
import type { Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";

export const OfferingImportsController = {
  createImport: withErrorHandling(
    async (request: Request, response: Response) => {
      const session = response.locals.session as JwtPayload | undefined;
      const data = session?.data as { id?: string } | undefined;
      if (!data?.id) {
        throw new MissingSessionError();
      }

      const file = request.file;
      if (!file) {
        throw new OfferingImportFileMissingError();
      }
      if (
        !OfferingImportCsvAcceptedMimeTypes.includes(
          file.mimetype as (typeof OfferingImportCsvAcceptedMimeTypes)[number],
        )
      ) {
        throw new OfferingImportFileTypeError();
      }
      if (file.size === 0) {
        throw new OfferingImportFileEmptyError();
      }

      const record = await OfferingImportService.createImport(data.id, {
        fileName: file.originalname,
        buffer: file.buffer,
      });

      response.status(201).send({ success: true, data: record });
    },
  ),

  getImport: withErrorHandling(async (request: Request, response: Response) => {
    const importId = OfferingImportIdParamSchema.parse(request.params.importId);

    const record = await OfferingImportService.getImport(importId);

    response.status(200).send({ success: true, data: record });
  }),

  confirmImport: withErrorHandling(
    async (request: Request, response: Response) => {
      const importId = OfferingImportIdParamSchema.parse(
        request.params.importId,
      );
      ConfirmOfferingImportBodySchema.parse(request.body);

      const record = await OfferingImportService.confirmImport(importId);

      response.status(200).send({ success: true, data: record });
    },
  ),
};
