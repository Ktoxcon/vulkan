import {
  DuplicateOfferingError,
  OfferingNotFoundError,
} from "@vulkan/errors/offering.errors";
import { UserRoles } from "@vulkan/lib/constants/roles";
import type {
  NewOffering,
  Offering,
} from "@vulkan/lib/db/schema/offerings.types";
import { OfferingsRepository } from "@vulkan/lib/repositories/offerings.repo";
import type { ListOfferingsResult } from "@vulkan/lib/repositories/offerings.repo.types";
import type {
  ListOfferingsInput,
  OfferingActor,
} from "@vulkan/lib/services/offerings.service.types";
import type {
  CreateOfferingBody,
  UpdateOfferingBody,
} from "@vulkan/lib/validators/offering.schemas.types";

export const OfferingsService = {
  async create(input: CreateOfferingBody): Promise<Offering> {
    const existing = await OfferingsRepository.findByNameAndType({
      name: input.name,
      type: input.type,
    });
    if (existing) {
      throw new DuplicateOfferingError();
    }

    return OfferingsRepository.create({
      type: input.type,
      name: input.name,
      basePrice: input.basePrice.toFixed(2),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  },

  async getById(id: string): Promise<Offering> {
    const offering = await OfferingsRepository.findById(id);
    if (!offering) {
      throw new OfferingNotFoundError();
    }
    return offering;
  },

  async list(
    actor: OfferingActor,
    input: ListOfferingsInput,
  ): Promise<ListOfferingsResult> {
    const isActive =
      actor.role === UserRoles.ADMIN ? input.isActive : true;

    return OfferingsRepository.list({
      ...(input.limit !== undefined ? { limit: input.limit } : {}),
      ...(input.offset !== undefined ? { offset: input.offset } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(input.search !== undefined ? { search: input.search } : {}),
    });
  },

  async update(id: string, body: UpdateOfferingBody): Promise<Offering> {
    await OfferingsService.getById(id);

    const patch: Partial<NewOffering> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (body.basePrice !== undefined) {
      patch.basePrice = body.basePrice.toFixed(2);
    }
    if (body.isActive !== undefined) patch.isActive = body.isActive;

    const updated = await OfferingsRepository.update(id, patch);
    if (!updated) {
      throw new OfferingNotFoundError();
    }
    return updated;
  },

  async deactivate(id: string): Promise<Offering> {
    await OfferingsService.getById(id);

    const deactivated = await OfferingsRepository.softDelete(id);
    if (!deactivated) {
      throw new OfferingNotFoundError();
    }
    return deactivated;
  },
};
