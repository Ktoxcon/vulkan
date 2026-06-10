import { MissingSessionError } from "@vulkan/errors/offering.errors";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { OfferingsService } from "@vulkan/lib/services/offerings.service";
import {
  CreateOfferingBodySchema,
  ListOfferingsQuerySchema,
  OfferingIdParamSchema,
  UpdateOfferingBodySchema,
} from "@vulkan/lib/validators/offering.schemas";
import type { Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";

export const OfferingsController = {
  createOffering: withErrorHandling(
    async (request: Request, response: Response) => {
      const body = CreateOfferingBodySchema.parse(request.body);

      const created = await OfferingsService.create(body);

      response.status(201).send({ success: true, data: created });
    },
  ),

  getOffering: withErrorHandling(
    async (request: Request, response: Response) => {
      const id = OfferingIdParamSchema.parse(request.params.offeringId);

      const offering = await OfferingsService.getById(id);

      response.status(200).send({ success: true, data: offering });
    },
  ),

  listOfferings: withErrorHandling(
    async (request: Request, response: Response) => {
      const query = ListOfferingsQuerySchema.parse(request.query);
      const session = response.locals.session as JwtPayload | undefined;
      const data = session?.data as
        | { id?: string; userRole?: string }
        | undefined;
      if (!data?.id || !data.userRole) {
        throw new MissingSessionError();
      }

      const result = await OfferingsService.list(
        { id: data.id, role: data.userRole },
        {
          ...(query.limit !== undefined ? { limit: query.limit } : {}),
          ...(query.offset !== undefined ? { offset: query.offset } : {}),
          ...(query.type !== undefined ? { type: query.type } : {}),
          ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
          ...(query.search !== undefined ? { search: query.search } : {}),
        },
      );

      response.status(200).send({ success: true, data: result });
    },
  ),

  updateOffering: withErrorHandling(
    async (request: Request, response: Response) => {
      const id = OfferingIdParamSchema.parse(request.params.offeringId);
      const body = UpdateOfferingBodySchema.parse(request.body);

      const updated = await OfferingsService.update(id, body);

      response.status(200).send({ success: true, data: updated });
    },
  ),

  deleteOffering: withErrorHandling(
    async (request: Request, response: Response) => {
      const id = OfferingIdParamSchema.parse(request.params.offeringId);

      const deactivated = await OfferingsService.deactivate(id);

      response.status(200).send({ success: true, data: deactivated });
    },
  ),
};
